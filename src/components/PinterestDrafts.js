// src/components/PinterestDrafts.js
// Entwurfsstufe zwischen KI-Erzeugung und Queue.
//
// Bisher landeten generierte Pins direkt in der Warteschlange — ohne
// Vorschau, ohne Möglichkeit, Board, Stil oder Zielseite je Pin zu ändern.
// Hier wird jeder Entwurf einzeln geprüft, bearbeitet und dann übernommen
// oder verworfen. Erst beim Übernehmen wird das Bild gerendert.
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { adminFetch } from '../lib/apiClient';
import { PIN_THEMES } from './PinBatchGenerator';

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
  border: 1px solid ${p => (p.$danger ? '#D98B8B' : '#222')};
  background: ${p => (p.$primary ? '#C0143C' : p.$danger ? '#fff' : '#fff')};
  color: ${p => (p.$primary ? '#fff' : p.$danger ? '#B4453F' : '#222')};
  ${p => p.$primary && 'border-color: #C0143C;'}

  &:disabled { opacity: 0.5; cursor: wait; }
`;

const Card = styled.article`
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 1.2rem;
  padding: 1.1rem;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 0.9rem;
  background: ${p => (p.$busy ? '#fafafa' : '#fff')};

  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const Thumb = styled.div`
  aspect-ratio: 2 / 3;
  border-radius: 6px;
  background: #f2f2f2 center / cover no-repeat;
  background-image: ${p => (p.$src ? `url(${p.$src})` : 'none')};
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  color: #999;
  text-align: center;
  padding: 0.6rem;
`;

const Fields = styled.div`
  display: grid;
  gap: 0.7rem;
  align-content: start;
`;

const Label = styled.label`
  display: block;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.88rem;
  font-family: inherit;
`;

const Area = styled.textarea`
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.85rem;
  font-family: inherit;
  min-height: 4.2rem;
  resize: vertical;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.85rem;
  font-family: inherit;
  background: #fff;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;

  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.3rem;
`;

const Note = styled.p`
  font-size: 0.76rem;
  color: ${p => (p.$err ? '#B4453F' : '#666')};
  margin: 0.6rem 0 0;
`;

const Empty = styled.p`
  font-size: 0.85rem;
  color: #888;
  margin: 0;
`;

/**
 * @param {Array}    boards    [{ id, name }] aus der Pinterest-API
 * @param {Array}    targets   [{ slug, title, intent }] mögliche Zielseiten
 * @param {Function} renderImage  (draft) => Promise<base64>  — rendert die
 *                   Vorschau erst beim Übernehmen, nicht beim Erzeugen
 * @param {Function} onPromoted   Rückmeldung, damit die Queue neu lädt
 */
const LAYOUTS = ['statement', 'split', 'liste', 'dark', 'fullbleed'];
const THEMES = Object.keys(PIN_THEMES);

export default function PinterestDrafts({ renderImage, onPromoted }) {
  const [drafts, setDrafts] = useState([]);
  // Boards und Zielseiten selbst laden: Die Seite müsste sie sonst nur
  // durchreichen, obwohl sie beides nicht braucht.
  const [boards, setBoards] = useState([]);
  const [targets, setTargets] = useState([]);
  const [busyId, setBusyId] = useState(null);
  // Vorschaubilder je Entwurf, erst auf Klick gerendert: Ein Rendering
  // kostet spürbar Zeit, zehn gleichzeitig würden die Seite blockieren.
  const [previews, setPreviews] = useState({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const load = useCallback(() => {
    adminFetch('/api/pinterest?action=draft_list')
      .then(r => r.json())
      .then(d => setDrafts(d.drafts || []))
      .catch(() => setStatus({ msg: 'Entwürfe konnten nicht geladen werden', err: true }));
  }, []);

  useEffect(() => {
    load();
    // Der Generator meldet sich, wenn er fertig ist — ohne das bliebe die
    // Liste leer, weil sie vor dem Lauf gerendert wurde.
    const refresh = () => load();
    window.addEventListener('pinQueueChanged', refresh);
    window.addEventListener('pinDraftsChanged', refresh);
    return () => {
      window.removeEventListener('pinQueueChanged', refresh);
      window.removeEventListener('pinDraftsChanged', refresh);
    };
  }, [load]);

  useEffect(() => {
    adminFetch('/api/pinterest?action=boards')
      .then(r => r.json())
      .then(d => setBoards(d.boards || []))
      .catch(() => {});

    adminFetch('/api/pinterest?action=blog_list')
      .then(r => r.json())
      .then(d => {
        const SITE = 'https://www.sarahiver.com';
        const commercial = (d.commercial || []).map(c => ({
          slug: c.slug, title: c.title, intent: 'high',
          url: c.slug.startsWith('demo-')
            ? `https://siwedding.de/${c.slug}`
            : (c.slug === 'start' ? `${SITE}/` : `${SITE}/blog/hochzeitswebsite-vergleich-2026`),
        }));
        const tools = (d.tools || []).map(t => ({
          slug: t.slug, title: t.title, intent: 'normal', url: `${SITE}/${t.slug}`,
        }));
        const posts = (d.slugs || []).map(sl => ({
          slug: sl, title: sl.replace(/-/g, ' '), intent: 'normal',
          url: `${SITE}/blog/${sl}`,
        }));
        setTargets([...commercial, ...tools, ...posts]);
      })
      .catch(() => {});
  }, []);

  // Änderungen sofort speichern, aber gedrosselt: Beim Tippen soll nicht
  // jeder Tastendruck eine Anfrage auslösen.
  const patch = (id, field, value) => {
    setDrafts(cur => cur.map(d => (d.id === id ? { ...d, [field]: value } : d)));
    clearTimeout(patch._t?.[id]);
    patch._t = patch._t || {};
    patch._t[id] = setTimeout(() => {
      adminFetch('/api/pinterest?action=draft_update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft_update', id, patch: { [field]: value } }),
      }).catch(() => {});
    }, 600);
  };

  const makePreview = useCallback(async (draft) => {
    try {
      const b64 = await renderImage(draft);
      setPreviews(p => ({ ...p, [draft.id]: `data:image/png;base64,${b64}` }));
    } catch (err) {
      setPreviews(p => ({ ...p, [draft.id]: 'error' }));
    }
  }, [renderImage]);

  // Direkt veröffentlichen, ohne Umweg über die Queue
  const pinNow = async (draft) => {
    setBusyId(draft.id);
    setStatus(null);
    try {
      if (!draft.board_id) throw new Error('Bitte zuerst ein Board wählen');
      const image = await renderImage(draft);
      const res = await adminFetch('/api/pinterest?action=publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          board_id: draft.board_id,
          board_name: draft.board_name,
          title: draft.title,
          description: draft.description,
          link: draft.link,
          image_base64: image,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Veröffentlichen fehlgeschlagen');
      await adminFetch('/api/pinterest?action=draft_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft_delete', id: draft.id }),
      }).catch(() => {});
      setDrafts(cur => cur.filter(x => x.id !== draft.id));
      window.dispatchEvent(new CustomEvent('pinQueueChanged'));
      setStatus({ msg: 'Pin veröffentlicht.', err: false });
      onPromoted?.();
    } catch (err) {
      setStatus({ msg: String(err.message || err), err: true });
    } finally {
      setBusyId(null);
    }
  };

  // Vorschauen automatisch erzeugen, aber nacheinander: Zehn Renderings
  // gleichzeitig würden die Seite für Sekunden blockieren.
  useEffect(() => {
    let abgebrochen = false;
    (async () => {
      for (const d of drafts) {
        if (abgebrochen) return;
        if (previews[d.id]) continue;
        // eslint-disable-next-line no-await-in-loop
        await makePreview(d);
      }
    })();
    return () => { abgebrochen = true; };
    // previews bewusst nicht in den Abhängigkeiten: sonst liefe die
    // Schleife nach jedem einzelnen Bild erneut an.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, makePreview]);

  const promote = async (draft) => {
    setBusyId(draft.id);
    setStatus(null);
    try {
      if (!draft.board_id) throw new Error('Bitte zuerst ein Board wählen');
      const image = await renderImage(draft);
      const res = await adminFetch('/api/pinterest?action=draft_promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft_promote',
          id: draft.id,
          image_base64: image,
          scheduled_date: draft.scheduled_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Übernahme fehlgeschlagen');
      setDrafts(cur => cur.filter(d => d.id !== draft.id));
      // Ohne dieses Ereignis zeigte die Queue den neuen Eintrag erst nach
      // einem Neuladen der Seite.
      window.dispatchEvent(new CustomEvent('pinQueueChanged'));
      onPromoted?.();
    } catch (err) {
      setStatus({ msg: String(err.message || err), err: true });
    } finally {
      setBusyId(null);
    }
  };

  const discard = async (id) => {
    await adminFetch('/api/pinterest?action=draft_delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'draft_delete', id }),
    }).catch(() => {});
    setDrafts(cur => cur.filter(d => d.id !== id));
  };

  // Nacheinander statt parallel: Das Rendern ist teuer, und bei einem
  // Fehler soll klar sein, welcher Entwurf betroffen ist.
  const promoteAll = async () => {
    setBulkBusy(true);
    for (const d of drafts) {
      // eslint-disable-next-line no-await-in-loop
      await promote(d);
    }
    setBulkBusy(false);
  };

  const discardAll = async () => {
    if (!window.confirm(`Alle ${drafts.length} Entwürfe verwerfen?`)) return;
    await adminFetch('/api/pinterest?action=draft_delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'draft_delete', all: true }),
    }).catch(() => {});
    setDrafts([]);
  };

  if (!drafts.length) {
    return (
      <Panel>
        <Head><h3>Entwürfe</h3></Head>
        <Empty>Keine offenen Entwürfe. Erzeuge oben welche, bevor sie in die Queue gehen.</Empty>
      </Panel>
    );
  }

  return (
    <Panel>
      <Head>
        <h3>Entwürfe ({drafts.length})</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Btn type="button" onClick={promoteAll} disabled={bulkBusy} $primary>
            {bulkBusy ? 'Übernehme…' : 'Alle in Queue'}
          </Btn>
          <Btn type="button" onClick={discardAll} disabled={bulkBusy} $danger>
            Alle verwerfen
          </Btn>
        </div>
      </Head>

      {drafts.map(d => (
        <Card key={d.id} $busy={busyId === d.id}>
          <div>
            <Thumb $src={previews[d.id] && previews[d.id] !== 'error' ? previews[d.id] : null}>
              {!previews[d.id] && 'Vorschau entsteht…'}
              {previews[d.id] === 'error' && 'Vorschau fehlgeschlagen'}
            </Thumb>
            <Btn
              type="button"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => { setPreviews(p => ({ ...p, [d.id]: null })); makePreview(d); }}
            >
              Neu rendern
            </Btn>
          </div>

          <Fields>
            <div>
              <Label>Titel</Label>
              <Input
                value={d.title || ''}
                onChange={e => patch(d.id, 'title', e.target.value)}
              />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Area
                value={d.description || ''}
                onChange={e => patch(d.id, 'description', e.target.value)}
              />
            </div>

            <Grid2>
              <div>
                <Label>Theme</Label>
                <Select
                  value={d.meta?.theme || 'classic'}
                  onChange={e => {
                    patch(d.id, 'meta', { ...(d.meta || {}), theme: e.target.value });
                    setPreviews(p => ({ ...p, [d.id]: null }));
                  }}
                >
                  {THEMES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Layout</Label>
                <Select
                  value={d.meta?.layout || 'statement'}
                  onChange={e => {
                    const meta = { ...(d.meta || {}), layout: e.target.value };
                    patch(d.id, 'meta', meta);
                    // Vorschau ist mit dem alten Layout entstanden
                    setPreviews(p => ({ ...p, [d.id]: null }));
                  }}
                >
                  {LAYOUTS.map(l => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Board</Label>
                <Select
                  value={d.board_id || ''}
                  onChange={e => {
                    const b = boards.find(x => x.id === e.target.value);
                    patch(d.id, 'board_id', e.target.value);
                    if (b) patch(d.id, 'board_name', b.name);
                  }}
                >
                  <option value="">— wählen —</option>
                  {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </div>

              <div>
                <Label>Geplant für</Label>
                <Input
                  type="date"
                  value={(d.scheduled_date || '').slice(0, 10)}
                  onChange={e => patch(d.id, 'scheduled_date', e.target.value || null)}
                />
              </div>
            </Grid2>

            <div>
              <Label>Zielseite</Label>
              <Select
                value={d.link || ''}
                onChange={e => patch(d.id, 'link', e.target.value)}
              >
                <option value="">— wählen —</option>
                {/* Kaufnahe Ziele zuerst: Demos und Landingpage führen zum
                    Produkt, Ratgeberartikel nur zu Reichweite. */}
                <optgroup label="Produkt & Demos">
                  {targets.filter(t => t.intent === 'high').map(t => (
                    <option key={t.slug} value={t.url}>{t.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Ratgeber">
                  {targets.filter(t => t.intent !== 'high').map(t => (
                    <option key={t.slug} value={t.url}>{t.title}</option>
                  ))}
                </optgroup>
              </Select>
            </div>

            <Actions>
              <Btn type="button" $primary disabled={busyId === d.id} onClick={() => promote(d)}>
                {busyId === d.id ? 'Übernehme…' : 'In Queue'}
              </Btn>
              <Btn type="button" disabled={busyId === d.id} onClick={() => pinNow(d)}>
                Direkt pinnen
              </Btn>
              <Btn type="button" $danger disabled={busyId === d.id} onClick={() => discard(d.id)}>
                Verwerfen
              </Btn>
            </Actions>
          </Fields>
        </Card>
      ))}

      {status && <Note $err={status.err}>{status.msg}</Note>}
    </Panel>
  );
}
