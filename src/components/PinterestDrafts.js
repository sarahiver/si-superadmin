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
import { withUtm } from './PinterestPublish';

// Zielseite ohne utm_* — für den Vergleich mit der Auswahlliste. Der
// gespeicherte Link trägt UTM, die Liste nicht; ohne das stand die Auswahl
// immer auf "— wählen —", obwohl ein Ziel gesetzt war.
export function stripUtm(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].filter(k => k.startsWith('utm_')).forEach(k => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
}

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

// Kompakte Zeile: Entwürfe sind standardmäßig zugeklappt und werden nur
// zum Bearbeiten geöffnet. Vorher stand jeder Entwurf als große Karte da.
const Row = styled.div`
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 0.9rem;
  align-items: center;
  padding: 0.6rem 0.7rem;
  border: 1px solid #ececec;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #fff;

  @media (max-width: 640px) { grid-template-columns: 54px 1fr; }
`;

const MiniThumb = styled.div`
  width: 54px;
  aspect-ratio: 2 / 3;
  border-radius: 4px;
  background: #f2f2f2 center / cover no-repeat;
  background-image: ${p => (p.$src ? `url(${p.$src})` : 'none')};
`;

const RowTitle = styled.div`
  font-size: 0.86rem;
  font-weight: 500;
  line-height: 1.35;
`;

const RowMeta = styled.div`
  font-size: 0.7rem;
  color: #888;
  margin-top: 0.2rem;
`;

const Warn = styled.span`
  color: #B4453F;
  margin-left: 0.4rem;
`;

const RowActions = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 640px) { grid-column: 1 / -1; justify-content: flex-start; }
`;

const Hint = styled.p`
  font-size: 0.74rem;
  color: #777;
  margin: -0.6rem 0 1rem;
  line-height: 1.5;
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
// 'list' wieder aktiv: Layout in lib/postCanvas.js korrigiert (Überbreite,
// fehlender Footer, doppeltes accentWord). Listenpunkte kommen aus meta.body,
// eine Zeile pro Punkt, optional "Titel | Beschreibung".
const LAYOUTS = ['statement', 'split', 'list', 'dark', 'fullbleed'];
const THEMES = Object.keys(PIN_THEMES);

// Nur diese Layouts zeigen ein Foto
const PHOTO_LAYOUTS = ['split', 'fullbleed'];

// Bildsuche (Pexels) arbeitet auf Englisch. Aus dem deutschen Pin-Thema
// werden passende Motive abgeleitet; die Suche hängt selbst "wedding" an.
const TOPIC_KEYWORDS = [
  [/website|online|digital|app|qr/i, ['invitation', 'flatlay', 'phone']],
  [/gäste|gast|rsvp|zusage/i, ['guests', 'celebration']],
  [/location|venue|ort|scheune|schloss/i, ['venue', 'decoration']],
  [/deko|tisch|tafel/i, ['table setting', 'decoration']],
  [/kleid|braut/i, ['bride', 'dress']],
  [/anzug|bräutigam/i, ['groom', 'suit']],
  [/torte|kuchen|essen|menü/i, ['cake', 'dessert']],
  [/ring|antrag|verlob/i, ['rings', 'engagement']],
  [/budget|kosten|preis|plan|checkliste|liste/i, ['planning', 'notebook']],
  [/einladung|karte|save the date|papeterie/i, ['stationery', 'invitation card']],
  [/blume|strauß|floral/i, ['bouquet', 'flowers']],
  [/foto|fotograf/i, ['photography', 'couple']],
  [/musik|band|dj|tanz/i, ['dance', 'party']],
  [/frühling|sommer|garten|outdoor/i, ['garden', 'outdoor']],
];
const FALLBACK_KEYWORDS = [['flowers', 'details'], ['couple', 'light'], ['table setting'], ['bouquet']];

function deriveKeywords(draft) {
  const text = [draft.title, draft.meta?.headline, draft.meta?.eyebrow].filter(Boolean).join(' ');
  for (const [re, kw] of TOPIC_KEYWORDS) if (re.test(text)) return kw;
  return FALLBACK_KEYWORDS[Math.floor(Math.random() * FALLBACK_KEYWORDS.length)];
}

const parseKeywords = (v) => String(v || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 4);

// Unter diesen Werten (0–255, aus Pexels' Durchschnittsfarbe) gilt ein
// Foto als zu dunkel. "Helleres Foto" ist deutlich strenger.
const MIN_BRIGHTNESS = 95;
const MIN_BRIGHTNESS_BRIGHT = 150;

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
  const [photoBusyId, setPhotoBusyId] = useState(null);
  // Aufgeklappte Entwürfe — alle anderen als kompakte Zeile
  const [openIds, setOpenIds] = useState(() => new Set());
  const toggleOpen = useCallback((id, force) => setOpenIds(cur => {
    const next = new Set(cur);
    const open = force ?? !next.has(id);
    if (open) next.add(id); else next.delete(id);
    return next;
  }), []);

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
    // Kommt ein Pin aus der Queue zurück zum Bearbeiten, steht seine id im
    // Ereignis — er wird dann direkt aufgeklappt.
    const refresh = (e) => {
      load();
      if (e?.detail?.openId) toggleOpen(e.detail.openId, true);
    };
    window.addEventListener('pinQueueChanged', refresh);
    window.addEventListener('pinDraftsChanged', refresh);
    return () => {
      window.removeEventListener('pinQueueChanged', refresh);
      window.removeEventListener('pinDraftsChanged', refresh);
    };
  }, [load, toggleOpen]);

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
    // Timer pro Feld: Vorher pro Entwurf — bei der Board-Wahl hat das
    // direkt folgende board_name-Update das Speichern von board_id verworfen.
    const key = `${id}:${field}`;
    patch._t = patch._t || {};
    clearTimeout(patch._t[key]);
    patch._t[key] = setTimeout(() => {
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

  // Neues Foto aus der Bildsuche. Blättert durch die Treffer, damit jeder
  // Klick ein anderes Bild bringt, und sortiert zu dunkle Fotos aus.
  // "brighter" sucht strenger und schaltet auf den hellen Bildton um.
  const newPhoto = async (draft, { brighter = false } = {}) => {
    setPhotoBusyId(draft.id);
    setStatus(null);
    try {
      const meta = draft.meta || {};
      const keywords = meta.visualKeywords?.length ? meta.visualKeywords : deriveKeywords(draft);
      const used = new Set([...(meta.usedPhotos || []), meta.imageUrl].filter(Boolean));
      let page = (meta.photoPage || 0) + 1;
      let pick = null;

      for (let tries = 0; tries < 4 && !pick; tries++, page++) {
        // eslint-disable-next-line no-await-in-loop
        const res = await adminFetch('/api/stock-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keywords,
            format: 'post',
            max: 15,
            page,
            minBrightness: brighter ? MIN_BRIGHTNESS_BRIGHT : MIN_BRIGHTNESS,
          }),
        });
        // eslint-disable-next-line no-await-in-loop
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Bildsuche fehlgeschlagen');
        const fresh = (data.assets || []).filter(a => a.secure_url && !used.has(a.secure_url));
        if (fresh.length) {
          pick = brighter
            ? [...fresh].sort((a, b) => (b.brightness || 0) - (a.brightness || 0))[0]
            : fresh[0];
        }
        if (!data.has_more && !pick) {
          page = 0; // von vorn, beim nächsten Klick
          break;
        }
      }

      if (!pick) {
        throw new Error('Kein passendes Foto gefunden. Andere Bild-Stichworte versuchen.');
      }

      const next = {
        ...meta,
        imageUrl: pick.secure_url,
        photoCredit: pick.photographer ? `${pick.photographer} / Pexels` : 'Pexels',
        photoPage: page,
        usedPhotos: [...used, pick.secure_url].slice(-40),
        visualKeywords: keywords,
        // Ohne Foto-Layout wäre das neue Bild unsichtbar
        layout: PHOTO_LAYOUTS.includes(meta.layout) ? meta.layout : 'fullbleed',
        ...(brighter ? { imageTone: 'bright' } : {}),
      };
      patch(draft.id, 'meta', next);
      setPreviews(p => ({ ...p, [draft.id]: null }));
      await makePreview({ ...draft, meta: next });
    } catch (err) {
      setStatus({ msg: String(err.message || err), err: true });
    } finally {
      setPhotoBusyId(null);
    }
  };

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
          // Der Entwurf selbst wird zum veröffentlichten Pin — Layout, Theme
          // und Texte bleiben für die Auswertung erhalten. Vorher wurde er
          // gelöscht und eine Zeile ohne diese Angaben neu angelegt.
          draft_id: draft.id,
          meta: draft.meta || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Veröffentlichen fehlgeschlagen');
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

      <Hint>
        Entwürfe bleiben hier, bis du sie in die Queue übernimmst oder verwirfst — es gibt
        kein automatisches Ablaufdatum. „Geplant für" gilt erst nach „In Queue".
      </Hint>

      {drafts.map(d => !openIds.has(d.id) ? (
        <Row key={d.id}>
          <MiniThumb $src={previews[d.id] && previews[d.id] !== 'error' ? previews[d.id] : null} />
          <div style={{ minWidth: 0 }}>
            <RowTitle>{d.title || '(ohne Titel)'}</RowTitle>
            <RowMeta>
              {[d.meta?.layout || 'statement', d.meta?.theme || 'classic', d.board_name || 'kein Board']
                .join(' · ')}
              {' · '}
              {d.scheduled_date ? `für ${new Date(d.scheduled_date).toLocaleDateString('de-DE')}` : 'ohne Datum'}
              {d.link && (
                <span title={d.link}>
                  {' · → '}{(() => { try { const u = new URL(d.link); return u.hostname.replace('www.', '') + u.pathname; } catch { return d.link; } })()}
                </span>
              )}
              {!d.board_id && <Warn>Board fehlt</Warn>}
              {!d.link && <Warn>Zielseite fehlt</Warn>}
              {d.scheduled_date && d.scheduled_date.slice(0, 10) < new Date().toISOString().slice(0, 10) && (
                <Warn>Datum vorbei</Warn>
              )}
            </RowMeta>
          </div>
          <RowActions>
            <Btn type="button" onClick={() => toggleOpen(d.id, true)}>Bearbeiten</Btn>
            <Btn type="button" $primary disabled={busyId === d.id} onClick={() => promote(d)}>
              {busyId === d.id ? 'Übernehme…' : 'In Queue'}
            </Btn>
            <Btn type="button" $danger disabled={busyId === d.id} onClick={() => discard(d.id)}>
              Verwerfen
            </Btn>
          </RowActions>
        </Row>
      ) : (
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

            {/* Foto tauschen: wenn das Bild zu dunkel ist oder nicht passt */}
            <Btn
              type="button"
              style={{ width: '100%', marginTop: '0.4rem' }}
              disabled={photoBusyId === d.id}
              onClick={() => newPhoto(d)}
            >
              {photoBusyId === d.id ? 'Suche Foto…' : '🔄 Neues Foto'}
            </Btn>
            <Btn
              type="button"
              style={{ width: '100%', marginTop: '0.4rem' }}
              disabled={photoBusyId === d.id}
              onClick={() => newPhoto(d, { brighter: true })}
            >
              ☀ Helleres Foto
            </Btn>

            {PHOTO_LAYOUTS.includes(d.meta?.layout) && d.meta?.imageUrl && (
              <div style={{ marginTop: '0.6rem' }}>
                <Label>Bildton</Label>
                <Select
                  value={d.meta?.imageTone || 'muted'}
                  onChange={e => {
                    const meta = { ...(d.meta || {}), imageTone: e.target.value };
                    patch(d.id, 'meta', meta);
                    setPreviews(p => ({ ...p, [d.id]: null }));
                    makePreview({ ...d, meta });
                  }}
                >
                  <option value="muted">Gedämpft (dunkel)</option>
                  <option value="bright">Hell</option>
                </Select>
              </div>
            )}

            <div style={{ marginTop: '0.6rem' }}>
              <Label>Bild-Stichworte (englisch)</Label>
              <Input
                defaultValue={(d.meta?.visualKeywords || []).join(', ')}
                placeholder={deriveKeywords(d).join(', ')}
                onBlur={e => {
                  const kw = parseKeywords(e.target.value);
                  // Neue Stichworte → wieder bei Seite 1 der Treffer anfangen
                  patch(d.id, 'meta', { ...(d.meta || {}), visualKeywords: kw, photoPage: 0 });
                }}
                style={{ fontSize: '0.78rem' }}
              />
            </div>

            {d.meta?.photoCredit && (
              <Note style={{ fontSize: '0.66rem' }}>Foto: {d.meta.photoCredit}</Note>
            )}
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

            {d.meta?.layout === 'list' && (
              <div>
                <Label>Listenpunkte — eine Zeile pro Punkt, optional „Titel | Beschreibung", max. 5</Label>
                <Area
                  value={d.meta?.body || ''}
                  placeholder={'Gästeliste früh starten | spart später Stress\nLocation besichtigen\nBudget festlegen'}
                  onChange={e => patch(d.id, 'meta', { ...(d.meta || {}), body: e.target.value })}
                  onBlur={() => { setPreviews(p => ({ ...p, [d.id]: null })); makePreview(d); }}
                />
              </div>
            )}

            <div>
              <Label>Zielseite</Label>
              <Select
                value={stripUtm(d.link)}
                // UTM direkt beim Auswählen — der Server ergänzt sie zusätzlich
                onChange={e => patch(d.id, 'link', e.target.value ? withUtm(e.target.value) : '')}
              >
                <option value="">— wählen —</option>
                {d.link && !targets.some(t => stripUtm(t.url) === stripUtm(d.link)) && (
                  <option value={stripUtm(d.link)}>Aktuell: {stripUtm(d.link)}</option>
                )}
                {/* Kaufnahe Ziele zuerst: Demos und Landingpage führen zum
                    Produkt, Ratgeberartikel nur zu Reichweite. */}
                <optgroup label="Produkt & Demos">
                  {targets.filter(t => t.intent === 'high').map(t => (
                    <option key={t.slug} value={stripUtm(t.url)}>{t.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Ratgeber">
                  {targets.filter(t => t.intent !== 'high').map(t => (
                    <option key={t.slug} value={stripUtm(t.url)}>{t.title}</option>
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
              <Btn type="button" onClick={() => toggleOpen(d.id, false)} style={{ marginLeft: 'auto' }}>
                Zuklappen
              </Btn>
            </Actions>
          </Fields>
        </Card>
      ))}

      {status && <Note $err={status.err}>{status.msg}</Note>}
    </Panel>
  );
}
