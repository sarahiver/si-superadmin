// src/pages/AnalyticsPage.js
// S&I. Analytics Dashboard — GA4 Data Integration
// Zeigt alle relevanten Marketing-KPIs auf einen Blick
import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import Layout from '../components/Layout';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5', blue: '#3B82F6', purple: '#8B5CF6' };

const PERIODS = [
  { value: '7', label: '7 Tage' },
  { value: '14', label: '14 Tage' },
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Helper functions
  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString('de-DE');
  };

  const formatPercent = (n) => (n * 100).toFixed(1) + '%';
  const formatDuration = (seconds) => {
    if (seconds < 60) return Math.round(seconds) + 's';
    return Math.floor(seconds / 60) + 'm ' + Math.round(seconds % 60) + 's';
  };

  const getChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const funnelValue = (eventName) => {
    if (!data?.formFunnel) return 0;
    const item = data.formFunnel.find(f => f.event === eventName);
    return item ? item.count : 0;
  };

  const conversionRate = () => {
    if (!data?.overview?.activeUsers) return '0%';
    const leads = funnelValue('generate_lead');
    return ((leads / data.overview.activeUsers) * 100).toFixed(2) + '%';
  };

  const formCompletionRate = () => {
    const starts = funnelValue('form_start');
    const leads = funnelValue('generate_lead');
    if (!starts) return '0%';
    return ((leads / starts) * 100).toFixed(1) + '%';
  };

  return (
    <Layout>
      <Header>
        <HeaderLeft>
          <h1>Analytics</h1>
          <p>Marketing Performance — www.sarahiver.com</p>
        </HeaderLeft>
        <HeaderRight>
          <PeriodSelector>
            {PERIODS.map(p => (
              <PeriodBtn key={p.value} $active={period === p.value} onClick={() => setPeriod(p.value)}>
                {p.label}
              </PeriodBtn>
            ))}
          </PeriodSelector>
          <RefreshBtn onClick={fetchAnalytics} disabled={loading}>↻</RefreshBtn>
        </HeaderRight>
      </Header>

      {loading && !data && <LoadingState><Spinner /><span>Daten werden geladen...</span></LoadingState>}
      {error && <ErrorState>⚠️ {error}<br/><small>Stelle sicher, dass GA4_PROPERTY_ID und GOOGLE_SERVICE_ACCOUNT_JSON als Env Vars in Vercel gesetzt sind.</small></ErrorState>}

      {data && (
        <>
          {/* ============================================ */}
          {/* KPI OVERVIEW */}
          {/* ============================================ */}
          <KPIGrid>
            <KPICard>
              <KPILabel>Besucher</KPILabel>
              <KPIValue>{formatNumber(data.overview?.activeUsers || 0)}</KPIValue>
              <KPIChange value={getChange(data.overview?.activeUsers, data.overviewPrev?.activeUsers)} />
              <KPISubtext>{formatNumber(data.overview?.newUsers || 0)} neue</KPISubtext>
            </KPICard>
            <KPICard>
              <KPILabel>Sessions</KPILabel>
              <KPIValue>{formatNumber(data.overview?.sessions || 0)}</KPIValue>
              <KPIChange value={getChange(data.overview?.sessions, data.overviewPrev?.sessions)} />
            </KPICard>
            <KPICard>
              <KPILabel>Seitenaufrufe</KPILabel>
              <KPIValue>{formatNumber(data.overview?.screenPageViews || 0)}</KPIValue>
              <KPIChange value={getChange(data.overview?.screenPageViews, data.overviewPrev?.screenPageViews)} />
            </KPICard>
            <KPICard>
              <KPILabel>Bounce Rate</KPILabel>
              <KPIValue>{formatPercent(data.overview?.bounceRate || 0)}</KPIValue>
              <KPIChange value={getChange(data.overview?.bounceRate, data.overviewPrev?.bounceRate)} invert />
            </KPICard>
            <KPICard>
              <KPILabel>Ø Verweildauer</KPILabel>
              <KPIValue>{formatDuration(data.overview?.averageSessionDuration || 0)}</KPIValue>
              <KPIChange value={getChange(data.overview?.averageSessionDuration, data.overviewPrev?.averageSessionDuration)} />
            </KPICard>
            <KPICard $highlight>
              <KPILabel>Conversion Rate</KPILabel>
              <KPIValue $accent>{conversionRate()}</KPIValue>
              <KPISubtext>{funnelValue('generate_lead')} Anfragen</KPISubtext>
            </KPICard>
          </KPIGrid>

          {/* ============================================ */}
          {/* VISITORS CHART */}
          {/* ============================================ */}
          {data.dailyVisitors?.length > 0 && (
            <Section>
              <SectionTitle>Besucher-Verlauf</SectionTitle>
              <ChartContainer>
                <MiniChart data={data.dailyVisitors} />
              </ChartContainer>
            </Section>
          )}

          {/* ============================================ */}
          {/* CONVERSION FUNNEL */}
          {/* ============================================ */}
          <Section>
            <SectionTitle>Conversion Funnel</SectionTitle>
            <FunnelGrid>
              <FunnelStep>
                <FunnelNumber>{formatNumber(data.overview?.activeUsers || 0)}</FunnelNumber>
                <FunnelLabel>Besucher</FunnelLabel>
              </FunnelStep>
              <FunnelArrow>→</FunnelArrow>
              <FunnelStep>
                <FunnelNumber>{funnelValue('form_start')}</FunnelNumber>
                <FunnelLabel>Formular gestartet</FunnelLabel>
                <FunnelRate>{data.overview?.activeUsers ? ((funnelValue('form_start') / data.overview.activeUsers) * 100).toFixed(1) + '%' : '—'}</FunnelRate>
              </FunnelStep>
              <FunnelArrow>→</FunnelArrow>
              <FunnelStep $highlight>
                <FunnelNumber>{funnelValue('generate_lead')}</FunnelNumber>
                <FunnelLabel>Anfragen</FunnelLabel>
                <FunnelRate>{formCompletionRate()} abgeschlossen</FunnelRate>
              </FunnelStep>
              {funnelValue('form_error') > 0 && (
                <FunnelError>⚠ {funnelValue('form_error')} Fehler</FunnelError>
              )}
            </FunnelGrid>
          </Section>

          {/* ============================================ */}
          {/* TWO COLUMN LAYOUT */}
          {/* ============================================ */}
          <TwoCol>
            {/* TRAFFIC SOURCES */}
            <Section>
              <SectionTitle>Traffic-Quellen</SectionTitle>
              <Table>
                <thead><tr><th>Quelle</th><th>Medium</th><th>Sessions</th><th>Nutzer</th></tr></thead>
                <tbody>
                  {(data.referrers || []).slice(0, 10).map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.source === '(direct)' ? 'Direkt' : r.source}</strong></td>
                      <td><Badge $type={r.medium}>{r.medium}</Badge></td>
                      <td>{formatNumber(r.sessions)}</td>
                      <td>{formatNumber(r.users)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Section>

            {/* TOP PAGES */}
            <Section>
              <SectionTitle>Top Seiten</SectionTitle>
              <Table>
                <thead><tr><th>Seite</th><th>Views</th><th>Nutzer</th><th>Bounce</th></tr></thead>
                <tbody>
                  {(data.pages || []).slice(0, 10).map((p, i) => (
                    <tr key={i}>
                      <td><PagePath>{p.pagePath}</PagePath></td>
                      <td>{formatNumber(p.pageViews)}</td>
                      <td>{formatNumber(p.users)}</td>
                      <td>{formatPercent(p.bounceRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Section>
          </TwoCol>

          {/* ============================================ */}
          {/* THEME & PACKAGE PERFORMANCE */}
          {/* ============================================ */}
          <Section>
            <SectionTitle>Theme & Paket Performance</SectionTitle>
            <ThreeCol>
              {/* Theme Interest */}
              <Panel>
                <PanelTitle>🎨 Beliebteste Themes</PanelTitle>
                <PanelSubtitle>Theme-Wechsel durch Besucher</PanelSubtitle>
                {(data.themeInterest || []).length > 0 ? (
                  <BarList>
                    {data.themeInterest.filter(t => t.theme && t.theme !== '(not set)').map((t, i) => {
                      const max = Math.max(...data.themeInterest.map(x => x.clicks));
                      return (
                        <BarItem key={i}>
                          <BarLabel>{t.theme}</BarLabel>
                          <BarTrack><BarFill $width={(t.clicks / max) * 100} $color={getThemeColor(t.theme)} /></BarTrack>
                          <BarValue>{t.clicks}</BarValue>
                        </BarItem>
                      );
                    })}
                  </BarList>
                ) : <NoData>Noch keine Daten</NoData>}
              </Panel>

              {/* Demo Clicks */}
              <Panel>
                <PanelTitle>👁️ Demo-Klicks</PanelTitle>
                <PanelSubtitle>Welche Demos werden angesehen</PanelSubtitle>
                {(data.demoClicks || []).length > 0 ? (
                  <BarList>
                    {data.demoClicks.filter(d => d.theme && d.theme !== '(not set)').map((d, i) => {
                      const max = Math.max(...data.demoClicks.map(x => x.clicks));
                      return (
                        <BarItem key={i}>
                          <BarLabel>{d.theme}</BarLabel>
                          <BarTrack><BarFill $width={(d.clicks / max) * 100} $color={getThemeColor(d.theme)} /></BarTrack>
                          <BarValue>{d.clicks}</BarValue>
                        </BarItem>
                      );
                    })}
                  </BarList>
                ) : <NoData>Noch keine Daten</NoData>}
              </Panel>

              {/* Package Clicks */}
              <Panel>
                <PanelTitle>💰 Paket-Interesse</PanelTitle>
                <PanelSubtitle>CTA-Klicks pro Paket</PanelSubtitle>
                {(data.packageClicks || []).length > 0 ? (
                  <BarList>
                    {data.packageClicks.filter(p => p.package && p.package !== '(not set)').map((p, i) => {
                      const max = Math.max(...data.packageClicks.map(x => x.clicks));
                      const pkgColor = p.package === 'Premium' ? colors.red : p.package === 'Standard' ? colors.blue : colors.gray;
                      return (
                        <BarItem key={i}>
                          <BarLabel>{p.package}</BarLabel>
                          <BarTrack><BarFill $width={(p.clicks / max) * 100} $color={pkgColor} /></BarTrack>
                          <BarValue>{p.clicks}</BarValue>
                        </BarItem>
                      );
                    })}
                  </BarList>
                ) : <NoData>Noch keine Daten</NoData>}
              </Panel>
            </ThreeCol>
          </Section>

          {/* ============================================ */}
          {/* BLOG PERFORMANCE */}
          {/* ============================================ */}
          {(data.blogArticles || []).length > 0 && (
            <Section>
              <SectionTitle>Blog Performance</SectionTitle>
              <TwoCol>
                <Panel>
                  <PanelTitle>📝 Top Artikel</PanelTitle>
                  <Table $compact>
                    <thead><tr><th>Artikel</th><th>Views</th></tr></thead>
                    <tbody>
                      {data.blogArticles.filter(a => a.slug && a.slug !== '(not set)').slice(0, 10).map((a, i) => (
                        <tr key={i}>
                          <td><PagePath>{a.slug.replace(/-/g, ' ')}</PagePath></td>
                          <td>{a.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Panel>

                <Panel>
                  <PanelTitle>📊 Scroll-Tiefe (Blog)</PanelTitle>
                  <PanelSubtitle>Wie weit lesen Besucher</PanelSubtitle>
                  <BarList>
                    {['25', '50', '75', '100'].map(pct => {
                      const item = (data.blogScrollDepth || []).find(d => d.percent === pct);
                      const count = item ? item.count : 0;
                      const max = Math.max(...(data.blogScrollDepth || []).map(d => d.count), 1);
                      return (
                        <BarItem key={pct}>
                          <BarLabel>{pct}%</BarLabel>
                          <BarTrack><BarFill $width={(count / max) * 100} $color={pct === '100' ? colors.green : pct === '75' ? colors.blue : colors.orange} /></BarTrack>
                          <BarValue>{count}</BarValue>
                        </BarItem>
                      );
                    })}
                  </BarList>
                </Panel>
              </TwoCol>
            </Section>
          )}

          {/* ============================================ */}
          {/* DEMOGRAPHICS */}
          {/* ============================================ */}
          <Section>
            <SectionTitle>Zielgruppe</SectionTitle>
            <ThreeCol>
              <Panel>
                <PanelTitle>🌍 Länder</PanelTitle>
                <BarList>
                  {(data.countries || []).slice(0, 8).map((c, i) => {
                    const max = Math.max(...(data.countries || []).map(x => x.users));
                    return (
                      <BarItem key={i}>
                        <BarLabel>{c.country}</BarLabel>
                        <BarTrack><BarFill $width={(c.users / max) * 100} $color={colors.black} /></BarTrack>
                        <BarValue>{c.users}</BarValue>
                      </BarItem>
                    );
                  })}
                </BarList>
              </Panel>

              <Panel>
                <PanelTitle>📱 Geräte</PanelTitle>
                {(data.devices || []).map((d, i) => {
                  const icon = d.device === 'mobile' ? '📱' : d.device === 'desktop' ? '💻' : '📟';
                  const total = (data.devices || []).reduce((s, x) => s + x.users, 0);
                  return (
                    <DeviceRow key={i}>
                      <DeviceIcon>{icon}</DeviceIcon>
                      <DeviceInfo>
                        <DeviceName>{d.device}</DeviceName>
                        <DeviceBar><DeviceBarFill $width={(d.users / total) * 100} /></DeviceBar>
                      </DeviceInfo>
                      <DeviceValue>{formatPercent(d.users / total)}</DeviceValue>
                    </DeviceRow>
                  );
                })}
              </Panel>

              <Panel>
                <PanelTitle>🌐 Browser</PanelTitle>
                <BarList>
                  {(data.browsers || []).slice(0, 6).map((b, i) => {
                    const max = Math.max(...(data.browsers || []).map(x => x.users));
                    return (
                      <BarItem key={i}>
                        <BarLabel>{b.browser}</BarLabel>
                        <BarTrack><BarFill $width={(b.users / max) * 100} $color={colors.gray} /></BarTrack>
                        <BarValue>{b.users}</BarValue>
                      </BarItem>
                    );
                  })}
                </BarList>
              </Panel>
            </ThreeCol>
          </Section>

          {/* Last updated */}
          <Footer>
            Daten von Google Analytics 4 · Letzte Aktualisierung: {new Date().toLocaleString('de-DE')}
          </Footer>
        </>
      )}
    </Layout>
  );
}

// ============================================
// MINI CHART (pure CSS/SVG)
// ============================================
function MiniChart({ data }) {
  if (!data || data.length === 0) return null;
  const values = data.map(d => d.users);
  const max = Math.max(...values, 1);
  const width = 100;
  const height = 30;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - (v / max) * height}`).join(' ');
  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <ChartSVG viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polygon points={fillPoints} fill="rgba(196, 30, 58, 0.08)" />
      <polyline points={points} fill="none" stroke={colors.red} strokeWidth="0.5" />
    </ChartSVG>
  );
}

// ============================================
// KPI CHANGE INDICATOR
// ============================================
function KPIChange({ value, invert }) {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value);
  const isPositive = invert ? num < 0 : num > 0;
  const isNegative = invert ? num > 0 : num < 0;
  return (
    <ChangeIndicator $positive={isPositive} $negative={isNegative}>
      {num > 0 ? '↑' : num < 0 ? '↓' : '→'} {Math.abs(num)}%
    </ChangeIndicator>
  );
}

// ============================================
// HELPERS
// ============================================
function getThemeColor(theme) {
  const map = {
    editorial: '#C41E3A', botanical: '#2D5016', contemporary: '#333333',
    luxe: '#B8860B', neon: '#00FF88', classic: '#1a1a1a',
    video: '#6B21A8', modern: '#0066FF',
  };
  return map[theme?.toLowerCase()] || colors.gray;
}

// ============================================
// STYLED COMPONENTS
// ============================================
const spin = keyframes`from { transform: rotate(0); } to { transform: rotate(360deg); }`;
const Header = styled.div`display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
  h1 { font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; text-transform: uppercase; color: ${colors.black}; margin: 0; }
  p { font-family: 'Source Serif 4', serif; font-style: italic; color: ${colors.gray}; font-size: 1rem; margin: 0.25rem 0 0; }`;
const HeaderLeft = styled.div``;
const HeaderRight = styled.div`display: flex; align-items: center; gap: 0.75rem;`;
const PeriodSelector = styled.div`display: flex; border: 2px solid ${colors.black};`;
const PeriodBtn = styled.button`font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: ${p => p.$active ? 600 : 400}; padding: 0.5rem 1rem; cursor: pointer; border: none; background: ${p => p.$active ? colors.black : 'transparent'}; color: ${p => p.$active ? colors.white : colors.black}; transition: all 0.15s; &:hover { background: ${p => p.$active ? colors.black : colors.lightGray}; }`;
const RefreshBtn = styled.button`font-size: 1.25rem; padding: 0.35rem 0.65rem; cursor: pointer; border: 2px solid ${colors.black}; background: transparent; transition: all 0.15s; &:hover { background: ${colors.black}; color: ${colors.white}; } &:disabled { opacity: 0.4; }`;
const LoadingState = styled.div`display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 6rem 2rem; color: ${colors.gray}; font-family: 'Inter', sans-serif;`;
const Spinner = styled.div`width: 24px; height: 24px; border: 3px solid ${colors.lightGray}; border-top-color: ${colors.red}; border-radius: 50%; animation: ${spin} 0.8s linear infinite;`;
const ErrorState = styled.div`background: #FEF2F2; border: 2px solid ${colors.red}; padding: 1.5rem; font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.red}; small { color: ${colors.gray}; display: block; margin-top: 0.5rem; }`;

// KPI Cards
const KPIGrid = styled.div`display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 2.5rem; @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); } @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }`;
const KPICard = styled.div`background: ${colors.white}; border: 2px solid ${p => p.$highlight ? colors.red : colors.black}; padding: 1.25rem;`;
const KPILabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.35rem;`;
const KPIValue = styled.div`font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 600; color: ${p => p.$accent ? colors.red : colors.black}; line-height: 1;`;
const KPISubtext = styled.div`font-family: 'Inter', sans-serif; font-size: 0.7rem; color: ${colors.gray}; margin-top: 0.35rem;`;
const ChangeIndicator = styled.span`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; color: ${p => p.$positive ? colors.green : p.$negative ? colors.red : colors.gray}; display: block; margin-top: 0.25rem;`;

// Sections
const Section = styled.div`margin-bottom: 2.5rem;`;
const SectionTitle = styled.h2`font-family: 'Oswald', sans-serif; font-size: 1.15rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${colors.black}; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; &::after { content: ''; flex: 1; height: 2px; background: ${colors.lightGray}; }`;
const TwoCol = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2.5rem; @media (max-width: 900px) { grid-template-columns: 1fr; }`;
const ThreeCol = styled.div`display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; @media (max-width: 1000px) { grid-template-columns: 1fr; }`;
const Panel = styled.div`background: ${colors.white}; border: 2px solid ${colors.black}; padding: 1.5rem;`;
const PanelTitle = styled.h3`font-family: 'Oswald', sans-serif; font-size: 0.95rem; font-weight: 600; text-transform: uppercase; margin: 0 0 0.25rem;`;
const PanelSubtitle = styled.p`font-family: 'Inter', sans-serif; font-size: 0.7rem; color: ${colors.gray}; margin: 0 0 1rem;`;
const NoData = styled.div`font-family: 'Inter', sans-serif; font-size: 0.8rem; color: ${colors.gray}; padding: 1rem 0; text-align: center;`;

// Tables
const Table = styled.table`width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: ${p => p.$compact ? '0.75rem' : '0.8rem'};
  th { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${colors.gray}; text-align: left; padding: 0.5rem 0.75rem; border-bottom: 2px solid ${colors.black}; }
  td { padding: 0.6rem 0.75rem; border-bottom: 1px solid ${colors.lightGray}; color: ${colors.black}; }
  tr:hover td { background: rgba(0,0,0,0.02); }`;
const PagePath = styled.span`font-size: 0.75rem; font-family: 'JetBrains Mono', monospace, 'Inter', sans-serif; word-break: break-all;`;
const Badge = styled.span`font-size: 0.6rem; font-weight: 600; padding: 0.15rem 0.45rem; text-transform: uppercase; letter-spacing: 0.05em;
  background: ${p => p.$type === 'organic' ? 'rgba(16,185,129,0.1)' : p.$type === 'referral' ? 'rgba(59,130,246,0.1)' : p.$type === 'cpc' ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.05)'};
  color: ${p => p.$type === 'organic' ? colors.green : p.$type === 'referral' ? colors.blue : p.$type === 'cpc' ? colors.orange : colors.gray};`;

// Bar charts
const BarList = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const BarItem = styled.div`display: grid; grid-template-columns: 90px 1fr 40px; align-items: center; gap: 0.5rem;`;
const BarLabel = styled.span`font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 500; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const BarTrack = styled.div`height: 20px; background: ${colors.lightGray}; position: relative; overflow: hidden;`;
const BarFill = styled.div`height: 100%; width: ${p => p.$width}%; background: ${p => p.$color || colors.black}; transition: width 0.5s ease;`;
const BarValue = styled.span`font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 600; text-align: right;`;

// Funnel
const FunnelGrid = styled.div`display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 2rem; background: ${colors.white}; border: 2px solid ${colors.black}; flex-wrap: wrap;`;
const FunnelStep = styled.div`text-align: center; padding: 1rem 1.5rem; background: ${p => p.$highlight ? 'rgba(196,30,58,0.05)' : 'transparent'}; border: ${p => p.$highlight ? `2px solid ${colors.red}` : 'none'};`;
const FunnelNumber = styled.div`font-family: 'Oswald', sans-serif; font-size: 2.5rem; font-weight: 700; color: ${colors.black}; line-height: 1;`;
const FunnelLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: ${colors.gray}; margin-top: 0.5rem;`;
const FunnelRate = styled.div`font-family: 'Inter', sans-serif; font-size: 0.65rem; color: ${colors.green}; margin-top: 0.25rem;`;
const FunnelArrow = styled.span`font-size: 1.5rem; color: ${colors.lightGray}; @media (max-width: 600px) { display: none; }`;
const FunnelError = styled.div`font-family: 'Inter', sans-serif; font-size: 0.7rem; color: ${colors.orange}; padding: 0.5rem;`;

// Devices
const DeviceRow = styled.div`display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;`;
const DeviceIcon = styled.span`font-size: 1.5rem;`;
const DeviceInfo = styled.div`flex: 1;`;
const DeviceName = styled.div`font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 500; text-transform: capitalize; margin-bottom: 0.25rem;`;
const DeviceBar = styled.div`height: 6px; background: ${colors.lightGray}; width: 100%;`;
const DeviceBarFill = styled.div`height: 100%; width: ${p => p.$width}%; background: ${colors.black};`;
const DeviceValue = styled.span`font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 600;`;

// Chart
const ChartContainer = styled.div`background: ${colors.white}; border: 2px solid ${colors.black}; padding: 1.5rem;`;
const ChartSVG = styled.svg`width: 100%; height: 120px;`;

// Footer
const Footer = styled.div`font-family: 'Inter', sans-serif; font-size: 0.7rem; color: ${colors.gray}; text-align: center; padding: 1rem 0; border-top: 1px solid ${colors.lightGray}; margin-top: 2rem;`;
