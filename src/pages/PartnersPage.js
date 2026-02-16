// src/pages/PartnersPage.js
// Kooperationen – Mini-CRM mit E-Mail-Composer, XLSX-Import, Tracking
// Brevo wird nur als Versand-Engine im Hintergrund genutzt

import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import {
  PARTNER_TYPES,
  PARTNER_STATUS,
  EMAIL_STAGES,
  STATUS_AFTER_EMAIL,
  FOLLOWUP_DAYS,
  IMPORT_FIELDS,
  getDefaultTemplates,
  wrapInEmailHTML,
  getDisplayName,
  getFullName,
} from '../lib/partnerEmailTemplates';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5', purple: '#8B5CF6', blue: '#3B82F6', pink: '#EC4899' };

// ============================================
// STYLED COMPONENTS
// ============================================

const Header = styled.div`display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black}; flex-wrap: wrap; gap: 1rem;`;
const Title = styled.h1`font-family: 'Oswald', sans-serif; font-size: 3rem; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; color: ${colors.black}; line-height: 1;`;
const Subtitle = styled.p`font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.gray}; margin-top: 0.5rem;`;
const HeaderActions = styled.div`display: flex; gap: 0.75rem; flex-wrap: wrap;`;

const StatsRow = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 2rem;`;
const StatCard = styled.div`background: ${colors.white}; border: 2px solid ${colors.black}; padding: 1.25rem; text-align: center;`;
const StatNumber = styled.div`font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; color: ${p => p.$color || colors.black};`;
const StatLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: ${colors.gray}; margin-top: 0.25rem;`;

const Filters = styled.div`display: flex; gap: 0.25rem; margin-bottom: 1rem; background: #fff; border: 1px solid ${colors.lightGray}; padding: 0.25rem; width: fit-content; flex-wrap: wrap;`;
const FilterBtn = styled.button`padding: 0.5rem 1rem; background: ${p => p.$active ? colors.black : 'transparent'}; color: ${p => p.$active ? '#fff' : colors.gray}; border: none; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; &:hover { background: ${p => p.$active ? colors.black : '#F5F5F5'}; }`;

const ActionRow = styled.div`display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;`;
const SearchInput = styled.input`padding: 0.6rem 1rem; font-family: 'Inter', sans-serif; font-size: 0.85rem; border: 2px solid ${colors.lightGray}; background: #fff; min-width: 250px; &:focus { outline: none; border-color: ${colors.black}; }`;

const Button = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  background: ${p => p.$danger ? '#EF4444' : p.$primary ? colors.red : p.$secondary ? colors.black : p.$success ? colors.green : colors.white};
  color: ${p => (p.$primary || p.$secondary || p.$danger || p.$success) ? colors.white : colors.black};
  padding: ${p => p.$small ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  border: 2px solid ${p => p.$danger ? '#EF4444' : p.$primary ? colors.red : p.$success ? colors.green : colors.black};
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
  &:hover { opacity: 0.85; } &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const HiddenInput = styled.input`display: none;`;

const Table = styled.div`background: #fff; border: 2px solid ${colors.black}; overflow-x: auto;`;
const TableHeader = styled.div`
  display: grid; grid-template-columns: 40px 1.2fr 0.8fr 0.7fr 0.6fr 110px 90px 110px 60px;
  background: ${colors.black}; color: ${colors.white}; font-family: 'Inter', sans-serif;
  font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; min-width: 900px;
  & > div { padding: 0.75rem 0.75rem; }
`;
const TableRow = styled.div`
  display: grid; grid-template-columns: 40px 1.2fr 0.8fr 0.7fr 0.6fr 110px 90px 110px 60px;
  border-bottom: 1px solid ${colors.lightGray}; align-items: center; font-family: 'Inter', sans-serif;
  font-size: 0.85rem; cursor: pointer; min-width: 900px; transition: background 0.1s;
  background: ${p => p.$trash ? '#FEF2F2' : 'transparent'};
  &:hover { background: ${p => p.$trash ? '#FEE2E2' : '#FAFAFA'}; }
  & > div { padding: 0.65rem 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;
const Checkbox = styled.input`width: 16px; height: 16px; cursor: pointer;`;
const Badge = styled.span`display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.65rem; font-weight: 600; background: ${p => p.$color || colors.gray}20; color: ${p => p.$color || colors.gray}; border: 1px solid ${p => p.$color || colors.gray}40; white-space: nowrap;`;
const TypeIcon = styled.span`margin-right: 0.3rem;`;

const Overlay = styled.div`position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; justify-content: center; align-items: flex-start; padding: 2rem; overflow-y: auto;`;
const Modal = styled.div`background: ${colors.white}; border: 2px solid ${colors.black}; width: 100%; max-width: ${p => p.$wide ? '900px' : '600px'}; max-height: 90vh; overflow-y: auto;`;
const ModalHeader = styled.div`background: ${colors.black}; color: ${colors.white}; padding: 1rem 1.5rem; font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1;`;
const ModalBody = styled.div`padding: 1.5rem;`;
const ModalFooter = styled.div`padding: 1rem 1.5rem; border-top: 1px solid ${colors.lightGray}; display: flex; justify-content: flex-end; gap: 0.75rem; position: sticky; bottom: 0; background: ${colors.white};`;
const CloseBtn = styled.button`background: none; border: none; color: ${colors.white}; font-size: 1.5rem; cursor: pointer; line-height: 1;`;

const FormGrid = styled.div`display: grid; grid-template-columns: ${p => p.$cols || '1fr 1fr'}; gap: 1rem; margin-bottom: 1rem;`;
const FormGroup = styled.div`margin-bottom: ${p => p.$noMargin ? '0' : '1rem'};`;
const Label = styled.label`display: block; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.4rem;`;
const Input = styled.input`width: 100%; padding: 0.65rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.9rem; border: 2px solid ${colors.lightGray}; background: #fff; &:focus { outline: none; border-color: ${colors.black}; }`;
const Select = styled.select`width: 100%; padding: 0.65rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.9rem; border: 2px solid ${colors.lightGray}; background: #fff; cursor: pointer; &:focus { outline: none; border-color: ${colors.black}; }`;
const TextArea = styled.textarea`width: 100%; padding: 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.9rem; border: 2px solid ${colors.lightGray}; background: #fff; resize: vertical; min-height: ${p => p.$tall ? '320px' : '80px'}; line-height: 1.6; &:focus { outline: none; border-color: ${colors.black}; }`;

const ComposerLayout = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; @media (max-width: 900px) { grid-template-columns: 1fr; }`;
const PreviewFrame = styled.div`border: 2px solid ${colors.lightGray}; background: #F5F5F5; padding: 1rem; max-height: 500px; overflow-y: auto; font-size: 0.85rem;`;
const StageSelector = styled.div`display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;`;
const StageBtn = styled.button`padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 600; border: 2px solid ${p => p.$active ? colors.red : colors.lightGray}; background: ${p => p.$active ? colors.red + '15' : '#fff'}; color: ${p => p.$active ? colors.red : colors.gray}; cursor: pointer; transition: all 0.15s; &:hover { border-color: ${colors.red}; }`;

const EmailLogItem = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid ${colors.lightGray}; font-size: 0.8rem; &:last-child { border-bottom: none; }`;
const EmptyState = styled.div`padding: 4rem 2rem; text-align: center; color: ${colors.gray}; font-family: 'Inter', sans-serif; font-size: 0.9rem;`;
const FollowupBadge = styled.span`display: inline-block; padding: 0.15rem 0.5rem; font-size: 0.6rem; font-weight: 700; background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; margin-left: 0.4rem;`;

// Import preview
const ImportPreview = styled.div`border: 2px solid ${colors.lightGray}; max-height: 300px; overflow-y: auto; margin: 1rem 0; font-size: 0.8rem;`;
const ImportRow = styled.div`display: grid; grid-template-columns: 1fr 1.2fr 0.8fr 0.8fr; gap: 0; border-bottom: 1px solid ${colors.lightGray}; & > div { padding: 0.5rem 0.75rem; } &:first-child { background: ${colors.black}; color: white; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }`;
const DuplicateTag = styled.span`background: #FEE2E2; color: #991B1B; font-size: 0.65rem; font-weight: 600; padding: 0.1rem 0.4rem; margin-left: 0.4rem;`;
const NewTag = styled.span`background: #D1FAE5; color: #065F46; font-size: 0.65rem; font-weight: 600; padding: 0.1rem 0.4rem; margin-left: 0.4rem;`;

const DropZone = styled.div`
  border: 3px dashed ${p => p.$active ? colors.red : colors.lightGray}; padding: 3rem 2rem;
  text-align: center; cursor: pointer; transition: all 0.2s; background: ${p => p.$active ? colors.red + '08' : '#fff'};
  &:hover { border-color: ${colors.red}; background: ${colors.red}08; }
`;

const ProgressOverlay = styled.div`
  position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
  z-index: 2000; min-width: 420px; max-width: 600px;
  background: ${colors.black}; border: 2px solid ${colors.red};
  box-shadow: 0 8px 32px rgba(0,0,0,0.4); padding: 1.25rem 1.5rem;
  font-family: 'Inter', sans-serif; color: ${colors.white};
  animation: slideUp 0.3s ease;
  @keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
`;
const ProgressHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;`;
const ProgressTitle = styled.div`font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;`;
const ProgressCount = styled.div`font-size: 0.75rem; color: rgba(255,255,255,0.6);`;
const ProgressBarOuter = styled.div`height: 6px; background: rgba(255,255,255,0.15); width: 100%; overflow: hidden;`;
const ProgressBarInner = styled.div`height: 100%; background: ${p => p.$color || colors.red}; transition: width 0.3s ease; width: ${p => p.$pct || 0}%;`;
const ProgressDetail = styled.div`font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-top: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;

// ============================================
// XLSX PARSER (SheetJS via CDN – already in dependencies or load manually)
// ============================================

async function parseXLSX(file) {
  // Dynamic import of SheetJS
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // Map columns to our fields
        const mapped = json.map(row => {
          const entry = {};
          const keys = Object.keys(row);

          // Try to match by header name first
          IMPORT_FIELDS.forEach((field, i) => {
            const headerMatch = keys.find(k =>
              k.toLowerCase().includes(field.key.toLowerCase()) ||
              k.toLowerCase().includes(field.label.toLowerCase().split(' ')[0].toLowerCase())
            );
            if (headerMatch) {
              entry[field.key] = String(row[headerMatch] || '').trim();
            } else if (keys[i]) {
              // Fallback: match by column position
              entry[field.key] = String(row[keys[i]] || '').trim();
            }
          });

          return entry;
        });

        // Filter out empty rows (need at least email + first_name or company)
        const valid = mapped.filter(r => r.email && (r.first_name || r.company));
        resolve(valid);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}


// ============================================
// MAIN COMPONENT
// ============================================

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('alle');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showComposer, setShowComposer] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: p }, { data: logs }, { data: evts }] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('email_logs').select('*').not('partner_id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('email_events').select('*').order('timestamp', { ascending: false }).limit(500),
    ]);
    setPartners(p || []);
    setEmailLogs(logs || []);
    setEmailEvents(evts || []);
    setLoading(false);
  }

  // ── BREVO SYNC ────────────────────────────
  const [syncing, setSyncing] = useState(false);
  const [emailEvents, setEmailEvents] = useState([]);
  const [progress, setProgress] = useState(null); // { title, current, total, detail, color }

  async function syncBrevoEvents() {
    setSyncing(true);
    setProgress({ title: '🔄 Brevo Sync', current: 0, total: 100, detail: 'Events abrufen…', color: '#3B82F6' });
    try {
      const response = await fetch('/api/brevo-sync?days=14&limit=100');
      const data = await response.json();
      if (!data.success || !data.events?.length) {
        toast(data.events?.length === 0 ? 'Keine neuen Events' : `Fehler: ${data.error}`);
        setSyncing(false);
        setProgress(null);
        return;
      }

      setProgress(p => ({ ...p, detail: `${data.events.length} Events gefunden, verarbeite…`, current: 10 }));

      // Normalize & deduplicate
      const eventMap = {
        'delivered': 'delivered', 'request': 'delivered', 'requests': 'delivered',
        'opened': 'opened', 'uniqueOpened': 'unique_opened', 'unique_opened': 'unique_opened',
        'click': 'clicked', 'clicks': 'clicked',
        'softBounces': 'soft_bounce', 'softBounce': 'soft_bounce', 'soft_bounce': 'soft_bounce',
        'hardBounces': 'hard_bounce', 'hardBounce': 'hard_bounce', 'hard_bounce': 'hard_bounce',
        'spam': 'spam', 'complaints': 'spam',
        'blocked': 'blocked', 'deferred': 'deferred', 'error': 'error',
        'loadedByProxy': 'proxy_open', 'proxy_open': 'proxy_open',
      };
      const statusUpgrade = {
        'delivered': 'delivered', 'opened': 'opened', 'unique_opened': 'opened',
        'proxy_open': 'opened', 'clicked': 'clicked',
        'soft_bounce': 'soft_bounce', 'hard_bounce': 'hard_bounce',
        'blocked': 'blocked', 'spam': 'spam', 'deferred': 'deferred', 'error': 'error',
      };
      const manualStatuses = ['geantwortet', 'aktiv', 'abgelehnt', 'pausiert', 'trash', 'angebot', 'follow_up'];

      let inserted = 0, updated = 0;
      const partnersByEmail = {};
      partners.forEach(p => { partnersByEmail[p.email.toLowerCase()] = p; });
      const total = data.events.length;

      for (let i = 0; i < total; i++) {
        const evt = data.events[i];
        const email = (evt.email || '').toLowerCase();
        const normalized = eventMap[evt.event] || null;
        if (!email || !normalized) continue;

        const pct = 10 + Math.round((i / total) * 85);
        setProgress(p => ({ ...p, current: pct, detail: `${i + 1}/${total} · ${email} · ${normalized}` }));

        const partner = partnersByEmail[email];
        
        // Deduplicate: skip if same email+event+timestamp already exists
        const evtTimestamp = evt.date || new Date().toISOString();
        const { data: existing } = await supabase.from('email_events')
          .select('id').eq('email', email).eq('event', normalized)
          .eq('timestamp', evtTimestamp).limit(1);
        if (existing?.length) continue;

        // Insert event
        const { error } = await supabase.from('email_events').insert([{
          partner_id: partner?.id || null,
          email,
          event: normalized,
          brevo_message_id: evt.messageId || null,
          subject: evt.subject || null,
          timestamp: evtTimestamp,
          raw_data: evt,
        }]).select();

        if (!error) inserted++;

        // Update partner - 1:1 Brevo status
        if (partner) {
          const updates = { last_email_event: normalized, last_email_event_at: evt.date || new Date().toISOString() };
          const newStatus = statusUpgrade[normalized];
          if (newStatus && !manualStatuses.includes(partner.status)) {
            updates.status = newStatus;
            updated++;
          }
          if (normalized === 'soft_bounce' || normalized === 'hard_bounce') {
            updates.email_bounce_count = (partner.email_bounce_count || 0) + 1;
          }
          await supabase.from('partners').update(updates).eq('id', partner.id);
        }
      }

      setProgress({ title: '✓ Sync abgeschlossen', current: 100, total: 100, detail: `${inserted} gespeichert · ${updated} Status-Updates`, color: '#10B981' });
      toast.success(`Sync: ${total} Events, ${inserted} gespeichert, ${updated} Status-Updates`);
      loadData();
      setTimeout(() => setProgress(null), 3000);
    } catch (err) {
      console.error('Brevo sync error:', err);
      toast.error('Sync fehlgeschlagen: ' + err.message);
      setProgress(null);
    }
    setSyncing(false);
  }

  // Helper: Get latest events for a partner
  function getPartnerEvents(partnerId) {
    return emailEvents.filter(e => e.partner_id === partnerId);
  }

  // Event icon mapping
  function eventIcon(event) {
    const icons = {
      'delivered': '📬', 'opened': '👁', 'unique_opened': '👁', 'proxy_open': '👁',
      'clicked': '🔗', 'soft_bounce': '⚠️', 'hard_bounce': '❌',
      'spam': '🚫', 'blocked': '🔒', 'deferred': '⏳', 'error': '💥',
      'email_geoeffnet': '👁', 'bounce': '❌', 'kontaktiert': '📤',
    };
    return icons[event] || '📧';
  }

  function eventLabel(event) {
    const labels = {
      'delivered': 'Zugestellt', 'opened': 'Geöffnet', 'unique_opened': 'Geöffnet', 'proxy_open': 'Geöffnet',
      'clicked': 'Geklickt', 'soft_bounce': 'Soft Bounce', 'hard_bounce': 'Hard Bounce',
      'spam': 'Spam', 'blocked': 'Blocked', 'deferred': 'Deferred', 'error': 'Error',
      'email_geoeffnet': 'Geöffnet', 'bounce': 'Bounce', 'kontaktiert': 'Gesendet',
      'geantwortet': 'Geantwortet',
    };
    return labels[event] || event;
  }

  // ── FILTERING ─────────────────────────────
  const filtered = useMemo(() => {
    let list = partners;
    if (filter !== 'alle') list = list.filter(p => p.type === filter);
    if (statusFilter !== 'alle') list = list.filter(p => p.status === statusFilter);
    else list = list.filter(p => p.status !== 'trash'); // Hide trash by default
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        (p.first_name || '').toLowerCase().includes(s) ||
        (p.last_name || '').toLowerCase().includes(s) ||
        (p.name || '').toLowerCase().includes(s) ||
        (p.company || '').toLowerCase().includes(s) ||
        (p.email || '').toLowerCase().includes(s) ||
        (p.city || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [partners, filter, statusFilter, search]);

  // ── STATS ─────────────────────────────────
  const stats = useMemo(() => {
    const nonTrash = partners.filter(p => p.status !== 'trash');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return {
      total: nonTrash.length,
      aktiv: partners.filter(p => p.status === 'aktiv').length,
      offen: partners.filter(p => ['kontaktiert', 'follow_up', 'angebot', 'email_geoeffnet'].includes(p.status)).length,
      geoeffnet: partners.filter(p => p.status === 'email_geoeffnet').length,
      geantwortet: partners.filter(p => p.status === 'geantwortet').length,
      followupFaellig: partners.filter(p => p.status !== 'trash' && p.next_followup_date && new Date(p.next_followup_date) <= today).length,
      trash: partners.filter(p => p.status === 'trash').length,
      bounce: partners.filter(p => p.status === 'bounce').length,
    };
  }, [partners]);

  // ── SELECTION ─────────────────────────────
  const toggleSelect = (id) => { setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const toggleSelectAll = () => { if (selected.size === filtered.length) setSelected(new Set()); else setSelected(new Set(filtered.map(p => p.id))); };

  // ── BULK STATUS ───────────────────────────
  async function bulkSetStatus(ids, status) {
    const label = PARTNER_STATUS[status]?.label || status;
    const { error } = await supabase.from('partners').update({ status }).in('id', ids);
    if (error) { toast.error('Fehler: ' + error.message); return; }
    toast.success(`${ids.length} Partner → ${label}`);
    setSelected(new Set());
    loadData();
  }

  // ── DELETE ────────────────────────────────
  async function handleDelete(ids) {
    if (!window.confirm(`${ids.length} Partner endgültig löschen?`)) return;
    const { error } = await supabase.from('partners').delete().in('id', ids);
    if (error) { toast.error('Fehler: ' + error.message); return; }
    toast.success(`${ids.length} Partner gelöscht`);
    setSelected(new Set());
    loadData();
  }

  // ── RENDER ────────────────────────────────
  return (
    <Layout>
      <Header>
        <div>
          <Title>Kooperationen</Title>
          <Subtitle>Partner-CRM · E-Mail-Outreach · XLSX-Import · Tracking</Subtitle>
        </div>
        <HeaderActions>
          <Button onClick={syncBrevoEvents} disabled={syncing}>
            {syncing ? '⏳ Sync...' : '🔄 Brevo Sync'}
          </Button>
          <Button onClick={() => setShowImportModal(true)}>📥 XLSX Import</Button>
          <Button $primary onClick={() => setShowAddModal(true)}>+ Partner</Button>
        </HeaderActions>
      </Header>

      {/* KPIs */}
      <StatsRow>
        <StatCard><StatNumber>{stats.total}</StatNumber><StatLabel>Gesamt</StatLabel></StatCard>
        <StatCard><StatNumber $color={colors.green}>{stats.aktiv}</StatNumber><StatLabel>Aktive Partner</StatLabel></StatCard>
        <StatCard><StatNumber $color={colors.blue}>{stats.offen}</StatNumber><StatLabel>In Pipeline</StatLabel></StatCard>
        <StatCard><StatNumber $color="#06B6D4">{stats.geoeffnet}</StatNumber><StatLabel>Mail geöffnet</StatLabel></StatCard>
        <StatCard><StatNumber $color="#14B8A6">{stats.geantwortet}</StatNumber><StatLabel>Geantwortet</StatLabel></StatCard>
        <StatCard><StatNumber $color={colors.orange}>{stats.followupFaellig}</StatNumber><StatLabel>Follow-up fällig</StatLabel></StatCard>
        <StatCard><StatNumber $color="#991B1B">{stats.trash}</StatNumber><StatLabel>Trash</StatLabel></StatCard>
        <StatCard><StatNumber $color="#DC2626">{stats.bounce}</StatNumber><StatLabel>Bounced</StatLabel></StatCard>
      </StatsRow>

      {/* Typ-Filter */}
      <Filters>
        <FilterBtn $active={filter === 'alle'} onClick={() => setFilter('alle')}>Alle ({partners.filter(p => p.status !== 'trash').length})</FilterBtn>
        {Object.entries(PARTNER_TYPES).map(([key, t]) => (
          <FilterBtn key={key} $active={filter === key} onClick={() => setFilter(key)}>
            {t.icon} {t.label} ({partners.filter(p => p.type === key && p.status !== 'trash').length})
          </FilterBtn>
        ))}
      </Filters>

      {/* Status-Filter */}
      <Filters>
        <FilterBtn $active={statusFilter === 'alle'} onClick={() => setStatusFilter('alle')}>Alle (ohne Trash)</FilterBtn>
        {Object.entries(PARTNER_STATUS).map(([key, s]) => {
          const count = partners.filter(p => p.status === key).length;
          if (count === 0 && key !== 'trash') return null;
          return (
            <FilterBtn key={key} $active={statusFilter === key} onClick={() => setStatusFilter(key)}>
              {s.label} ({count})
            </FilterBtn>
          );
        })}
      </Filters>

      {/* Actions */}
      <ActionRow>
        <SearchInput placeholder="Suche nach Name, Firma, E-Mail, Stadt..." value={search} onChange={e => setSearch(e.target.value)} />
        {selected.size > 0 && (
          <>
            <Button $small $secondary onClick={() => {
              const bulkPartners = partners.filter(p => selected.has(p.id));
              setShowComposer({ partners: bulkPartners, bulk: true });
            }}>✉️ Mail ({selected.size})</Button>
            <Button $small style={{ background: '#06B6D4', color: '#fff', borderColor: '#06B6D4' }}
              onClick={() => bulkSetStatus([...selected], 'email_geoeffnet')}>👁 Geöffnet</Button>
            <Button $small $success onClick={() => bulkSetStatus([...selected], 'geantwortet')}>💬 Geantwortet</Button>
            <Button $small style={{ background: '#991B1B', color: '#fff', borderColor: '#991B1B' }}
              onClick={() => bulkSetStatus([...selected], 'trash')}>🗑 Trash</Button>
            {statusFilter === 'trash' && (
              <Button $small $danger onClick={() => handleDelete([...selected])}>❌ Endgültig löschen</Button>
            )}
          </>
        )}
      </ActionRow>

      {/* Table */}
      <Table>
        <TableHeader>
          <div><Checkbox type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /></div>
          <div>Name / Firma</div>
          <div>E-Mail</div>
          <div>Typ</div>
          <div>Stadt</div>
          <div>Status</div>
          <div>Follow-up</div>
          <div>Tracking</div>
          <div>Mail</div>
        </TableHeader>
        {loading ? (
          <EmptyState>Laden...</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>{statusFilter === 'trash' ? 'Trash ist leer.' : 'Keine Partner gefunden.'}</EmptyState>
        ) : (
          filtered.map(partner => {
            const typeInfo = PARTNER_TYPES[partner.type] || {};
            const statusInfo = PARTNER_STATUS[partner.status] || {};
            const isOverdue = partner.next_followup_date && new Date(partner.next_followup_date) <= new Date();
            const isTrash = partner.status === 'trash';
            return (
              <TableRow key={partner.id} $trash={isTrash}>
                <div onClick={e => e.stopPropagation()}><Checkbox type="checkbox" checked={selected.has(partner.id)} onChange={() => toggleSelect(partner.id)} /></div>
                <div onClick={() => setShowDetailModal(partner)}>
                  <strong>{getFullName(partner)}</strong>
                  {partner.company && partner.first_name && <span style={{ color: colors.gray, marginLeft: '0.4rem', fontSize: '0.75rem' }}>{partner.company}</span>}
                </div>
                <div style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={partner.email}>{partner.email}</div>
                <div><TypeIcon>{typeInfo.icon}</TypeIcon><span style={{ fontSize: '0.75rem' }}>{typeInfo.label}</span></div>
                <div style={{ fontSize: '0.8rem' }}>{partner.city || '–'}</div>
                <div><Badge $color={statusInfo.color}>{statusInfo.label}</Badge></div>
                <div style={{ fontSize: '0.7rem' }}>
                  {partner.next_followup_date ? (
                    <span style={{ color: isOverdue ? '#EF4444' : colors.gray }}>
                      {new Date(partner.next_followup_date).toLocaleDateString('de-DE')}
                      {isOverdue && <FollowupBadge>Fällig!</FollowupBadge>}
                    </span>
                  ) : '–'}
                </div>
                <div style={{ fontSize: '0.7rem' }}>
                  {partner.last_email_event ? (
                    <span title={partner.last_email_event_at ? new Date(partner.last_email_event_at).toLocaleString('de-DE') : ''}>
                      {eventIcon(partner.last_email_event)} {eventLabel(partner.last_email_event)}
                      {partner.email_bounce_count > 0 && <span style={{color:'#DC2626',marginLeft:'0.2rem',fontWeight:700}}>×{partner.email_bounce_count}</span>}
                    </span>
                  ) : (
                    ['delivered','opened','clicked','soft_bounce','hard_bounce','blocked','spam','deferred','error','email_geoeffnet','bounce'].includes(partner.status) 
                      ? <span>{eventIcon(partner.status)} {eventLabel(partner.status)}</span>
                    : partner.status === 'geantwortet' ? <span>💬 Geantwortet</span> 
                    : partner.status === 'kontaktiert' ? <span>📤 Gesendet</span>
                    : '–'
                  )}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  {!isTrash && (
                    <Button $small style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => setShowComposer({ partner, bulk: false })}>✉️</Button>
                  )}
                </div>
              </TableRow>
            );
          })
        )}
      </Table>

      {/* ── MODALS ─────────────────────────── */}
      {showAddModal && <AddPartnerModal partners={partners} onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); loadData(); }} />}
      {showDetailModal && (
        <PartnerDetailModal
          partner={showDetailModal}
          emailLogs={emailLogs.filter(l => l.partner_id === showDetailModal.id)}
          emailEvents={getPartnerEvents(showDetailModal.id)}
          eventIcon={eventIcon}
          onClose={() => setShowDetailModal(null)}
          onSaved={() => { setShowDetailModal(null); loadData(); }}
          onEmail={(p) => { setShowDetailModal(null); setShowComposer({ partner: p, bulk: false }); }}
          onDelete={(id) => { setShowDetailModal(null); handleDelete([id]); }}
        />
      )}
      {showComposer && <EmailComposerModal {...showComposer} onClose={() => setShowComposer(null)} onSent={() => { setShowComposer(null); loadData(); }} />}
      {showImportModal && <ImportModal existingEmails={partners.map(p => p.email.toLowerCase())} onClose={() => setShowImportModal(false)} onImported={() => { setShowImportModal(false); loadData(); }} />}

      {/* Global Progress Bar */}
      {progress && (
        <ProgressOverlay>
          <ProgressHeader>
            <ProgressTitle>{progress.title}</ProgressTitle>
            <ProgressCount>{progress.current}/{progress.total}</ProgressCount>
          </ProgressHeader>
          <ProgressBarOuter>
            <ProgressBarInner $pct={Math.round((progress.current / progress.total) * 100)} $color={progress.color || colors.red} />
          </ProgressBarOuter>
          <ProgressDetail>{progress.detail}</ProgressDetail>
        </ProgressOverlay>
      )}
    </Layout>
  );
}


// ============================================
// IMPORT MODAL (XLSX Upload + Duplicate Check)
// ============================================

function ImportModal({ existingEmails, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(f) {
    if (!f) return;
    setFile(f);
    try {
      const rows = await parseXLSX(f);
      // Mark duplicates
      const withDupeCheck = rows.map(r => ({
        ...r,
        isDuplicate: existingEmails.includes((r.email || '').toLowerCase()),
        // Validate type
        typeValid: ['fotograf', 'planer', 'traurednerin', 'location', 'blog'].includes((r.type || '').toLowerCase()),
      }));
      setParsed(withDupeCheck);
    } catch (err) {
      toast.error('Datei konnte nicht gelesen werden: ' + err.message);
    }
  }

  const newEntries = parsed ? parsed.filter(r => !r.isDuplicate && r.typeValid) : [];
  const duplicates = parsed ? parsed.filter(r => r.isDuplicate) : [];
  const invalidType = parsed ? parsed.filter(r => !r.isDuplicate && !r.typeValid) : [];

  async function handleImport() {
    if (newEntries.length === 0) { toast.error('Keine neuen Einträge zum Importieren'); return; }
    setImporting(true);

    const toInsert = newEntries.map(r => ({
      first_name: r.first_name || null,
      last_name: r.last_name || null,
      name: [r.first_name, r.last_name].filter(Boolean).join(' ') || r.company || '',
      email: r.email,
      company: r.company || null,
      type: r.type.toLowerCase(),
      phone: r.phone || null,
      city: r.city || null,
      website: r.website || null,
      instagram: r.instagram || null,
      notes: r.notes || null,
      status: 'neu',
      referral_code: `SI-${r.type.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    }));

    const { error } = await supabase.from('partners').insert(toInsert);
    if (error) { toast.error('Import-Fehler: ' + error.message); setImporting(false); return; }

    toast.success(`${toInsert.length} Partner importiert${duplicates.length > 0 ? `, ${duplicates.length} Duplikate übersprungen` : ''}`);
    onImported();
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          📥 XLSX Import
          <CloseBtn onClick={onClose}>×</CloseBtn>
        </ModalHeader>
        <ModalBody>
          {/* Info */}
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '1rem', marginBottom: '1rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
            <strong>Spaltenreihenfolge in der XLSX:</strong><br />
            Vorname | Nachname | E-Mail* | Firma | Typ* (fotograf/planer/traurednerin/location/blog) | Telefon | Stadt | Website | Instagram | Notizen<br />
            <span style={{ color: colors.gray }}>* = Pflichtfelder. Vorname oder Firma muss gesetzt sein. Duplikate (gleiche E-Mail) werden automatisch übersprungen.</span>
          </div>

          {/* Drop Zone */}
          {!parsed && (
            <DropZone
              $active={dragActive}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: colors.gray }}>
                XLSX-Datei hierher ziehen oder <strong style={{ color: colors.red }}>klicken</strong>
              </div>
              <HiddenInput ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => handleFile(e.target.files[0])} />
            </DropZone>
          )}

          {/* Preview */}
          {parsed && (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <Badge $color={colors.green} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                  ✓ {newEntries.length} neu
                </Badge>
                {duplicates.length > 0 && (
                  <Badge $color="#991B1B" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    ✗ {duplicates.length} Duplikate (werden übersprungen)
                  </Badge>
                )}
                {invalidType.length > 0 && (
                  <Badge $color={colors.orange} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    ⚠ {invalidType.length} ungültiger Typ
                  </Badge>
                )}
              </div>

              <ImportPreview>
                <ImportRow>
                  <div>Name</div><div>E-Mail</div><div>Typ</div><div>Status</div>
                </ImportRow>
                {parsed.map((r, i) => (
                  <ImportRow key={i} style={{ background: r.isDuplicate ? '#FEF2F2' : r.typeValid ? 'transparent' : '#FFFBEB' }}>
                    <div>{[r.first_name, r.last_name].filter(Boolean).join(' ') || r.company || '–'}</div>
                    <div>{r.email}{r.isDuplicate && <DuplicateTag>Duplikat</DuplicateTag>}{!r.isDuplicate && r.typeValid && <NewTag>Neu</NewTag>}</div>
                    <div style={{ color: r.typeValid ? 'inherit' : '#B45309' }}>{r.type || '–'}{!r.typeValid && !r.isDuplicate && ' ⚠'}</div>
                    <div>{r.isDuplicate ? 'Übersprungen' : r.typeValid ? 'Wird importiert' : 'Typ ungültig'}</div>
                  </ImportRow>
                ))}
              </ImportPreview>

              <Button $small onClick={() => { setParsed(null); setFile(null); }} style={{ marginTop: '0.5rem' }}>
                Andere Datei wählen
              </Button>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Abbrechen</Button>
          {parsed && (
            <Button $primary disabled={importing || newEntries.length === 0} onClick={handleImport}>
              {importing ? 'Importiere...' : `${newEntries.length} Partner importieren`}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}


// ============================================
// ADD PARTNER MODAL (with duplicate check)
// ============================================

function AddPartnerModal({ partners, onClose, onSaved }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', company: '', email: '', phone: '', type: 'fotograf', city: '', website: '', instagram: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Live duplicate check
  const isDuplicate = form.email && partners.some(p => p.email.toLowerCase() === form.email.toLowerCase());
  // Mindestens Vorname oder Firma muss gesetzt sein
  const hasIdentifier = form.first_name || form.company;

  async function handleSave() {
    if (!hasIdentifier) { toast.error('Vorname oder Firma muss ausgefüllt sein'); return; }
    if (!form.email) { toast.error('E-Mail ist Pflicht'); return; }
    if (isDuplicate) { toast.error(`E-Mail ${form.email} existiert bereits!`); return; }
    setSaving(true);
    const code = `SI-${form.type.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from('partners').insert([{
      ...form,
      name: getFullName(form), // Legacy-Feld für Kompatibilität
      status: 'neu',
      referral_code: code,
    }]);
    if (error) { toast.error('Fehler: ' + error.message); setSaving(false); return; }
    toast.success(`${getDisplayName(form)} hinzugefügt`);
    onSaved();
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>Partner hinzufügen<CloseBtn onClick={onClose}>×</CloseBtn></ModalHeader>
        <ModalBody>
          <FormGrid $cols="1fr 1fr 1fr">
            <FormGroup $noMargin><Label>Vorname</Label><Input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Anna" /></FormGroup>
            <FormGroup $noMargin><Label>Nachname</Label><Input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Schmidt" /></FormGroup>
            <FormGroup $noMargin><Label>Firma</Label><Input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Fotostudio XY" /></FormGroup>
          </FormGrid>
          {!hasIdentifier && <div style={{ color: colors.orange, fontSize: '0.75rem', marginBottom: '0.5rem' }}>Bitte Vorname oder Firma ausfüllen</div>}
          <FormGrid>
            <FormGroup $noMargin>
              <Label>E-Mail *</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="mail@example.de"
                style={isDuplicate ? { borderColor: '#EF4444', background: '#FEF2F2' } : {}} />
              {isDuplicate && <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.3rem', fontWeight: 600 }}>⚠ Diese E-Mail existiert bereits!</div>}
            </FormGroup>
            <FormGroup $noMargin><Label>Telefon</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+49 ..." /></FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup $noMargin><Label>Typ *</Label><Select value={form.type} onChange={e => set('type', e.target.value)}>{Object.entries(PARTNER_TYPES).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v.label}</option>))}</Select></FormGroup>
            <FormGroup $noMargin><Label>Stadt</Label><Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Hamburg" /></FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup $noMargin><Label>Website</Label><Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." /></FormGroup>
            <FormGroup $noMargin><Label>Instagram</Label><Input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@handle" /></FormGroup>
          </FormGrid>
          <FormGroup><Label>Notizen</Label><TextArea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Interne Notizen..." /></FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button $primary disabled={saving || isDuplicate || !hasIdentifier} onClick={handleSave}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}


// ============================================
// PARTNER DETAIL MODAL
// ============================================

function PartnerDetailModal({ partner, emailLogs, emailEvents = [], eventIcon, onClose, onSaved, onEmail, onDelete }) {
  const [form, setForm] = useState({ ...partner });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const typeInfo = PARTNER_TYPES[form.type] || {};
  const statusInfo = PARTNER_STATUS[form.status] || {};

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('partners').update({
      first_name: form.first_name, last_name: form.last_name, name: getFullName(form),
      company: form.company, email: form.email, phone: form.phone,
      type: form.type, status: form.status, city: form.city, website: form.website,
      instagram: form.instagram, notes: form.notes, provision_percent: form.provision_percent,
    }).eq('id', partner.id);
    if (error) { toast.error('Fehler: ' + error.message); setSaving(false); return; }
    toast.success('Gespeichert');
    onSaved();
  }

  return (
    <Overlay onClick={onClose}>
      <Modal $wide onClick={e => e.stopPropagation()}>
        <ModalHeader>{typeInfo.icon} {getFullName(partner)} {partner.company && partner.first_name && `· ${partner.company}`}<CloseBtn onClick={onClose}>×</CloseBtn></ModalHeader>
        <ModalBody>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <FormGrid $cols="1fr 1fr 1fr">
                <FormGroup $noMargin><Label>Vorname</Label><Input value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} /></FormGroup>
                <FormGroup $noMargin><Label>Nachname</Label><Input value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} /></FormGroup>
                <FormGroup $noMargin><Label>Firma</Label><Input value={form.company || ''} onChange={e => set('company', e.target.value)} /></FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin><Label>E-Mail</Label><Input value={form.email} onChange={e => set('email', e.target.value)} /></FormGroup>
                <FormGroup $noMargin><Label>Telefon</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin><Label>Typ</Label><Select value={form.type} onChange={e => set('type', e.target.value)}>{Object.entries(PARTNER_TYPES).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v.label}</option>))}</Select></FormGroup>
                <FormGroup $noMargin>
                  <Label>Status</Label>
                  <Select value={form.status} onChange={e => set('status', e.target.value)}>
                    {Object.entries(PARTNER_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                  </Select>
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin><Label>Stadt</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></FormGroup>
                <FormGroup $noMargin><Label>Provision %</Label><Input type="number" value={form.provision_percent || 15} onChange={e => set('provision_percent', e.target.value)} /></FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin><Label>Website</Label><Input value={form.website || ''} onChange={e => set('website', e.target.value)} /></FormGroup>
                <FormGroup $noMargin><Label>Instagram</Label><Input value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} /></FormGroup>
              </FormGrid>
              <FormGroup><Label>Referral Code</Label><Input value={form.referral_code || ''} readOnly style={{ background: '#F5F5F5', color: colors.gray }} /></FormGroup>
              <FormGroup><Label>Notizen</Label><TextArea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></FormGroup>
            </div>
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <Label>Status</Label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <Badge $color={statusInfo.color} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>{statusInfo.label}</Badge>
                  {partner.first_contact_date && <span style={{ fontSize: '0.7rem', color: colors.gray }}>Erst: {new Date(partner.first_contact_date).toLocaleDateString('de-DE')}</span>}
                  {partner.last_contact_date && <span style={{ fontSize: '0.7rem', color: colors.gray }}>Letzt: {new Date(partner.last_contact_date).toLocaleDateString('de-DE')}</span>}
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <Label>Schnell-Aktionen</Label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <Button $primary $small onClick={() => onEmail(form)}>✉️ E-Mail</Button>
                  <Button $small style={{ background: '#06B6D4', color: '#fff', borderColor: '#06B6D4' }}
                    onClick={async () => { await supabase.from('partners').update({ status: 'email_geoeffnet' }).eq('id', partner.id); toast.success('→ Geöffnet'); onSaved(); }}>👁 Geöffnet</Button>
                  <Button $small $success onClick={async () => { await supabase.from('partners').update({ status: 'geantwortet' }).eq('id', partner.id); toast.success('→ Geantwortet'); onSaved(); }}>💬 Geantwortet</Button>
                  <Button $small style={{ background: '#991B1B', color: '#fff', borderColor: '#991B1B' }}
                    onClick={async () => { await supabase.from('partners').update({ status: 'trash' }).eq('id', partner.id); toast.success('→ Trash'); onSaved(); }}>🗑 Trash</Button>
                </div>
              </div>
              <div>
                <Label>E-Mail-Verlauf ({emailLogs.length})</Label>
                <div style={{ border: `1px solid ${colors.lightGray}`, maxHeight: '250px', overflowY: 'auto', marginTop: '0.5rem' }}>
                  {emailLogs.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: colors.gray, fontSize: '0.8rem' }}>Noch keine E-Mails gesendet</div>
                  ) : (
                    emailLogs.map(log => (
                      <EmailLogItem key={log.id}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{log.subject}</div>
                          <div style={{ color: colors.gray, fontSize: '0.7rem' }}>{log.sent_at ? new Date(log.sent_at).toLocaleString('de-DE') : '–'}</div>
                        </div>
                        <Badge $color={log.status === 'sent' ? colors.green : '#EF4444'}>{log.status === 'sent' ? '✓' : '✗'}</Badge>
                      </EmailLogItem>
                    ))
                  )}
                </div>
              </div>
              {/* Brevo Event Timeline */}
              <div style={{ marginTop: '1.5rem' }}>
                <Label>Brevo Events ({emailEvents.length})</Label>
                <div style={{ border: `1px solid ${colors.lightGray}`, maxHeight: '200px', overflowY: 'auto', marginTop: '0.5rem' }}>
                  {emailEvents.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: colors.gray, fontSize: '0.8rem' }}>Keine Events – klicke "🔄 Brevo Sync"</div>
                  ) : (
                    emailEvents.map(evt => {
                      const evtColors = { delivered: colors.green, opened: '#06B6D4', unique_opened: '#06B6D4', proxy_open: '#06B6D4', clicked: colors.blue, soft_bounce: colors.orange, hard_bounce: '#DC2626', spam: '#DC2626', blocked: '#DC2626' };
                      return (
                        <EmailLogItem key={evt.id}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              {eventIcon ? eventIcon(evt.event) : '📧'} {evt.event.replace(/_/g, ' ')}
                              {evt.subject && <span style={{ fontWeight: 400, color: colors.gray, marginLeft: '0.5rem' }}>– {evt.subject}</span>}
                            </div>
                            <div style={{ color: colors.gray, fontSize: '0.7rem' }}>{new Date(evt.timestamp).toLocaleString('de-DE')}</div>
                          </div>
                          <Badge $color={evtColors[evt.event] || colors.gray}>{evt.event.replace(/_/g, ' ')}</Badge>
                        </EmailLogItem>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button $danger $small onClick={() => onDelete(partner.id)} style={{ marginRight: 'auto' }}>Endgültig löschen</Button>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button $primary disabled={saving} onClick={handleSave}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}


// ============================================
// EMAIL COMPOSER MODAL
// Gemischte Typen: Jeder Partner bekommt automatisch
// das Template passend zu seinem Typ.
// Gleicher Typ: Editierbarer Composer wie gewohnt.
// ============================================

function EmailComposerModal({ partner, partners, bulk, onClose, onSent }) {
  const templates = getDefaultTemplates();
  const targetPartners = bulk ? partners : [partner];
  const firstPartner = targetPartners[0];

  // Prüfe ob gemischte Typen in der Auswahl sind
  const uniqueTypes = [...new Set(targetPartners.map(p => p.type))];
  const isMixedTypes = uniqueTypes.length > 1;

  const [stage, setStage] = useState('erstansprache');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendProgress, setSendProgress] = useState(null);
  const [previewPartner, setPreviewPartner] = useState(firstPartner);

  // Template laden (bei gemischten Typen: Preview-Partner bestimmt Anzeige)
  useEffect(() => {
    const type = (isMixedTypes ? previewPartner?.type : firstPartner?.type) || 'fotograf';
    const name = (isMixedTypes ? getDisplayName(previewPartner || {}) : getDisplayName(firstPartner || {})) || '[Name]';
    const tmpl = templates[type]?.[stage];
    if (tmpl) {
      // Bei gemischten Typen: Subject/Body nur für Preview setzen, nicht editieren
      if (!isMixedTypes) {
        setSubject(tmpl.subject);
        setBody(tmpl.body.replace(/\{name\}/g, name));
      }
    }
  }, [stage, firstPartner?.type, firstPartner?.name, isMixedTypes]);

  // Preview HTML (bei gemischten Typen: zeigt Template des ausgewählten Preview-Partners)
  const previewHTML = useMemo(() => {
    if (isMixedTypes) {
      const type = previewPartner?.type || 'fotograf';
      const tmpl = templates[type]?.[stage];
      if (tmpl) {
        const text = tmpl.body.replace(/\{name\}/g, getDisplayName(previewPartner || {}));
        return wrapInEmailHTML(text, getDisplayName(previewPartner || {}));
      }
    }
    return wrapInEmailHTML(body, getDisplayName(firstPartner || {}));
  }, [body, firstPartner, isMixedTypes, previewPartner, stage]);

  // Zusammenfassung für gemischte Typen
  const typeSummary = useMemo(() => {
    if (!isMixedTypes) return null;
    return uniqueTypes.map(type => {
      const info = PARTNER_TYPES[type] || {};
      const count = targetPartners.filter(p => p.type === type).length;
      return { type, ...info, count };
    });
  }, [isMixedTypes, uniqueTypes, targetPartners]);

  async function handleSend() {
    setSending(true);
    const total = targetPartners.length;
    setSendProgress({ current: 0, total, detail: 'Starte Versand…' });
    let ok = 0, fail = 0;

    for (let i = 0; i < total; i++) {
      const p = targetPartners[i];
      setSendProgress({ current: i + 1, total, detail: `${getDisplayName(p)} · ${p.email}` });
      try {
        // Pro Partner das richtige Template laden (basierend auf SEINEM Typ)
        const tmpl = templates[p.type]?.[stage];
        const displayName = getDisplayName(p);
        const fullName = getFullName(p);
        const partnerSubject = isMixedTypes ? (tmpl?.subject || subject) : subject;
        const partnerBody = isMixedTypes
          ? (tmpl?.body || '').replace(/\{name\}/g, displayName)
          : body.replace(/\{name\}/g, displayName);

        if (!partnerSubject || !partnerBody) {
          console.error(`Kein Template für Typ "${p.type}" / Stufe "${stage}"`);
          fail++;
          continue;
        }

        const html = wrapInEmailHTML(partnerBody, displayName);

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: p.email, toName: fullName, subject: partnerSubject, htmlContent: html }),
        });
        const result = await response.json();

        await supabase.from('email_logs').insert([{
          partner_id: p.id, recipient_email: p.email, recipient_name: fullName,
          subject: partnerSubject, template_type: `partner_${stage}`,
          status: response.ok ? 'sent' : 'failed',
          error_message: response.ok ? null : (result.error || 'Unknown'),
          brevo_message_id: result.messageId || null,
          sent_at: response.ok ? new Date().toISOString() : null,
        }]);

        if (response.ok) {
          ok++;
          const now = new Date().toISOString();
          const days = FOLLOWUP_DAYS[stage] || 0;
          const nextFU = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
          const updates = { status: STATUS_AFTER_EMAIL[stage] || p.status, last_contact_date: now };
          if (!p.first_contact_date) updates.first_contact_date = now;
          if (nextFU) updates.next_followup_date = nextFU;
          else if (stage === 'abschluss') updates.next_followup_date = null;
          await supabase.from('partners').update(updates).eq('id', p.id);
        } else { fail++; }

        if (bulk && targetPartners.length > 1) await new Promise(r => setTimeout(r, 1000));
      } catch (err) { console.error(`Error: ${p.email}`, err); fail++; }
    }

    setSending(false); setSent(true);
    setSendProgress({ current: total, total, detail: fail === 0 ? `✓ ${ok} E-Mails gesendet` : `${ok} gesendet, ${fail} fehlgeschlagen` });
    if (fail === 0) toast.success(`${ok} E-Mail(s) gesendet!`);
    else toast.error(`${ok} gesendet, ${fail} fehlgeschlagen`);
    setTimeout(() => { setSendProgress(null); onSent(); }, 2000);
  }

  return (
    <Overlay onClick={onClose}>
      <Modal $wide onClick={e => e.stopPropagation()}>
        <ModalHeader>✉️ E-Mail Composer {bulk ? `· ${targetPartners.length} Empfänger` : `· ${getDisplayName(firstPartner || {})}`}<CloseBtn onClick={onClose}>×</CloseBtn></ModalHeader>
        <ModalBody>
          {/* Empfänger-Info */}
          <div style={{ background: '#F8FAFC', border: `1px solid ${colors.lightGray}`, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <strong>An:</strong> {bulk ? targetPartners.map(p => `${getFullName(p)} <${p.email}>`).join(', ') : `${getFullName(firstPartner || {})} <${firstPartner?.email}>`}
          </div>

          {/* Hinweis bei gemischten Typen */}
          {isMixedTypes && (
            <div style={{ background: '#FFF7ED', border: '2px solid #FB923C', padding: '1rem', marginBottom: '1rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#C2410C' }}>📋 Gemischte Partner-Typen erkannt</strong><br />
              Jeder Partner bekommt automatisch das Template passend zu seinem Typ:
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {typeSummary.map(t => (
                  <Badge key={t.type} $color={t.color} style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                    {t.icon} {t.count}× {t.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Mail-Stufe */}
          <Label>Mail-Stufe</Label>
          <StageSelector>
            {EMAIL_STAGES.map(s => (
              <StageBtn key={s.id} $active={stage === s.id} onClick={() => setStage(s.id)}>
                {s.icon} {s.label} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(Tag {s.day})</span>
              </StageBtn>
            ))}
          </StageSelector>

          {isMixedTypes ? (
            /* ── GEMISCHTE TYPEN: Preview-Tabs statt Editor ── */
            <>
              <Label>Vorschau pro Typ <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Text wird automatisch pro Partner-Typ zugewiesen)</span></Label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {targetPartners.map(p => {
                  const ti = PARTNER_TYPES[p.type] || {};
                  return (
                    <StageBtn key={p.id} $active={previewPartner?.id === p.id}
                      onClick={() => setPreviewPartner(p)}>
                      {ti.icon} {getDisplayName(p)}
                    </StageBtn>
                  );
                })}
              </div>
              <PreviewFrame style={{ maxHeight: '400px' }}>
                <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
              </PreviewFrame>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: colors.gray }}>
                Zeigt: {PARTNER_TYPES[previewPartner?.type]?.icon} {PARTNER_TYPES[previewPartner?.type]?.label}-Template für {getDisplayName(previewPartner || {})}
              </div>
            </>
          ) : (
            /* ── GLEICHER TYP: Editierbarer Composer ── */
            <>
              <FormGroup><Label>Betreff (editierbar)</Label><Input value={subject} onChange={e => setSubject(e.target.value)} /></FormGroup>
              <ComposerLayout>
                <div>
                  <Label>Text (editierbar) · <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}><code style={{ background: '#F3F4F6', padding: '0 4px' }}>{'{name}'}</code> = Platzhalter</span></Label>
                  <TextArea $tall value={body} onChange={e => setBody(e.target.value)} />
                </div>
                <div>
                  <Label>Vorschau</Label>
                  <PreviewFrame><div dangerouslySetInnerHTML={{ __html: previewHTML }} /></PreviewFrame>
                </div>
              </ComposerLayout>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {sendProgress && (
            <div style={{ flex: '1 1 100%', marginBottom: '0.75rem' }}>
              <ProgressHeader>
                <ProgressTitle style={{ color: colors.black, fontSize: '0.75rem' }}>✉️ Versand</ProgressTitle>
                <ProgressCount style={{ color: colors.gray }}>{sendProgress.current}/{sendProgress.total}</ProgressCount>
              </ProgressHeader>
              <ProgressBarOuter style={{ height: '4px' }}>
                <ProgressBarInner $pct={Math.round((sendProgress.current / sendProgress.total) * 100)} $color={sendProgress.current === sendProgress.total ? '#10B981' : colors.red} />
              </ProgressBarOuter>
              <ProgressDetail style={{ color: colors.gray }}>{sendProgress.detail}</ProgressDetail>
            </div>
          )}
          <Button onClick={onClose}>Abbrechen</Button>
          <Button $primary disabled={sending || sent} onClick={handleSend}>
            {sent ? '✓ Gesendet!' : sending ? `Sende... (${sendProgress?.current || 0}/${targetPartners.length})` : `✉️ Jetzt senden (${targetPartners.length})`}
          </Button>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}
