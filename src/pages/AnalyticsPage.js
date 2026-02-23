// src/pages/AnalyticsPage.js
// S&I. Analytics Dashboard v2 — Comprehensive GA4 Integration
import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import Layout from '../components/Layout';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5', blue: '#3B82F6', purple: '#8B5CF6' };

const PERIODS = [
  { value: '1', label: 'Heute' },
  { value: '2', label: 'Gestern' },
  { value: '7', label: '7 Tage' },
  { value: '14', label: '14 Tage' },
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
];

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================
function Collapsible({ title, icon, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <CollapsibleWrap>
      <CollapsibleHeader onClick={() => setOpen(!open)}>
        <CollapsibleLeft>
          <CollapsibleIcon>{icon}</CollapsibleIcon>
          <CollapsibleTitle>{title}</CollapsibleTitle>
          {badge && <CollapsibleBadge>{badge}</CollapsibleBadge>}
        </CollapsibleLeft>
        <CollapsibleArrow $open={open}>▸</CollapsibleArrow>
      </CollapsibleHeader>
      {open && <CollapsibleContent>{children}</CollapsibleContent>}
    </CollapsibleWrap>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period }) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to fetch'); }
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const fmt = (n) => { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return Math.round(n).toLocaleString('de-DE'); };
  const pct = (n) => (n * 100).toFixed(1) + '%';
  const dur = (s) => s < 60 ? Math.round(s) + 's' : Math.floor(s/60) + 'm ' + Math.round(s%60) + 's';
  const change = (c, p) => (!p || p === 0) ? null : ((c - p) / p * 100).toFixed(1);
  const ev = (name) => data?.eventSummary?.[name] || 0;
  const funnelVal = (name) => (data?.formFunnel || []).find(f => f.event === name)?.count || 0;

  return (
    <Layout>
      <Header>
        <div>
          <h1>Analytics</h1>
          <p>Marketing Performance — www.sarahiver.com</p>
        </div>
        <HeaderRight>
          <PeriodSelector>
            {PERIODS.map(p => (
              <PeriodBtn key={p.value} $active={period === p.value} onClick={() => setPeriod(p.value)}>{p.label}</PeriodBtn>
            ))}
          </PeriodSelector>
          <RefreshBtn onClick={fetchAnalytics} disabled={loading}>↻</RefreshBtn>
        </HeaderRight>
      </Header>

      {loading && !data && <LoadingState><Spinner /><span>Daten werden geladen...</span></LoadingState>}
      {error && <ErrorState>⚠️ {error}<br/><small>Stelle sicher, dass GA4_PROPERTY_ID und GOOGLE_SERVICE_ACCOUNT_JSON in Vercel gesetzt sind.</small></ErrorState>}

      {data && (
        <>
          {/* ============ KPI OVERVIEW ============ */}
          <KPIGrid>
            <KPICard>
              <KPILabel>Besucher</KPILabel>
              <KPIValue>{fmt(data.overview?.activeUsers || 0)}</KPIValue>
              <Change value={change(data.overview?.activeUsers, data.overviewPrev?.activeUsers)} />
              <KPISub>{fmt(data.overview?.newUsers || 0)} neue</KPISub>
            </KPICard>
            <KPICard>
              <KPILabel>Sessions</KPILabel>
              <KPIValue>{fmt(data.overview?.sessions || 0)}</KPIValue>
              <Change value={change(data.overview?.sessions, data.overviewPrev?.sessions)} />
              <KPISub>{(data.overview?.sessionsPerUser || 0).toFixed(1)} / Nutzer</KPISub>
            </KPICard>
            <KPICard>
              <KPILabel>Seitenaufrufe</KPILabel>
              <KPIValue>{fmt(data.overview?.screenPageViews || 0)}</KPIValue>
              <Change value={change(data.overview?.screenPageViews, data.overviewPrev?.screenPageViews)} />
              <KPISub>{(data.overview?.screenPageViewsPerSession || 0).toFixed(1)} / Session</KPISub>
            </KPICard>
            <KPICard>
              <KPILabel>Bounce Rate</KPILabel>
              <KPIValue>{pct(data.overview?.bounceRate || 0)}</KPIValue>
              <Change value={change(data.overview?.bounceRate, data.overviewPrev?.bounceRate)} invert />
            </KPICard>
            <KPICard>
              <KPILabel>Ø Verweildauer</KPILabel>
              <KPIValue>{dur(data.overview?.averageSessionDuration || 0)}</KPIValue>
              <Change value={change(data.overview?.averageSessionDuration, data.overviewPrev?.averageSessionDuration)} />
            </KPICard>
            <KPICard $hl>
              <KPILabel>Conversion Rate</KPILabel>
              <KPIValue $accent>{data.overview?.activeUsers ? ((funnelVal('generate_lead') / data.overview.activeUsers) * 100).toFixed(2) + '%' : '0%'}</KPIValue>
              <KPISub>{funnelVal('generate_lead')} Anfragen</KPISub>
            </KPICard>
          </KPIGrid>

          {/* ============ VISITOR CHART ============ */}
          {(data.dailyVisitors?.length > 1 || data.hourlyVisitors) && (
            <ChartSection>
              <SectionTitle>Besucher-Verlauf</SectionTitle>
              <ChartContainer>
                <VisitorChart
                  data={data.hourlyVisitors || data.dailyVisitors}
                  isHourly={!!data.hourlyVisitors}
                />
              </ChartContainer>
            </ChartSection>
          )}

          {/* ============ CONVERSION FUNNEL ============ */}
          <Collapsible title="Conversion Funnel" icon="🎯" defaultOpen={true}>
            <FunnelGrid>
              <FunnelStep><FunnelNum>{fmt(data.overview?.activeUsers || 0)}</FunnelNum><FunnelLbl>Besucher</FunnelLbl></FunnelStep>
              <FunnelArr>→</FunnelArr>
              <FunnelStep>
                <FunnelNum>{ev('themeSwitches')}</FunnelNum><FunnelLbl>Theme gewechselt</FunnelLbl>
                <FunnelPct>{data.overview?.activeUsers ? ((ev('themeSwitches') / data.overview.activeUsers) * 100).toFixed(1) + '%' : '—'}</FunnelPct>
              </FunnelStep>
              <FunnelArr>→</FunnelArr>
              <FunnelStep>
                <FunnelNum>{ev('demoClicks')}</FunnelNum><FunnelLbl>Demo angesehen</FunnelLbl>
                <FunnelPct>{data.overview?.activeUsers ? ((ev('demoClicks') / data.overview.activeUsers) * 100).toFixed(1) + '%' : '—'}</FunnelPct>
              </FunnelStep>
              <FunnelArr>→</FunnelArr>
              <FunnelStep>
                <FunnelNum>{ev('selectItem')}</FunnelNum><FunnelLbl>Paket gewählt</FunnelLbl>
                <FunnelPct>{data.overview?.activeUsers ? ((ev('selectItem') / data.overview.activeUsers) * 100).toFixed(1) + '%' : '—'}</FunnelPct>
              </FunnelStep>
              <FunnelArr>→</FunnelArr>
              <FunnelStep>
                <FunnelNum>{ev('formStart')}</FunnelNum><FunnelLbl>Formular gestartet</FunnelLbl>
                <FunnelPct>{ev('selectItem') ? ((ev('formStart') / ev('selectItem')) * 100).toFixed(0) + '%' : '—'}</FunnelPct>
              </FunnelStep>
              <FunnelArr>→</FunnelArr>
              <FunnelStep $hl>
                <FunnelNum>{ev('generateLead')}</FunnelNum><FunnelLbl>Anfrage gesendet</FunnelLbl>
                <FunnelPct>{ev('formStart') ? ((ev('generateLead') / ev('formStart')) * 100).toFixed(0) + '% abgeschlossen' : '—'}</FunnelPct>
              </FunnelStep>
            </FunnelGrid>
            {ev('formError') > 0 && <FunnelWarn>⚠ {ev('formError')} Formular-Fehler im Zeitraum</FunnelWarn>}
          </Collapsible>

          {/* ============ THEMES & PACKAGES ============ */}
          <Collapsible title="Themes & Pakete" icon="🎨" defaultOpen={true}
            badge={data.hasCustomDims ? '✓ Custom Dims aktiv' : null}>
            {data.hasCustomDims ? (
              <ThreeCol>
                <Panel>
                  <PanelTitle>Beliebteste Themes</PanelTitle>
                  {(data.themeDetail || []).filter(t => t.theme && t.theme !== '(not set)').length > 0 ? (
                    <BarList>{data.themeDetail.filter(t => t.theme && t.theme !== '(not set)').map((t, i) => {
                      const mx = Math.max(...data.themeDetail.map(x => x.clicks));
                      return <BarItem key={i}><BarLbl>{t.theme}</BarLbl><BarTrack><BarFill $w={(t.clicks/mx)*100} $c={themeColor(t.theme)} /></BarTrack><BarVal>{t.clicks}</BarVal></BarItem>;
                    })}</BarList>
                  ) : <NoData>Noch keine Theme-Wechsel</NoData>}
                </Panel>
                <Panel>
                  <PanelTitle>Paket-Interesse</PanelTitle>
                  {(data.packageDetail || []).filter(p => p.package && p.package !== '(not set)').length > 0 ? (
                    <BarList>{data.packageDetail.filter(p => p.package && p.package !== '(not set)').map((p, i) => {
                      const mx = Math.max(...data.packageDetail.map(x => x.clicks));
                      const c = p.package === 'Premium' ? colors.red : p.package === 'Standard' ? colors.blue : colors.gray;
                      return <BarItem key={i}><BarLbl>{p.package}</BarLbl><BarTrack><BarFill $w={(p.clicks/mx)*100} $c={c} /></BarTrack><BarVal>{p.clicks}</BarVal></BarItem>;
                    })}</BarList>
                  ) : <NoData>Noch keine Paket-Klicks</NoData>}
                </Panel>
                <Panel>
                  <PanelTitle>Demo-Klicks</PanelTitle>
                  {(data.demoDetail || []).filter(d => d.url && d.url !== '(not set)').length > 0 ? (
                    <BarList>{data.demoDetail.filter(d => d.url && d.url !== '(not set)').map((d, i) => {
                      const mx = Math.max(...data.demoDetail.map(x => x.clicks));
                      return <BarItem key={i}><BarLbl title={d.url}>{d.url.replace('https://','').replace('http://','')}</BarLbl><BarTrack><BarFill $w={(d.clicks/mx)*100} $c={colors.purple} /></BarTrack><BarVal>{d.clicks}</BarVal></BarItem>;
                    })}</BarList>
                  ) : <NoData>Noch keine Demo-Klicks</NoData>}
                </Panel>
              </ThreeCol>
            ) : (
              /* Fallback: Event counts only */
              <>
                <EventGrid>
                  <EventCard><EventEmoji>🎨</EventEmoji><EventLabel>Theme-Wechsel</EventLabel><EventNum>{ev('themeSwitches')}</EventNum></EventCard>
                  <EventCard><EventEmoji>👁️</EventEmoji><EventLabel>Demo-Klicks</EventLabel><EventNum>{ev('demoClicks')}</EventNum></EventCard>
                  <EventCard><EventEmoji>💰</EventEmoji><EventLabel>Paket-Klicks</EventLabel><EventNum>{ev('selectItem')}</EventNum></EventCard>
                  <EventCard><EventEmoji>📝</EventEmoji><EventLabel>Blog CTAs</EventLabel><EventNum>{ev('ctaClick')}</EventNum></EventCard>
                </EventGrid>
                <CDHint>
                  <strong>💡 Detaillierte Aufschlüsselung aktivieren:</strong> GA4 → Verwaltung → Benutzerdefinierte Definitionen → Erstellen:
                  <CDList>
                    <li><code>to_theme</code> (Ereignis) — Welches Theme gewählt wurde</li>
                    <li><code>package</code> (Ereignis) — Welches Paket angeklickt wurde</li>
                    <li><code>demo_url</code> (Ereignis) — Welche Demo angesehen wurde</li>
                  </CDList>
                </CDHint>
              </>
            )}
          </Collapsible>

          {/* ============ TRAFFIC SOURCES ============ */}
          <Collapsible title="Traffic-Quellen" icon="🔗" defaultOpen={true}>
            <Table>
              <thead><tr><th>Quelle</th><th>Medium</th><th>Sessions</th><th>Nutzer</th><th>Bounce</th></tr></thead>
              <tbody>
                {(data.referrers || []).slice(0, 15).map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.source === '(direct)' ? '🔗 Direkt' : r.source === '(not set)' ? '❓ Unbekannt' : r.source}</strong></td>
                    <td><Badge $t={r.medium}>{r.medium}</Badge></td>
                    <td>{fmt(r.sessions)}</td>
                    <td>{fmt(r.users)}</td>
                    <td>{pct(r.bounceRate)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Collapsible>

          {/* ============ TOP PAGES ============ */}
          <Collapsible title="Top Seiten" icon="📄" defaultOpen={true}>
            <Table>
              <thead><tr><th>Seite</th><th>Views</th><th>Nutzer</th><th>Bounce</th><th>Ø Dauer</th></tr></thead>
              <tbody>
                {(data.pages || []).slice(0, 15).map((p, i) => (
                  <tr key={i}>
                    <td><PagePath>{p.pagePath}</PagePath></td>
                    <td>{fmt(p.pageViews)}</td>
                    <td>{fmt(p.users)}</td>
                    <td>{pct(p.bounceRate)}</td>
                    <td>{dur(p.avgDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Collapsible>

          {/* ============ LANDING PAGES ============ */}
          <Collapsible title="Landing Pages" icon="🚪" badge="Erste Seite beim Besuch">
            <Table>
              <thead><tr><th>Seite</th><th>Sessions</th><th>Bounce</th><th>Ø Dauer</th></tr></thead>
              <tbody>
                {(data.landingPages || []).slice(0, 10).map((p, i) => (
                  <tr key={i}>
                    <td><PagePath>{p.page}</PagePath></td>
                    <td>{fmt(p.sessions)}</td>
                    <td>{pct(p.bounceRate)}</td>
                    <td>{dur(p.avgDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Collapsible>

          {/* ============ BLOG ============ */}
          {(data.blogArticles || []).length > 0 && (
            <Collapsible title="Blog Performance" icon="📝" badge={`${data.blogArticles.length} Artikel`}>
              <Table>
                <thead><tr><th>Artikel</th><th>Views</th><th>Nutzer</th><th>Ø Lesezeit</th></tr></thead>
                <tbody>
                  {data.blogArticles.filter(a => a.pagePath !== '/blog' && a.pagePath !== '/blog/').slice(0, 15).map((a, i) => (
                    <tr key={i}>
                      <td><PagePath>{a.pagePath.replace('/blog/', '').replace(/-/g, ' ')}</PagePath></td>
                      <td>{fmt(a.views)}</td>
                      <td>{fmt(a.users)}</td>
                      <td>{dur(a.avgDuration)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Collapsible>
          )}

          {/* ============ AUDIENCE ============ */}
          <Collapsible title="Zielgruppe & Demografie" icon="👥">
            <ThreeCol>
              <Panel>
                <PanelTitle>🌍 Länder</PanelTitle>
                <BarList>
                  {(data.countries || []).slice(0, 10).map((c, i) => {
                    const mx = Math.max(...(data.countries || []).map(x => x.users), 1);
                    return <BarItem key={i}><BarLbl>{c.country}</BarLbl><BarTrack><BarFill $w={(c.users/mx)*100} $c={colors.black} /></BarTrack><BarVal>{c.users}</BarVal></BarItem>;
                  })}
                </BarList>
              </Panel>
              <Panel>
                <PanelTitle>🏙️ Städte</PanelTitle>
                <BarList>
                  {(data.cities || []).filter(c => c.city !== '(not set)').slice(0, 10).map((c, i) => {
                    const mx = Math.max(...(data.cities || []).filter(x => x.city !== '(not set)').map(x => x.users), 1);
                    return <BarItem key={i}><BarLbl>{c.city}</BarLbl><BarTrack><BarFill $w={(c.users/mx)*100} $c={colors.blue} /></BarTrack><BarVal>{c.users}</BarVal></BarItem>;
                  })}
                </BarList>
              </Panel>
              <Panel>
                <PanelTitle>📱 Geräte</PanelTitle>
                {(data.devices || []).map((d, i) => {
                  const icon = d.device === 'mobile' ? '📱' : d.device === 'desktop' ? '💻' : '📟';
                  const total = (data.devices || []).reduce((s, x) => s + x.users, 0) || 1;
                  return (
                    <DevRow key={i}>
                      <DevIcon>{icon}</DevIcon>
                      <DevInfo>
                        <DevName>{d.device} — {pct(d.users / total)}</DevName>
                        <DevBar><DevBarFill $w={(d.users / total) * 100} /></DevBar>
                        <DevMeta>Bounce: {pct(d.bounceRate)} · Ø {dur(d.avgDuration)}</DevMeta>
                      </DevInfo>
                      <DevVal>{d.users}</DevVal>
                    </DevRow>
                  );
                })}
              </Panel>
            </ThreeCol>
          </Collapsible>

          {/* ============ TECH ============ */}
          <Collapsible title="Technik" icon="⚙️">
            <TwoCol>
              <Panel>
                <PanelTitle>🌐 Browser</PanelTitle>
                <BarList>
                  {(data.browsers || []).slice(0, 8).map((b, i) => {
                    const mx = Math.max(...(data.browsers || []).map(x => x.users), 1);
                    return <BarItem key={i}><BarLbl>{b.browser}</BarLbl><BarTrack><BarFill $w={(b.users/mx)*100} $c={colors.gray} /></BarTrack><BarVal>{b.users}</BarVal></BarItem>;
                  })}
                </BarList>
              </Panel>
              <Panel>
                <PanelTitle>💿 Betriebssysteme</PanelTitle>
                <BarList>
                  {(data.os || []).slice(0, 8).map((o, i) => {
                    const mx = Math.max(...(data.os || []).map(x => x.users), 1);
                    return <BarItem key={i}><BarLbl>{o.os}</BarLbl><BarTrack><BarFill $w={(o.users/mx)*100} $c={colors.purple} /></BarTrack><BarVal>{o.users}</BarVal></BarItem>;
                  })}
                </BarList>
              </Panel>
            </TwoCol>
          </Collapsible>

          {/* ============ ALL EVENTS ============ */}
          <Collapsible title="Alle Events" icon="📊" badge={`${(data.allEvents || []).length} Events`}>
            <Table>
              <thead><tr><th>Event</th><th>Anzahl</th><th>Nutzer</th></tr></thead>
              <tbody>
                {(data.allEvents || []).map((e, i) => (
                  <tr key={i}>
                    <td><EventTag $custom={!['page_view','session_start','first_visit','scroll','user_engagement','click'].includes(e.event)}>{e.event}</EventTag></td>
                    <td>{fmt(e.count)}</td>
                    <td>{fmt(e.users)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Collapsible>

          <Footer>GA4 · Letzte Aktualisierung: {new Date().toLocaleString('de-DE')} · {loading ? 'Lädt...' : 'Bereit'}</Footer>
        </>
      )}
    </Layout>
  );
}

// ============================================
// VISITOR CHART
// ============================================
function VisitorChart({ data, isHourly }) {
  if (!data || data.length === 0) return null;
  const values = data.map(d => d.users);
  const max = Math.max(...values, 1);
  const total = values.reduce((s, v) => s + v, 0);
  const avg = Math.round(total / values.length);

  const fmtLabel = (d) => {
    if (isHourly) return d.hour + ':00';
    if (!d.date || d.date.length !== 8) return d.date;
    return `${d.date.slice(6,8)}.${d.date.slice(4,6)}.`;
  };

  const pad = { top: 12, right: 12, bottom: 30, left: 38 };
  const W = 800, H = 200;
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;

  const pts = values.map((v, i) => ({
    x: pad.left + (i / Math.max(values.length - 1, 1)) * cW,
    y: pad.top + cH - (v / max) * cH,
    v, d: data[i],
  }));
  const line = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `${pad.left},${pad.top + cH} ${line} ${pad.left + cW},${pad.top + cH}`;

  const yTicks = [0, Math.round(max / 2), max];
  const lblCount = Math.min(isHourly ? 12 : 7, data.length);
  const xLabels = [];
  for (let i = 0; i < lblCount; i++) {
    const idx = Math.round(i * (data.length - 1) / Math.max(lblCount - 1, 1));
    xLabels.push({ label: fmtLabel(data[idx]), x: pts[idx]?.x });
  }

  return (
    <>
      <ChartStats>
        <CStat><CStatLbl>Gesamt</CStatLbl><CStatVal>{total}</CStatVal></CStat>
        <CStat><CStatLbl>Ø / {isHourly ? 'Stunde' : 'Tag'}</CStatLbl><CStatVal>{avg}</CStatVal></CStat>
        <CStat><CStatLbl>Peak</CStatLbl><CStatVal>{max}</CStatVal></CStat>
        {data[0]?.newUsers !== undefined && <CStat><CStatLbl>Neue gesamt</CStatLbl><CStatVal>{data.reduce((s, d) => s + (d.newUsers || 0), 0)}</CStatVal></CStat>}
      </ChartStats>
      <ChartSVG viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {yTicks.map((t, i) => { const y = pad.top + cH - (t / max) * cH; return (
          <g key={i}><line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#e5e5e5" strokeWidth="0.5" /><text x={pad.left - 5} y={y + 3} textAnchor="end" fill="#999" fontSize="9" fontFamily="Inter">{t}</text></g>
        ); })}
        {xLabels.map((l, i) => <text key={i} x={l.x} y={H - 6} textAnchor="middle" fill="#999" fontSize="8" fontFamily="Inter">{l.label}</text>)}
        <polygon points={area} fill="rgba(196,30,58,0.06)" />
        <polyline points={line} fill="none" stroke={colors.red} strokeWidth="1.5" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={colors.white} stroke={colors.red} strokeWidth="1"><title>{fmtLabel(p.d)}: {p.v} Besucher</title></circle>)}
      </ChartSVG>
    </>
  );
}

function Change({ value, invert }) {
  if (value === null || value === undefined) return null;
  const n = parseFloat(value);
  const pos = invert ? n < 0 : n > 0;
  const neg = invert ? n > 0 : n < 0;
  return <ChangeSpan $pos={pos} $neg={neg}>{n > 0 ? '↑' : n < 0 ? '↓' : '→'} {Math.abs(n)}%</ChangeSpan>;
}

function themeColor(t) {
  const m = { editorial:'#C41E3A', botanical:'#2D5016', contemporary:'#333', luxe:'#B8860B', neon:'#00FF88', classic:'#1a1a1a', video:'#6B21A8', modern:'#0066FF', parallax:'#FF6B35' };
  return m[t?.toLowerCase()] || colors.gray;
}

// ============================================
// STYLED COMPONENTS
// ============================================
const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;

const Header = styled.div`display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;
  h1{font-family:'Oswald',sans-serif;font-size:2rem;font-weight:700;text-transform:uppercase;color:${colors.black};margin:0}
  p{font-family:'Source Serif 4',serif;font-style:italic;color:${colors.gray};font-size:1rem;margin:.25rem 0 0}`;
const HeaderRight = styled.div`display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;`;
const PeriodSelector = styled.div`display:flex;border:2px solid ${colors.black};flex-wrap:wrap;`;
const PeriodBtn = styled.button`font-family:'Inter',sans-serif;font-size:.65rem;font-weight:${p=>p.$active?600:400};padding:.45rem .8rem;cursor:pointer;border:none;background:${p=>p.$active?colors.black:'transparent'};color:${p=>p.$active?colors.white:colors.black};transition:all .15s;&:hover{background:${p=>p.$active?colors.black:colors.lightGray}}`;
const RefreshBtn = styled.button`font-size:1.2rem;padding:.35rem .6rem;cursor:pointer;border:2px solid ${colors.black};background:transparent;transition:all .15s;&:hover{background:${colors.black};color:${colors.white}}&:disabled{opacity:.4}`;
const LoadingState = styled.div`display:flex;align-items:center;justify-content:center;gap:1rem;padding:6rem 2rem;color:${colors.gray};font-family:'Inter',sans-serif;`;
const Spinner = styled.div`width:24px;height:24px;border:3px solid ${colors.lightGray};border-top-color:${colors.red};border-radius:50%;animation:${spin} .8s linear infinite;`;
const ErrorState = styled.div`background:#FEF2F2;border:2px solid ${colors.red};padding:1.5rem;font-family:'Inter',sans-serif;font-size:.85rem;color:${colors.red};small{color:${colors.gray};display:block;margin-top:.5rem}`;

// KPIs
const KPIGrid = styled.div`display:grid;grid-template-columns:repeat(6,1fr);gap:1rem;margin-bottom:2rem;@media(max-width:1200px){grid-template-columns:repeat(3,1fr)}@media(max-width:600px){grid-template-columns:repeat(2,1fr)}`;
const KPICard = styled.div`background:${colors.white};border:2px solid ${p=>p.$hl?colors.red:colors.black};padding:1.15rem;`;
const KPILabel = styled.div`font-family:'Inter',sans-serif;font-size:.58rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:${colors.gray};margin-bottom:.3rem;`;
const KPIValue = styled.div`font-family:'Oswald',sans-serif;font-size:1.85rem;font-weight:600;color:${p=>p.$accent?colors.red:colors.black};line-height:1;`;
const KPISub = styled.div`font-family:'Inter',sans-serif;font-size:.68rem;color:${colors.gray};margin-top:.3rem;`;
const ChangeSpan = styled.span`font-family:'Inter',sans-serif;font-size:.62rem;font-weight:600;color:${p=>p.$pos?colors.green:p.$neg?colors.red:colors.gray};display:block;margin-top:.2rem;`;

// Collapsible
const CollapsibleWrap = styled.div`margin-bottom:1rem;border:2px solid ${colors.black};background:${colors.white};`;
const CollapsibleHeader = styled.div`display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;cursor:pointer;user-select:none;&:hover{background:rgba(0,0,0,.02)}`;
const CollapsibleLeft = styled.div`display:flex;align-items:center;gap:.75rem;`;
const CollapsibleIcon = styled.span`font-size:1.15rem;`;
const CollapsibleTitle = styled.h2`font-family:'Oswald',sans-serif;font-size:1rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:${colors.black};margin:0;`;
const CollapsibleBadge = styled.span`font-family:'Inter',sans-serif;font-size:.6rem;font-weight:500;padding:.2rem .5rem;background:rgba(16,185,129,.1);color:${colors.green};letter-spacing:.02em;`;
const CollapsibleArrow = styled.span`font-size:1rem;color:${colors.gray};transition:transform .2s;transform:rotate(${p=>p.$open?'90deg':'0'});`;
const CollapsibleContent = styled.div`padding:0 1.25rem 1.25rem;`;

// Sections & Layout
const ChartSection = styled.div`margin-bottom:1.5rem;`;
const SectionTitle = styled.h2`font-family:'Oswald',sans-serif;font-size:1.1rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${colors.black};margin-bottom:.75rem;display:flex;align-items:center;gap:1rem;&::after{content:'';flex:1;height:2px;background:${colors.lightGray}}`;
const ChartContainer = styled.div`background:${colors.white};border:2px solid ${colors.black};padding:1.25rem;`;
const TwoCol = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;@media(max-width:900px){grid-template-columns:1fr}`;
const ThreeCol = styled.div`display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;@media(max-width:1000px){grid-template-columns:1fr}`;
const Panel = styled.div`background:${colors.background};padding:1.25rem;`;
const PanelTitle = styled.h3`font-family:'Oswald',sans-serif;font-size:.9rem;font-weight:600;text-transform:uppercase;margin:0 0 .75rem;`;
const NoData = styled.div`font-family:'Inter',sans-serif;font-size:.8rem;color:${colors.gray};padding:1rem 0;text-align:center;`;

// Chart
const ChartStats = styled.div`display:flex;gap:2rem;margin-bottom:.75rem;`;
const CStat = styled.div``;
const CStatLbl = styled.div`font-family:'Inter',sans-serif;font-size:.55rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${colors.gray};`;
const CStatVal = styled.div`font-family:'Oswald',sans-serif;font-size:1.35rem;font-weight:600;color:${colors.black};line-height:1.2;`;
const ChartSVG = styled.svg`width:100%;height:200px;`;

// Tables
const Table = styled.table`width:100%;border-collapse:collapse;font-family:'Inter',sans-serif;font-size:.78rem;
  th{font-size:.58rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${colors.gray};text-align:left;padding:.5rem .6rem;border-bottom:2px solid ${colors.black}}
  td{padding:.55rem .6rem;border-bottom:1px solid ${colors.lightGray};color:${colors.black}}
  tr:hover td{background:rgba(0,0,0,.015)}`;
const PagePath = styled.span`font-size:.72rem;font-family:'JetBrains Mono',monospace,'Inter',sans-serif;word-break:break-all;`;
const Badge = styled.span`font-size:.58rem;font-weight:600;padding:.12rem .4rem;text-transform:uppercase;letter-spacing:.04em;
  background:${p=>p.$t==='organic'?'rgba(16,185,129,.1)':p.$t==='referral'?'rgba(59,130,246,.1)':p.$t==='cpc'?'rgba(245,158,11,.1)':'rgba(0,0,0,.04)'};
  color:${p=>p.$t==='organic'?colors.green:p.$t==='referral'?colors.blue:p.$t==='cpc'?colors.orange:colors.gray};`;
const EventTag = styled.code`font-size:.72rem;padding:.1rem .35rem;background:${p=>p.$custom?'rgba(196,30,58,.06)':'rgba(0,0,0,.04)'};color:${p=>p.$custom?colors.red:colors.gray};font-family:'JetBrains Mono',monospace;`;

// Bar charts
const BarList = styled.div`display:flex;flex-direction:column;gap:.55rem;`;
const BarItem = styled.div`display:grid;grid-template-columns:85px 1fr 35px;align-items:center;gap:.4rem;`;
const BarLbl = styled.span`font-family:'Inter',sans-serif;font-size:.72rem;font-weight:500;text-transform:capitalize;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const BarTrack = styled.div`height:18px;background:${colors.lightGray};position:relative;overflow:hidden;`;
const BarFill = styled.div`height:100%;width:${p=>p.$w}%;background:${p=>p.$c||colors.black};transition:width .5s ease;`;
const BarVal = styled.span`font-family:'Oswald',sans-serif;font-size:.8rem;font-weight:600;text-align:right;`;

// Funnel
const FunnelGrid = styled.div`display:flex;align-items:center;justify-content:center;gap:.6rem;padding:1.5rem .5rem;flex-wrap:wrap;`;
const FunnelStep = styled.div`text-align:center;padding:.8rem 1rem;background:${p=>p.$hl?'rgba(196,30,58,.04)':'transparent'};border:${p=>p.$hl?`2px solid ${colors.red}`:'none'};min-width:80px;`;
const FunnelNum = styled.div`font-family:'Oswald',sans-serif;font-size:2rem;font-weight:700;color:${colors.black};line-height:1;`;
const FunnelLbl = styled.div`font-family:'Inter',sans-serif;font-size:.62rem;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:${colors.gray};margin-top:.4rem;`;
const FunnelPct = styled.div`font-family:'Inter',sans-serif;font-size:.6rem;color:${colors.green};margin-top:.15rem;`;
const FunnelArr = styled.span`font-size:1.3rem;color:${colors.lightGray};@media(max-width:600px){display:none}`;
const FunnelWarn = styled.div`font-family:'Inter',sans-serif;font-size:.72rem;color:${colors.orange};text-align:center;margin-top:.5rem;`;

// Event cards (fallback)
const EventGrid = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem;@media(max-width:800px){grid-template-columns:repeat(2,1fr)}`;
const EventCard = styled.div`text-align:center;padding:1.25rem;background:${colors.background};`;
const EventEmoji = styled.div`font-size:1.5rem;margin-bottom:.3rem;`;
const EventLabel = styled.div`font-family:'Inter',sans-serif;font-size:.6rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${colors.gray};`;
const EventNum = styled.div`font-family:'Oswald',sans-serif;font-size:2rem;font-weight:600;color:${colors.black};line-height:1.2;`;
const CDHint = styled.div`font-family:'Inter',sans-serif;font-size:.75rem;color:${colors.gray};background:rgba(59,130,246,.04);border:1px solid rgba(59,130,246,.12);padding:.75rem 1rem;code{background:rgba(0,0,0,.06);padding:.1rem .3rem;font-size:.7rem}`;
const CDList = styled.ul`margin:.5rem 0 0;padding-left:1.25rem;li{margin-bottom:.25rem}`;

// Devices
const DevRow = styled.div`display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;`;
const DevIcon = styled.span`font-size:1.4rem;`;
const DevInfo = styled.div`flex:1;`;
const DevName = styled.div`font-family:'Inter',sans-serif;font-size:.78rem;font-weight:500;text-transform:capitalize;margin-bottom:.2rem;`;
const DevBar = styled.div`height:5px;background:${colors.lightGray};width:100%;margin-bottom:.2rem;`;
const DevBarFill = styled.div`height:100%;width:${p=>p.$w}%;background:${colors.black};`;
const DevMeta = styled.div`font-family:'Inter',sans-serif;font-size:.6rem;color:${colors.gray};`;
const DevVal = styled.span`font-family:'Oswald',sans-serif;font-size:1rem;font-weight:600;`;

const Footer = styled.div`font-family:'Inter',sans-serif;font-size:.68rem;color:${colors.gray};text-align:center;padding:1rem 0;border-top:1px solid ${colors.lightGray};margin-top:1rem;`;
