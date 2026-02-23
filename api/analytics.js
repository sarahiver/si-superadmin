// api/analytics.js
// Vercel Serverless Function — GA4 Data API Proxy (v2)
// Umfassende Analytics mit Custom Dimension Fallback
// Env Vars: GA4_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_JSON

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
  const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!GA4_PROPERTY_ID || !SERVICE_ACCOUNT_JSON) {
    return res.status(500).json({ error: 'GA4_PROPERTY_ID or GOOGLE_SERVICE_ACCOUNT_JSON not set' });
  }

  try {
    const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
    const accessToken = await getAccessToken(serviceAccount);
    const { period = '30' } = req.body || {};

    const startDate = `${period}daysAgo`;
    const endDate = 'today';
    const prevStartDate = `${parseInt(period) * 2}daysAgo`;
    const prevEndDate = `${parseInt(period) + 1}daysAgo`;

    const [
      overview, overviewPrev,
      pages, referrers, countries, cities, devices, browsers, os,
      landingPages,
      allEvents, formFunnel, blogArticles,
      dailyVisitors, hourlyVisitors,
      themeDetail, packageDetail, demoDetail,
    ] = await Promise.all([
      // 1) Overview (current)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
          { name: 'bounceRate' }, { name: 'averageSessionDuration' },
          { name: 'conversions' }, { name: 'newUsers' }, { name: 'userEngagementDuration' },
          { name: 'sessionsPerUser' }, { name: 'screenPageViewsPerSession' },
        ],
      }),
      // 2) Overview (previous)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
        metrics: [
          { name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
          { name: 'bounceRate' }, { name: 'averageSessionDuration' },
          { name: 'conversions' }, { name: 'newUsers' },
        ],
      }),
      // 3) Top pages
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 25,
      }),
      // 4) Referrers
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' }, { name: 'conversions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }),
      // 5) Countries
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 15,
      }),
      // 6) Cities
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'city' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 15,
      }),
      // 7) Devices
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
      }),
      // 8) Browsers
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'browser' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      }),
      // 9) OS
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'operatingSystem' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 8,
      }),
      // 10) Landing Pages
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'landingPagePlusQueryString' }],
        metrics: [{ name: 'sessions' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),
      // 11) ALL events
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 30,
      }),
      // 12) Form funnel
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { orGroup: { expressions: [
          { filter: { fieldName: 'eventName', stringFilter: { value: 'form_start' } } },
          { filter: { fieldName: 'eventName', stringFilter: { value: 'generate_lead' } } },
          { filter: { fieldName: 'eventName', stringFilter: { value: 'form_error' } } },
        ]}},
      }),
      // 13) Blog articles
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }],
        dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' } } },
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      }),
      // 14) Daily visitors
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'newUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      // 15) Hourly (only for today/yesterday)
      parseInt(period) <= 2 ? runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'hour' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'hour' } }],
      }) : Promise.resolve(null),
      // 16-18) Custom dim queries (safe)
      safeReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:to_theme' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'theme_switch' } } },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      safeReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:package' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'select_item' } } },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      safeReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:demo_url' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'demo_click' } } },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
    ]);

    // Build event summary from allEvents
    const eventsData = parseRows(allEvents, ['event'], ['count', 'users']);
    const ec = (name) => eventsData.find(e => e.event === name)?.count || 0;

    res.status(200).json({
      overview: parseOverview(overview),
      overviewPrev: parseOverview(overviewPrev),
      pages: parseRows(pages, ['pagePath'], ['pageViews', 'users', 'bounceRate', 'avgDuration']),
      referrers: parseRows(referrers, ['source', 'medium'], ['sessions', 'users', 'bounceRate', 'conversions']),
      countries: parseRows(countries, ['country'], ['users', 'sessions']),
      cities: parseRows(cities, ['city'], ['users', 'sessions']),
      devices: parseRows(devices, ['device'], ['users', 'sessions', 'bounceRate', 'avgDuration']),
      browsers: parseRows(browsers, ['browser'], ['users', 'sessions']),
      os: parseRows(os, ['os'], ['users']),
      landingPages: parseRows(landingPages, ['page'], ['sessions', 'bounceRate', 'avgDuration']),
      allEvents: eventsData,
      eventSummary: {
        themeSwitches: ec('theme_switch'), demoClicks: ec('demo_click'),
        selectItem: ec('select_item'), formStart: ec('form_start'),
        generateLead: ec('generate_lead'), formError: ec('form_error'),
        ctaClick: ec('cta_click'), scrollEvents: ec('scroll'),
      },
      formFunnel: parseRows(formFunnel, ['event'], ['count']),
      blogArticles: parseRows(blogArticles, ['pagePath'], ['views', 'users', 'avgDuration']),
      dailyVisitors: parseRows(dailyVisitors, ['date'], ['users', 'sessions', 'pageViews', 'newUsers']),
      hourlyVisitors: hourlyVisitors ? parseRows(hourlyVisitors, ['hour'], ['users', 'sessions']) : null,
      themeDetail: themeDetail ? parseRows(themeDetail, ['theme'], ['clicks']) : null,
      packageDetail: packageDetail ? parseRows(packageDetail, ['package'], ['clicks']) : null,
      demoDetail: demoDetail ? parseRows(demoDetail, ['url'], ['clicks']) : null,
      hasCustomDims: themeDetail !== null,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
}

async function runReport(token, prop, body) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.text(); throw new Error(`GA4 ${r.status}: ${e}`); }
  return r.json();
}

async function safeReport(token, prop, body) {
  try {
    const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

function parseOverview(report) {
  if (!report?.rows?.[0]) return {};
  const v = report.rows[0].metricValues || [], h = report.metricHeaders || [], r = {};
  h.forEach((x, i) => { r[x.name] = parseFloat(v[i]?.value || 0); });
  return r;
}

function parseRows(report, dimNames, metricNames) {
  if (!report?.rows) return [];
  return report.rows.map(row => {
    const item = {};
    (row.dimensionValues || []).forEach((d, i) => { item[dimNames[i] || `dim${i}`] = d.value; });
    (row.metricValues || []).forEach((m, i) => { item[metricNames[i] || `metric${i}`] = parseFloat(m.value || 0); });
    return item;
  });
}

async function getAccessToken(sa) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claims = base64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = await signRS256(`${header}.${claims}`, sa.private_key);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${claims}.${sig}` });
  if (!r.ok) { const e = await r.text(); throw new Error(`Token: ${e}`); }
  return (await r.json()).access_token;
}

function base64url(s) { return Buffer.from(s).toString('base64url'); }
async function signRS256(input, pem) { const c = await import('crypto'); const s = c.createSign('RSA-SHA256'); s.update(input); return s.sign(pem, 'base64url'); }
