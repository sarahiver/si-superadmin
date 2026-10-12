// src/components/PinterestStats.js
// Rückkanal: Was hat auf Pinterest funktioniert?
//
// Die Tageswerte pro Pin holt der tägliche Cron (api/pinterest.js →
// syncMetrics) und speichert sie in pinterest_pin_metrics. Hier werden sie
// pro Pin summiert und nach Layout, Theme, Board, Wochentag und Ziel
// gruppiert — damit sichtbar wird, welche Gestaltung Reichweite und Klicks
// bringt.
//
// Verglichen wird immer im gleichen Zeitfenster nach Veröffentlichung
// (erste 7 / 30 Tage). Ein drei Monate alter Pin hätte sonst immer mehr
// Impressionen als ein neuer, unabhängig davon, wie gut er ist.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { adminFetch } from '../lib/apiClient';
import { PIN_THEMES } from './PinBatchGenerator';

const LAYOUTS = ['statement', 'split', 'list', 'dark', 'fullbleed'];
const THEMES = Object.keys(PIN_THEMES);
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Unterhalb dieser Anzahl ist ein Gruppenunterschied eher Zufall
const MIN_PINS = 5;

const WINDOWS = [
  { id: 'd7', label: 'Erste 7 Tage', minAge: 7 },
  { id: 'd30', label: 'Erste 30 Tage', minAge: 30 },
  { id: 'total', label: 'Gesamt', minAge: 0 },
];

const GROUPS = [
  { id: 'layout', label: 'Layout', key: p => p.layout || '— ohne Angabe' },
  { id: 'theme', label: 'Theme', key: p => p.theme || '— ohne Angabe' },
  { id: 'board', label: 'Board', key: p => p.board_name || '—' },
  { id: 'weekday', label: 'Wochentag', key: p => weekdayOf(p.published_at) },
  { id: 'target', label: 'Ziel', key: p => targetOf(p.link) },
];

// ── Hilfsfunktionen ──────────────────────────────────────────────

function weekdayOf(iso) {
  if (!iso) return '—';
  const day = new Date(iso).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Europe/Berlin' });
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return WEEKDAYS[map[day]] ?? '—';
}

function targetOf(link) {
  try {
    const u = new URL(link);
    if (/siwedding\.de$/.test(u.hostname)) return 'Demo';
    if (u.pathname.startsWith('/blog')) return 'Ratgeber';
    if (u.pathname === '/' || u.pathname === '') return 'Startseite';
    return 'Produkt / Tool';
  } catch {
    return '—';
  }
}

const fmt = (n) => (n == null ? '–' : Math.round(n).toLocaleString('de-DE'));
const pct = (num, den) => (den > 0 ? `${((num / den) * 100).toFixed(1).replace('.', ',')} %` : '–');
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–');

// ── Styles (wie PinterestDrafts) ─────────────────────────────────

const Panel = styled.div`
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;

  h3 {
    margin: 0;
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
`;

const Btn = styled.button`
  padding: 0.55rem 1rem;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #222;
  background: #fff;
  color: #222;

  &:disabled { opacity: 0.5; cursor: wait; }
`;

const Tabs = styled.div`
  display: inline-flex;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
`;

const Tab = styled.button`
  padding: 0.45rem 0.8rem;
  font-size: 0.72rem;
  border: 0;
  border-right: 1px solid #ddd;
  cursor: pointer;
  background: ${p => (p.$active ? '#0A0A0A' : '#fff')};
  color: ${p => (p.$active ? '#fff' : '#444')};
  &:last-child { border-right: 0; }
`;

const Kpis = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.7rem;
  margin-bottom: 1.4rem;
`;

const Kpi = styled.div`
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.8rem 0.9rem;

  span {
    display: block;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 0.3rem;
  }
  strong {
    font-size: 1.35rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;

const SubHead = styled.h4`
  margin: 1.4rem 0 0.6rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #444;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;

  th, td {
    padding: 0.5rem 0.7rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
    white-space: nowrap;
  }
  th {
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #888;
    font-weight: 500;
    background: #fafafa;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:last-child td { border-bottom: 0; }
  tr.weak td { color: #aaa; }
  td.title { white-space: normal; min-width: 220px; }
  a { color: inherit; }
`;

const Bar = styled.div`
  position: relative;
  height: 6px;
  background: #f1f1f1;
  border-radius: 3px;
  min-width: 80px;

  &::after {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: ${p => Math.max(2, p.$w)}%;
    background: ${p => (p.$weak ? '#ccc' : '#C0143C')};
    border-radius: 3px;
  }
`;

const MiniSelect = styled.select`
  padding: 0.2rem 0.3rem;
  font-size: 0.74rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fffbe6;
`;

const Note = styled.p`
  font-size: 0.74rem;
  color: ${p => (p.$err ? '#B4453F' : '#777')};
  margin: 0.6rem 0 0;
  line-height: 1.5;
`;

const Badge = styled.span`
  display: inline-block;
  font-size: 0.6rem;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  margin-left: 0.35rem;
  background: ${p => (p.$err ? '#FDECEA' : '#FFF8E1')};
  color: ${p => (p.$err ? '#B4453F' : '#8a6d00')};
`;

// ── Komponente ───────────────────────────────────────────────────

export default function PinterestStats() {
  const [pins, setPins] = useState(null);
  const [windowId, setWindowId] = useState('d7');
  const [groupId, setGroupId] = useState('layout');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/pinterest?action=metrics_report');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Laden fehlgeschlagen');
      setPins(data.pins || []);
    } catch (err) {
      setPins([]);
      setStatus({ msg: String(err.message || err), err: true });
    }
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener('pinQueueChanged', onChange);
    return () => window.removeEventListener('pinQueueChanged', onChange);
  }, [load]);

  // Mehrere Runden, weil jeder Aufruf ein Zeitbudget hat
  const syncNow = async () => {
    setBusy(true);
    setStatus(null);
    let synced = 0;
    let failed = 0;
    let lastErrors = [];
    try {
      for (let round = 0; round < 6; round++) {
        // eslint-disable-next-line no-await-in-loop
        const res = await adminFetch('/api/pinterest?action=metrics_sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'metrics_sync' }),
        });
        // eslint-disable-next-line no-await-in-loop
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Aktualisieren fehlgeschlagen');
        synced += data.synced || 0;
        failed += data.failed || 0;
        lastErrors = data.errors || [];
        if (!data.remaining || (data.synced || 0) + (data.failed || 0) === 0) break;
      }
      await load();
      setStatus({
        msg: `${synced} Pin${synced === 1 ? '' : 's'} aktualisiert${failed ? `, ${failed} mit Fehler: ${lastErrors[0]?.error || ''}` : ''}.`,
        err: failed > 0,
      });
    } catch (err) {
      setStatus({ msg: String(err.message || err), err: true });
    } finally {
      setBusy(false);
    }
  };

  const setMeta = async (pin, field, value) => {
    setPins(cur => cur.map(p => (p.id === pin.id ? { ...p, [field]: value || null } : p)));
    await adminFetch('/api/pinterest?action=meta_update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'meta_update', id: pin.id, [field]: value }),
    }).catch(() => {});
  };

  const win = WINDOWS.find(w => w.id === windowId);

  // Nur Pins, die alt genug für das Zeitfenster sind
  const eligible = useMemo(
    () => (pins || []).filter(p => (p.age_days ?? 0) >= win.minAge && p.days_with_data > 0),
    [pins, win]
  );

  const totals = useMemo(() => {
    const t = { impressions: 0, saves: 0, pin_clicks: 0, outbound_clicks: 0 };
    eligible.forEach(p => {
      const m = p[windowId];
      t.impressions += m.impressions;
      t.saves += m.saves;
      t.pin_clicks += m.pin_clicks;
      t.outbound_clicks += m.outbound_clicks;
    });
    return t;
  }, [eligible, windowId]);

  const grouped = useMemo(() => {
    const g = GROUPS.find(x => x.id === groupId);
    const map = new Map();
    eligible.forEach(p => {
      const k = g.key(p);
      const e = map.get(k) || { key: k, n: 0, impressions: 0, saves: 0, outbound_clicks: 0, pin_clicks: 0 };
      const m = p[windowId];
      e.n += 1;
      e.impressions += m.impressions;
      e.saves += m.saves;
      e.outbound_clicks += m.outbound_clicks;
      e.pin_clicks += m.pin_clicks;
      map.set(k, e);
    });
    const rows = [...map.values()].map(e => ({ ...e, avgImpr: e.impressions / e.n }));
    rows.sort((a, b) => b.avgImpr - a.avgImpr);
    const max = Math.max(1, ...rows.map(r => r.avgImpr));
    return rows.map(r => ({ ...r, w: (r.avgImpr / max) * 100 }));
  }, [eligible, groupId, windowId]);

  const tooYoung = (pins || []).length - eligible.length;
  const lastSync = (pins || []).map(p => p.metrics_synced_at).filter(Boolean).sort().pop();
  const missingMeta = (pins || []).filter(p => !p.layout || !p.theme).length;

  return (
    <Panel>
      <Head>
        <h3>📊 Pin-Performance</h3>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Tabs>
            {WINDOWS.map(w => (
              <Tab key={w.id} type="button" $active={w.id === windowId} onClick={() => setWindowId(w.id)}>
                {w.label}
              </Tab>
            ))}
          </Tabs>
          <Btn type="button" onClick={syncNow} disabled={busy}>
            {busy ? 'Aktualisiere…' : 'Jetzt aktualisieren'}
          </Btn>
        </div>
      </Head>

      {pins === null && <Note>Lade…</Note>}

      {pins && pins.length === 0 && (
        <Note>
          Noch keine veröffentlichten Pins mit Statistiken. Der tägliche Lauf holt die Zahlen
          automatisch — oder „Jetzt aktualisieren".
        </Note>
      )}

      {pins && pins.length > 0 && (
        <>
          <Kpis>
            <Kpi><span>Pins im Vergleich</span><strong>{eligible.length}</strong></Kpi>
            <Kpi><span>Impressionen</span><strong>{fmt(totals.impressions)}</strong></Kpi>
            <Kpi><span>Saves</span><strong>{fmt(totals.saves)}</strong></Kpi>
            <Kpi><span>Klicks zur Website</span><strong>{fmt(totals.outbound_clicks)}</strong></Kpi>
            <Kpi><span>Save-Rate</span><strong>{pct(totals.saves, totals.impressions)}</strong></Kpi>
            <Kpi><span>Klickrate</span><strong>{pct(totals.outbound_clicks, totals.impressions)}</strong></Kpi>
          </Kpis>

          <Head style={{ marginBottom: '0.6rem' }}>
            <SubHead style={{ margin: 0 }}>Was funktioniert — Ø pro Pin</SubHead>
            <Tabs>
              {GROUPS.map(g => (
                <Tab key={g.id} type="button" $active={g.id === groupId} onClick={() => setGroupId(g.id)}>
                  {g.label}
                </Tab>
              ))}
            </Tabs>
          </Head>

          {eligible.length === 0 ? (
            <Note>
              Noch kein Pin ist alt genug für „{win.label}". Bis dahin „Gesamt" ansehen.
            </Note>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>{GROUPS.find(g => g.id === groupId).label}</th>
                    <th className="num">Pins</th>
                    <th>Ø Impressionen</th>
                    <th className="num">Ø Impr.</th>
                    <th className="num">Ø Saves</th>
                    <th className="num">Ø Klicks</th>
                    <th className="num">Save-Rate</th>
                    <th className="num">Klickrate</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(r => {
                    const weak = r.n < MIN_PINS;
                    return (
                      <tr key={r.key} className={weak ? 'weak' : ''}>
                        <td>{r.key}</td>
                        <td className="num">{r.n}</td>
                        <td><Bar $w={r.w} $weak={weak} /></td>
                        <td className="num">{fmt(r.avgImpr)}</td>
                        <td className="num">{(r.saves / r.n).toFixed(1).replace('.', ',')}</td>
                        <td className="num">{(r.outbound_clicks / r.n).toFixed(1).replace('.', ',')}</td>
                        <td className="num">{pct(r.saves, r.impressions)}</td>
                        <td className="num">{pct(r.outbound_clicks, r.impressions)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}

          <Note>
            Grau = weniger als {MIN_PINS} Pins in der Gruppe, Unterschied noch nicht belastbar.
            {tooYoung > 0 && ` ${tooYoung} Pin${tooYoung === 1 ? ' ist' : 's sind'} für dieses Zeitfenster noch zu jung oder ohne Daten.`}
            {' '}Pinterest liefert Zahlen mit 1–2 Tagen Verzögerung; „vorläufig" heißt, sie können sich noch ändern.
          </Note>

          <SubHead>Alle Pins</SubHead>
          {missingMeta > 0 && (
            <Note style={{ marginTop: 0, marginBottom: '0.6rem' }}>
              {missingMeta} Pin{missingMeta === 1 ? '' : 's'} ohne Layout/Theme — gelb markiert nachtragen,
              sonst fehlen sie in diesen Gruppen.
            </Note>
          )}
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Pin</th>
                  <th>Datum</th>
                  <th>Layout</th>
                  <th>Theme</th>
                  <th>Board</th>
                  <th className="num">Impr.</th>
                  <th className="num">Saves</th>
                  <th className="num">Klicks</th>
                  <th className="num">Klickrate</th>
                </tr>
              </thead>
              <tbody>
                {pins.map(p => {
                  const m = p[windowId];
                  const tooYoungForWindow = (p.age_days ?? 0) < win.minAge;
                  return (
                    <tr key={p.id} className={tooYoungForWindow ? 'weak' : ''}>
                      <td className="title">
                        <a href={`https://www.pinterest.com/pin/${p.pin_id}/`} target="_blank" rel="noreferrer">
                          {p.title}
                        </a>
                        {p.metrics_error && <Badge $err title={p.metrics_error}>Fehler</Badge>}
                        {!p.metrics_error && p.provisional && <Badge>vorläufig</Badge>}
                        {!p.metrics_error && p.days_with_data === 0 && <Badge>noch keine Daten</Badge>}
                      </td>
                      <td>{fmtDate(p.published_at)} · {weekdayOf(p.published_at)}</td>
                      <td>
                        {p.layout || (
                          <MiniSelect value="" onChange={e => setMeta(p, 'layout', e.target.value)}>
                            <option value="">— wählen —</option>
                            {LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
                          </MiniSelect>
                        )}
                      </td>
                      <td>
                        {p.theme || (
                          <MiniSelect value="" onChange={e => setMeta(p, 'theme', e.target.value)}>
                            <option value="">— wählen —</option>
                            {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                          </MiniSelect>
                        )}
                      </td>
                      <td>{p.board_name || '—'}</td>
                      <td className="num">{fmt(m.impressions)}</td>
                      <td className="num">{fmt(m.saves)}</td>
                      <td className="num">{fmt(m.outbound_clicks)}</td>
                      <td className="num">{pct(m.outbound_clicks, m.impressions)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>

          <Note>
            Zuletzt aktualisiert: {lastSync ? new Date(lastSync).toLocaleString('de-DE') : 'noch nie'}.
            Täglich automatisch mit dem Pin-Lauf am Vormittag.
          </Note>
        </>
      )}

      {status && <Note $err={status.err}>{status.msg}</Note>}
    </Panel>
  );
}
