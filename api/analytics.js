// api/analytics.js
// Vercel Serverless Function — GA4 Data API Proxy
// Verwendet Google Service Account für Authentifizierung
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

    // Batch all reports in parallel
    const [
      overview,
      overviewPrev,
      pages,
      referrers,
      countries,
      devices,
      browsers,
      themeEvents,
      packageEvents,
      demoClicks,
      formFunnel,
      blogArticles,
      blogScrollDepth,
      dailyVisitors,
    ] = await Promise.all([
      // 1) Overview metrics (current period)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' },
          { name: 'newUsers' },
          { name: 'userEngagementDuration' },
        ],
      }),

      // 2) Overview metrics (previous period for comparison)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' },
          { name: 'newUsers' },
        ],
      }),

      // 3) Top pages
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      }),

      // 4) Referrers (traffic sources)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'conversions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),

      // 5) Countries
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      }),

      // 6) Devices
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'bounceRate' }],
      }),

      // 7) Browsers
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'browser' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 8,
      }),

      // 8) Theme switch events
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:to_theme' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', stringFilter: { value: 'theme_switch' } },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),

      // 9) Package CTA clicks (select_item)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:package' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', stringFilter: { value: 'select_item' } },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),

      // 10) Demo clicks per theme
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:event_label' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', stringFilter: { value: 'demo_click' } },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),

      // 11) Form funnel (form_start, generate_lead, form_error)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          orGroup: {
            expressions: [
              { filter: { fieldName: 'eventName', stringFilter: { value: 'form_start' } } },
              { filter: { fieldName: 'eventName', stringFilter: { value: 'generate_lead' } } },
              { filter: { fieldName: 'eventName', stringFilter: { value: 'form_error' } } },
            ],
          },
        },
      }),

      // 12) Blog articles by views
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:content_id' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', stringFilter: { value: 'view_item' } },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 15,
      }),

      // 13) Blog scroll depth
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'customEvent:percent_scrolled' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', stringFilter: { value: 'scroll' } },
        },
      }),

      // 14) Daily visitors (for chart)
      runReport(accessToken, GA4_PROPERTY_ID, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    ]);

    res.status(200).json({
      overview: parseOverview(overview),
      overviewPrev: parseOverview(overviewPrev),
      pages: parseRows(pages, ['pagePath'], ['pageViews', 'users', 'bounceRate', 'avgDuration']),
      referrers: parseRows(referrers, ['source', 'medium'], ['sessions', 'users', 'conversions']),
      countries: parseRows(countries, ['country'], ['users', 'sessions']),
      devices: parseRows(devices, ['device'], ['users', 'sessions', 'bounceRate']),
      browsers: parseRows(browsers, ['browser'], ['users']),
      themeInterest: parseRows(themeEvents, ['theme'], ['clicks']),
      packageClicks: parseRows(packageEvents, ['package'], ['clicks']),
      demoClicks: parseRows(demoClicks, ['theme'], ['clicks']),
      formFunnel: parseRows(formFunnel, ['event'], ['count']),
      blogArticles: parseRows(blogArticles, ['slug'], ['views']),
      blogScrollDepth: parseRows(blogScrollDepth, ['percent'], ['count']),
      dailyVisitors: parseRows(dailyVisitors, ['date'], ['users', 'sessions', 'pageViews']),
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
}

// ============================================
// GA4 DATA API HELPERS
// ============================================

async function runReport(accessToken, propertyId, body) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GA4 API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

function parseOverview(report) {
  if (!report?.rows?.[0]) return {};
  const values = report.rows[0].metricValues || [];
  const headers = report.metricHeaders || [];
  const result = {};
  headers.forEach((h, i) => {
    result[h.name] = parseFloat(values[i]?.value || 0);
  });
  return result;
}

function parseRows(report, dimNames, metricNames) {
  if (!report?.rows) return [];
  return report.rows.map(row => {
    const item = {};
    (row.dimensionValues || []).forEach((d, i) => {
      item[dimNames[i] || `dim${i}`] = d.value;
    });
    (row.metricValues || []).forEach((m, i) => {
      item[metricNames[i] || `metric${i}`] = parseFloat(m.value || 0);
    });
    return item;
  });
}

// ============================================
// GOOGLE AUTH (JWT → Access Token)
// ============================================

async function getAccessToken(serviceAccount) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);

  const claimSet = base64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signatureInput = `${header}.${claimSet}`;
  const signature = await signRS256(signatureInput, serviceAccount.private_key);

  const jwt = `${signatureInput}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token error: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

function base64url(str) {
  return Buffer.from(str).toString('base64url');
}

async function signRS256(input, privateKeyPem) {
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(input);
  const signature = sign.sign(privateKeyPem, 'base64url');
  return signature;
}
