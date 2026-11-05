// src/components/PinAutopilot.js
// Steuerung des Pin-Autopiloten (läuft serverseitig im täglichen Cron).
// Der Autopilot legt nur ENTWÜRFE an — Bild und Veröffentlichung entstehen
// erst bei „Alle in Queue" in der Entwurfsliste darunter.
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { adminFetch } from '../lib/apiClient';

const colors = { black: '#0A0A0A', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', green: '#2E7D32', amber: '#B45309' };

const Panel = styled.div`
  background: #fff;
  border: 1px solid ${colors.lightGray};
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 1rem;
`;
const Head = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  margin-bottom: 0.35rem;
`;
const Title = styled.h3`
  font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.black}; margin: 0;
`;
const Sub = styled.p`font-size: 0.75rem; color: ${colors.gray}; margin: 0 0 1rem;`;
const Grid = styled.div`
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.9rem;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;
const Field = styled.div`
  display: flex; flex-direction: column; gap: 0.3rem;
  label { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${colors.gray}; }
  select { border: 1px solid ${colors.lightGray}; border-radius: 6px; padding: 0.55rem 0.7rem; font-size: 0.85rem; font-family: inherit; background: #fff; }
`;
const Toggle = styled.button`
  border: none; border-radius: 999px; padding: 0.45rem 1rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;
  background: ${p => (p.$on ? colors.green : colors.lightGray)}; color: ${p => (p.$on ? '#fff' : colors.black)};
  opacity: ${p => (p.disabled ? 0.5 : 1)};
`;
const Btn = styled.button`
  border: 1px solid ${colors.black}; background: #fff; border-radius: 6px; padding: 0.55rem 0.9rem;
  font-size: 0.78rem; font-weight: 600; cursor: pointer; opacity: ${p => (p.disabled ? 0.5 : 1)};
`;
const Status = styled.div`
  font-size: 0.78rem; color: ${colors.gray}; line-height: 1.6;
  b { color: ${colors.black}; }
  .warn { color: ${colors.amber}; }
  .err { color: ${colors.red}; }
`;

const fmtDay = (iso) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '–');
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–');

export default function PinAutopilot() {
  const [state, setState] = useState(null);
  const [boards, setBoards] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await adminFetch('/api/pinterest?action=autopilot_get');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setState(d);
    } catch (err) {
      setMsg({ cls: 'err', text: `Autopilot nicht ladbar: ${err.message}` });
    }
  }, []);

  useEffect(() => {
    load();
    adminFetch('/api/pinterest?action=boards')
      .then(r => r.json()).then(d => setBoards(d.boards || [])).catch(() => {});
    const onChange = () => load();
    window.addEventListener('pinDraftsChanged', onChange);
    window.addEventListener('pinQueueChanged', onChange);
    return () => {
      window.removeEventListener('pinDraftsChanged', onChange);
      window.removeEventListener('pinQueueChanged', onChange);
    };
  }, [load]);

  const save = async (patch) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await adminFetch('/api/pinterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'autopilot_set', ...patch }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      await load();
    } catch (err) {
      setMsg({ cls: 'err', text: `Speichern fehlgeschlagen: ${err.message}` });
    }
    setBusy(false);
  };

  // In kleinen Portionen auffüllen (je Aufruf max. 2 Entwürfe), bis der
  // Vorlauf voll ist — so bleibt jeder Aufruf weit unter dem Function-Limit.
  const fillNow = async () => {
    setBusy(true);
    setMsg({ cls: '', text: 'Erzeuge Entwürfe …' });
    let total = 0;
    try {
      for (let i = 0; i < 10; i++) {
        // eslint-disable-next-line no-await-in-loop
        const r = await adminFetch('/api/pinterest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'autopilot_run' }),
        });
        // eslint-disable-next-line no-await-in-loop
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        if (d.skipped) { setMsg({ cls: 'warn', text: d.skipped }); break; }
        total += d.created || 0;
        setMsg({ cls: '', text: `${total} Entwürfe angelegt …` });
        window.dispatchEvent(new CustomEvent('pinDraftsChanged'));
        if (!d.created || !d.open_slots) {
          setMsg({ cls: d.created || total ? '' : 'warn', text: total ? `${total} Entwürfe angelegt. Unten prüfen und „Alle in Queue".` : (d.note || 'Nichts zu tun.') });
          break;
        }
      }
    } catch (err) {
      setMsg({ cls: 'err', text: `Fehler: ${err.message}` });
    }
    setBusy(false);
    load();
  };

  if (!state) {
    return (
      <Panel>
        <Title>🤖 Autopilot</Title>
        <Status>{msg ? <span className={msg.cls}>{msg.text}</span> : 'Lade …'}</Status>
      </Panel>
    );
  }

  const c = state.config;
  const filled = state.total_slots - state.open_slots;
  const lr = state.last_run;

  return (
    <Panel>
      <Head>
        <Title>🤖 Autopilot</Title>
        <Toggle
          type="button"
          $on={c.enabled}
          disabled={busy || (!c.enabled && !c.board_id)}
          title={!c.board_id ? 'Erst ein Board wählen' : ''}
          onClick={() => save({ enabled: !c.enabled })}
        >
          {c.enabled ? 'AN' : 'AUS'}
        </Toggle>
      </Head>
      <Sub>
        Legt jeden Morgen (Cron 9 Uhr) Entwürfe für die nächsten Tage an: Ziel nach Themenmix
        (60 % Brücke · 30 % Website · 10 % Reichweite, 21 Tage Sperre), KI-Text mit neuem Blickwinkel,
        Theme und Layout rotierend. Ihr prüft unten und gebt mit „Alle in Queue" frei.
      </Sub>

      <Grid>
        <Field>
          <label>Board</label>
          <select
            value={c.board_id || ''}
            disabled={busy}
            onChange={(e) => {
              const b = boards.find(x => x.id === e.target.value);
              save({ board_id: b?.id || null, board_name: b?.name || null });
            }}
          >
            <option value="">— Board wählen —</option>
            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            {c.board_id && !boards.find(b => b.id === c.board_id) && <option value={c.board_id}>{c.board_name || c.board_id}</option>}
          </select>
        </Field>
        <Field>
          <label>Pins pro Tag</label>
          <select value={c.per_day} disabled={busy} onChange={(e) => save({ per_day: Number(e.target.value) })}>
            {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field>
          <label>Vorlauf</label>
          <select value={c.lead_days} disabled={busy} onChange={(e) => save({ lead_days: Number(e.target.value) })}>
            {[5, 7, 10, 14].map(n => <option key={n} value={n}>{n} Tage</option>)}
          </select>
        </Field>
      </Grid>

      <Status>
        <div>
          Geplant: <b>{filled} von {state.total_slots}</b> Plätzen in den nächsten {c.lead_days} Tagen
          {' '}({c.per_day} pro Tag — gilt auch für das Veröffentlichen).
        </div>
        {state.waiting > 0 && (
          <div>
            <b>{state.waiting}</b> Pins ohne Datum (oder überfällig) warten in Queue/Entwürfen —
            sie gehen zuerst raus und belegen die frühesten Plätze.
          </div>
        )}
        {state.targets && (
          <div className={state.targets.free === 0 ? 'warn' : ''}>
            Ziele frei: <b>{state.targets.free} von {state.targets.total}</b>
            {state.targets.free === 0 && state.targets.nextFree
              && <> — alle in den letzten {state.lock_days} Tagen gepinnt oder geplant. Nächstes frei am {fmtDay(state.targets.nextFree)}, dann füllt der Autopilot automatisch auf.</>}
            {!state.targets.blog_loaded && <> · Blog-Artikel nicht ladbar</>}
          </div>
        )}
        <div>
          Lernstand:{' '}
          {state.learning.ready
            ? <b>Themes und Layouts werden nach Leistung gewichtet</b>
            : <>rotiert noch — gewichtet ab 1.000 Impressionen (aktuell {state.learning.impressions.toLocaleString('de-DE')})</>}
        </div>
        {lr && (
          <div>
            Letzter Lauf: {fmtDate(lr.at)} —{' '}
            {lr.error ? <span className="err">{lr.error}</span>
              : lr.skipped ? lr.skipped
              : `${lr.created || 0} Entwürfe${lr.note ? ` · ${lr.note}` : ''}`}
          </div>
        )}
        {!state.ai_key_set && <div className="warn">ANTHROPIC_API_KEY fehlt — Texte kommen dann aus den Artikel-Metadaten.</div>}
        {msg && <div className={msg.cls}>{msg.text}</div>}
      </Status>

      <div style={{ marginTop: '0.8rem' }}>
        <Btn type="button" disabled={busy || !c.board_id || state.open_slots === 0 || state.targets?.free === 0} onClick={fillNow}>
          {state.open_slots === 0 ? 'Vorlauf ist voll' : state.targets?.free === 0 ? 'Keine Ziele frei' : `Jetzt auffüllen (${Math.min(state.open_slots, state.targets?.free ?? state.open_slots)} möglich)`}
        </Btn>
      </div>
    </Panel>
  );
}
