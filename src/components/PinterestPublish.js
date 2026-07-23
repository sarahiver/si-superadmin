// src/components/PinterestPublish.js
// Pinterest-Publishing-Panel: Board-Auswahl, Ziel-Link (mit Auto-UTM),
// "Direkt pinnen" / "In Queue legen" + Artikel-Seed aus dem Blog.
// Dazu: <PinQueue /> — Übersicht der geplanten/veröffentlichten Pins.
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { adminFetch } from '../lib/apiClient';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', green: '#2E7D32' };

// UTM automatisch anhängen (nur für eigene Domains, nur wenn noch kein utm_ da ist)
export const withUtm = (url) => {
  try {
    const u = new URL(url);
    const own = /(^|\.)sarahiver\.com$|(^|\.)siwedding\.de$/.test(u.hostname);
    if (own && ![...u.searchParams.keys()].some(k => k.startsWith('utm_'))) {
      u.searchParams.set('utm_source', 'pinterest');
      u.searchParams.set('utm_medium', 'social');
    }
    return u.toString();
  } catch {
    return url;
  }
};

const Panel = styled.div`
  background: #fff;
  border: 1px solid ${colors.lightGray};
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 1rem;
`;

const PanelTitle = styled.h3`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.black};
  margin-bottom: 0.9rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${colors.gray};
  }

  input, select {
    border: 1px solid ${colors.lightGray};
    border-radius: 6px;
    padding: 0.55rem 0.7rem;
    font-size: 0.85rem;
    font-family: inherit;
    background: #fff;
  }
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.4rem;
`;

const Btn = styled.button`
  border: none;
  border-radius: 6px;
  padding: 0.65rem 1.1rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  background: ${p => (p.$primary ? colors.red : colors.black)};
  color: #fff;
  opacity: ${p => (p.disabled ? 0.5 : 1)};
`;

const Status = styled.p`
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: ${p => (p.$err ? colors.red : colors.green)};
`;

const SeedRow = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed ${colors.lightGray};

  > div { flex: 1; }
`;

const prettifySlug = (slug) =>
  slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function PinterestPublish({ getImageBase64, title, description, onSeedArticle }) {
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState('');
  const [link, setLink] = useState('https://www.sarahiver.com/');
  const [scheduledDate, setScheduledDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // {msg, err}
  const [slugs, setSlugs] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [seedBusy, setSeedBusy] = useState(false);

  useEffect(() => {
    adminFetch('/api/pinterest?action=boards')
      .then(r => r.json())
      .then(d => {
        if (d.boards?.length) {
          setBoards(d.boards);
          setBoardId(d.boards[0].id);
        } else if (d.error) {
          setStatus({ msg: `Boards: ${d.error}`, err: true });
        }
      })
      .catch(() => setStatus({ msg: 'Boards konnten nicht geladen werden (Token gesetzt?)', err: true }));

    adminFetch('/api/blog-list?action=list')
      .then(r => r.json())
      .then(d => setSlugs(d.slugs || []))
      .catch(() => {});
  }, []);

  const seedFromArticle = async () => {
    if (!selectedSlug) return;
    setSeedBusy(true);
    try {
      const meta = await adminFetch(`/api/blog-list?action=meta&slug=${selectedSlug}`).then(r => r.json());
      setLink(meta.url);
      onSeedArticle?.(meta); // setzt KI-Prompt im Generator
    } catch {
      setStatus({ msg: 'Artikel-Daten konnten nicht geladen werden', err: true });
    }
    setSeedBusy(false);
  };

  const submit = useCallback(async (mode) => {
    if (!boardId) return setStatus({ msg: 'Kein Board gewählt', err: true });
    if (!link) return setStatus({ msg: 'Ziel-Link fehlt', err: true });
    if (!title) return setStatus({ msg: 'Headline fehlt (wird zum Pin-Titel)', err: true });

    setBusy(true);
    setStatus(null);
    try {
      const image_base64 = await getImageBase64();
      const boardName = boards.find(b => b.id === boardId)?.name;
      const body = {
        action: mode === 'now' ? 'publish' : 'queue_add',
        board_id: boardId,
        board_name: boardName,
        title,
        description,
        link: withUtm(link),
        image_base64,
        ...(mode === 'queue' && scheduledDate ? { scheduled_date: scheduledDate } : {}),
      };
      const res = await adminFetch('/api/pinterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler');
      setStatus({
        msg: mode === 'now'
          ? '✅ Pin veröffentlicht!'
          : `✅ In Queue${scheduledDate ? ` für ${scheduledDate}` : ''} — der Cron pinnt automatisch.`,
        err: false,
      });
      window.dispatchEvent(new CustomEvent('pinQueueChanged'));
    } catch (err) {
      setStatus({ msg: String(err.message || err), err: true });
    }
    setBusy(false);
  }, [boardId, link, title, description, scheduledDate, boards, getImageBase64]);

  return (
    <Panel>
      <PanelTitle>📌 Auf Pinterest veröffentlichen</PanelTitle>

      <SeedRow>
        <Field>
          <label>Pin aus Blog-Artikel erstellen</label>
          <select value={selectedSlug} onChange={e => setSelectedSlug(e.target.value)}>
            <option value="">— Artikel wählen —</option>
            {slugs.map(s => <option key={s} value={s}>{prettifySlug(s)}</option>)}
          </select>
        </Field>
        <Btn onClick={seedFromArticle} disabled={!selectedSlug || seedBusy}>
          {seedBusy ? '…' : 'Übernehmen → KI'}
        </Btn>
      </SeedRow>

      <Row>
        <Field>
          <label>Board</label>
          <select value={boardId} onChange={e => setBoardId(e.target.value)}>
            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field>
          <label>Geplant für (leer = nächster Cron-Lauf)</label>
          <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
        </Field>
      </Row>
      <Field style={{ marginBottom: '0.75rem' }}>
        <label>Ziel-Link (UTM wird automatisch ergänzt)</label>
        <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://www.sarahiver.com/blog/..." />
      </Field>

      <Buttons>
        <Btn $primary onClick={() => submit('queue')} disabled={busy}>
          {busy ? '…' : '📥 In Queue legen'}
        </Btn>
        <Btn onClick={() => submit('now')} disabled={busy}>
          {busy ? '…' : '🚀 Direkt pinnen'}
        </Btn>
      </Buttons>

      {status && <Status $err={status.err}>{status.msg}</Status>}
    </Panel>
  );
}

// ==========================================
// QUEUE-ÜBERSICHT
// ==========================================
const QueueWrap = styled.div`
  background: #fff;
  border: 1px solid ${colors.lightGray};
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 1.5rem;
`;

const QueueTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;

  th {
    text-align: left;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${colors.gray};
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid ${colors.lightGray};
  }

  td {
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
  font-size: 0.65rem;
  font-weight: 700;
  background: ${p => p.$s === 'published' ? '#E8F5E9' : p.$s === 'failed' ? '#FDECEA' : '#FFF8E1'};
  color: ${p => p.$s === 'published' ? colors.green : p.$s === 'failed' ? colors.red : '#8a6d00'};
`;

const SmallBtn = styled.button`
  border: 1px solid ${colors.lightGray};
  background: #fff;
  border-radius: 5px;
  padding: 0.25rem 0.55rem;
  font-size: 0.7rem;
  cursor: pointer;
  margin-right: 0.35rem;

  &:hover { border-color: ${colors.black}; }
`;

export function PinQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    adminFetch('/api/pinterest?action=queue_list')
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener('pinQueueChanged', onChange);
    return () => window.removeEventListener('pinQueueChanged', onChange);
  }, [load]);

  const act = async (action, id) => {
    await adminFetch('/api/pinterest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    });
    load();
  };

  if (loading) return null;

  return (
    <QueueWrap>
      <PanelTitle>🗓 Pin-Queue ({items.filter(i => i.status === 'queued').length} geplant)</PanelTitle>
      {items.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: colors.gray }}>
          Noch keine Pins in der Queue. Oben generieren und "In Queue legen" — der tägliche Cron übernimmt den Rest.
        </p>
      ) : (
        <QueueTable>
          <thead>
            <tr><th>Status</th><th>Titel</th><th>Board</th><th>Geplant</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <StatusBadge $s={item.status}>
                    {item.status === 'published' ? 'Live' : item.status === 'failed' ? 'Fehler' : 'Geplant'}
                  </StatusBadge>
                  {item.error && <div style={{ color: colors.red, fontSize: '0.65rem', marginTop: 2 }}>{item.error}</div>}
                </td>
                <td>
                  {item.title}
                  <div style={{ color: colors.gray, fontSize: '0.65rem' }}>{item.link}</div>
                </td>
                <td>{item.board_name || '—'}</td>
                <td>{item.scheduled_date || 'nächster Lauf'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {item.status !== 'published' && (
                    <>
                      {item.status === 'queued' && (
                        <SmallBtn onClick={() => act('queue_publish_now', item.id)}>Jetzt pinnen</SmallBtn>
                      )}
                      <SmallBtn onClick={() => act('queue_delete', item.id)}>Löschen</SmallBtn>
                    </>
                  )}
                  {item.status === 'published' && item.pin_id && (
                    <a
                      href={`https://www.pinterest.com/pin/${item.pin_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.7rem' }}
                    >
                      Pin ansehen →
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </QueueTable>
      )}
    </QueueWrap>
  );
}
