// src/pages/PartnersPage.js
// Kooperationen – Mini-CRM mit E-Mail-Composer
// Brevo wird nur als Versand-Engine im Hintergrund genutzt

import React, { useState, useEffect, useMemo } from 'react';
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
  getDefaultTemplates,
  wrapInEmailHTML,
} from '../lib/partnerEmailTemplates';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5', purple: '#8B5CF6', blue: '#3B82F6', pink: '#EC4899' };

// ============================================
// STYLED COMPONENTS
// ============================================

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black};
  flex-wrap: wrap; gap: 1rem;
`;
const Title = styled.h1`font-family: 'Oswald', sans-serif; font-size: 3rem; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; color: ${colors.black}; line-height: 1;`;
const Subtitle = styled.p`font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.gray}; margin-top: 0.5rem;`;

const StatsRow = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem;`;
const StatCard = styled.div`background: ${colors.white}; border: 2px solid ${colors.black}; padding: 1.25rem; text-align: center;`;
const StatNumber = styled.div`font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; color: ${p => p.$color || colors.black};`;
const StatLabel = styled.div`font-family: 'Inter', sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: ${colors.gray}; margin-top: 0.25rem;`;

const Filters = styled.div`display: flex; gap: 0.25rem; margin-bottom: 1.5rem; background: #fff; border: 1px solid ${colors.lightGray}; padding: 0.25rem; width: fit-content; flex-wrap: wrap;`;
const FilterBtn = styled.button`
  padding: 0.5rem 1rem; background: ${p => p.$active ? colors.black : 'transparent'};
  color: ${p => p.$active ? '#fff' : colors.gray}; border: none; font-size: 0.75rem;
  font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap;
  &:hover { background: ${p => p.$active ? colors.black : '#F5F5F5'}; }
`;

const ActionRow = styled.div`display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;`;
const SearchInput = styled.input`
  padding: 0.6rem 1rem; font-family: 'Inter', sans-serif; font-size: 0.85rem;
  border: 2px solid ${colors.lightGray}; background: #fff; min-width: 250px;
  &:focus { outline: none; border-color: ${colors.black}; }
`;

const Button = styled.button`
  font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  background: ${p => p.$danger ? '#EF4444' : p.$primary ? colors.red : p.$secondary ? colors.black : colors.white};
  color: ${p => (p.$primary || p.$secondary || p.$danger) ? colors.white : colors.black};
  padding: ${p => p.$small ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  border: 2px solid ${p => p.$danger ? '#EF4444' : p.$primary ? colors.red : colors.black};
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

// Table
const Table = styled.div`background: #fff; border: 2px solid ${colors.black}; overflow-x: auto;`;
const TableHeader = styled.div`
  display: grid; grid-template-columns: 40px 1.2fr 1fr 0.8fr 0.8fr 100px 100px 60px;
  background: ${colors.black}; color: ${colors.white}; font-family: 'Inter', sans-serif;
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
  min-width: 800px;
  & > div { padding: 0.75rem 1rem; }
`;
const TableRow = styled.div`
  display: grid; grid-template-columns: 40px 1.2fr 1fr 0.8fr 0.8fr 100px 100px 60px;
  border-bottom: 1px solid ${colors.lightGray}; align-items: center; font-family: 'Inter', sans-serif;
  font-size: 0.85rem; cursor: pointer; min-width: 800px;
  transition: background 0.1s;
  &:hover { background: #FAFAFA; }
  & > div { padding: 0.75rem 1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;
const Checkbox = styled.input`width: 16px; height: 16px; cursor: pointer;`;
const Badge = styled.span`
  display: inline-block; padding: 0.2rem 0.6rem; font-size: 0.7rem; font-weight: 600;
  background: ${p => p.$color || colors.gray}20; color: ${p => p.$color || colors.gray};
  border: 1px solid ${p => p.$color || colors.gray}40; white-space: nowrap;
`;
const TypeIcon = styled.span`margin-right: 0.35rem;`;

// Modal / Overlay
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000;
  display: flex; justify-content: center; align-items: flex-start; padding: 2rem;
  overflow-y: auto;
`;
const Modal = styled.div`
  background: ${colors.white}; border: 2px solid ${colors.black}; width: 100%;
  max-width: ${p => p.$wide ? '900px' : '600px'}; max-height: 90vh; overflow-y: auto;
`;
const ModalHeader = styled.div`
  background: ${colors.black}; color: ${colors.white}; padding: 1rem 1.5rem;
  font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em; display: flex;
  justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1;
`;
const ModalBody = styled.div`padding: 1.5rem;`;
const ModalFooter = styled.div`
  padding: 1rem 1.5rem; border-top: 1px solid ${colors.lightGray};
  display: flex; justify-content: flex-end; gap: 0.75rem; position: sticky; bottom: 0;
  background: ${colors.white};
`;
const CloseBtn = styled.button`background: none; border: none; color: ${colors.white}; font-size: 1.5rem; cursor: pointer; line-height: 1;`;

// Form
const FormGrid = styled.div`display: grid; grid-template-columns: ${p => p.$cols || '1fr 1fr'}; gap: 1rem; margin-bottom: 1rem;`;
const FormGroup = styled.div`margin-bottom: ${p => p.$noMargin ? '0' : '1rem'};`;
const Label = styled.label`display: block; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.4rem;`;
const Input = styled.input`
  width: 100%; padding: 0.65rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.9rem;
  border: 2px solid ${colors.lightGray}; background: #fff;
  &:focus { outline: none; border-color: ${colors.black}; }
`;
const Select = styled.select`
  width: 100%; padding: 0.65rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.9rem;
  border: 2px solid ${colors.lightGray}; background: #fff; cursor: pointer;
  &:focus { outline: none; border-color: ${colors.black}; }
`;
const TextArea = styled.textarea`
  width: 100%; padding: 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.9rem;
  border: 2px solid ${colors.lightGray}; background: #fff; resize: vertical;
  min-height: ${p => p.$tall ? '320px' : '80px'}; line-height: 1.6;
  &:focus { outline: none; border-color: ${colors.black}; }
`;

// Email Composer
const ComposerLayout = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; @media (max-width: 900px) { grid-template-columns: 1fr; }`;
const PreviewFrame = styled.div`
  border: 2px solid ${colors.lightGray}; background: #F5F5F5; padding: 1rem;
  max-height: 500px; overflow-y: auto; font-size: 0.85rem;
`;
const StageSelector = styled.div`display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;`;
const StageBtn = styled.button`
  padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 600; border: 2px solid ${p => p.$active ? colors.red : colors.lightGray};
  background: ${p => p.$active ? colors.red + '15' : '#fff'}; color: ${p => p.$active ? colors.red : colors.gray};
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: ${colors.red}; }
`;

const EmailLogItem = styled.div`
  display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0;
  border-bottom: 1px solid ${colors.lightGray}; font-size: 0.8rem;
  &:last-child { border-bottom: none; }
`;

const EmptyState = styled.div`
  padding: 4rem 2rem; text-align: center; color: ${colors.gray};
  font-family: 'Inter', sans-serif; font-size: 0.9rem;
`;

const FollowupBadge = styled.span`
  display: inline-block; padding: 0.15rem 0.5rem; font-size: 0.65rem; font-weight: 700;
  background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; margin-left: 0.5rem;
`;

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
  const [showDetailModal, setShowDetailModal] = useState(null); // partner object
  const [showComposer, setShowComposer] = useState(null); // { partner, bulk: false } or { partners: [], bulk: true }

  // ── DATA LOADING ──────────────────────────
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: p }, { data: logs }] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('email_logs').select('*').not('partner_id', 'is', null).order('created_at', { ascending: false }),
    ]);
    setPartners(p || []);
    setEmailLogs(logs || []);
    setLoading(false);
  }

  // ── FILTERING ─────────────────────────────
  const filtered = useMemo(() => {
    let list = partners;
    if (filter !== 'alle') list = list.filter(p => p.type === filter);
    if (statusFilter !== 'alle') list = list.filter(p => p.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: partners.length,
      aktiv: partners.filter(p => p.status === 'aktiv').length,
      offen: partners.filter(p => ['kontaktiert', 'follow_up', 'angebot'].includes(p.status)).length,
      followupFaellig: partners.filter(p => p.next_followup_date && new Date(p.next_followup_date) <= today).length,
      neu: partners.filter(p => p.status === 'neu').length,
    };
  }, [partners]);

  // ── SELECTION ─────────────────────────────
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  // ── DELETE ────────────────────────────────
  async function handleDelete(ids) {
    if (!window.confirm(`${ids.length} Partner wirklich löschen?`)) return;
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
          <Subtitle>Partner-CRM · E-Mail-Outreach · Brevo im Hintergrund</Subtitle>
        </div>
        <Button $primary onClick={() => setShowAddModal(true)}>+ Partner hinzufügen</Button>
      </Header>

      {/* KPIs */}
      <StatsRow>
        <StatCard><StatNumber>{stats.total}</StatNumber><StatLabel>Gesamt</StatLabel></StatCard>
        <StatCard><StatNumber $color={colors.green}>{stats.aktiv}</StatNumber><StatLabel>Aktive Partner</StatLabel></StatCard>
        <StatCard><StatNumber $color={colors.blue}>{stats.offen}</StatNumber><StatLabel>In Pipeline</StatLabel></StatCard>
        <StatCard><StatNumber $color={colors.orange}>{stats.followupFaellig}</StatNumber><StatLabel>Follow-up fällig</StatLabel></StatCard>
        <StatCard><StatNumber $color={colors.gray}>{stats.neu}</StatNumber><StatLabel>Neu / Unbearbeitet</StatLabel></StatCard>
      </StatsRow>

      {/* Typ-Filter */}
      <Filters>
        <FilterBtn $active={filter === 'alle'} onClick={() => setFilter('alle')}>Alle ({partners.length})</FilterBtn>
        {Object.entries(PARTNER_TYPES).map(([key, t]) => (
          <FilterBtn key={key} $active={filter === key} onClick={() => setFilter(key)}>
            {t.icon} {t.label} ({partners.filter(p => p.type === key).length})
          </FilterBtn>
        ))}
      </Filters>

      {/* Status-Filter */}
      <Filters>
        <FilterBtn $active={statusFilter === 'alle'} onClick={() => setStatusFilter('alle')}>Alle Status</FilterBtn>
        {Object.entries(PARTNER_STATUS).map(([key, s]) => (
          <FilterBtn key={key} $active={statusFilter === key} onClick={() => setStatusFilter(key)}>
            {s.label} ({partners.filter(p => p.status === key).length})
          </FilterBtn>
        ))}
      </Filters>

      {/* Actions */}
      <ActionRow>
        <SearchInput placeholder="Suche nach Name, Firma, E-Mail, Stadt..." value={search} onChange={e => setSearch(e.target.value)} />
        {selected.size > 0 && (
          <>
            <Button $small $secondary onClick={() => {
              const bulkPartners = partners.filter(p => selected.has(p.id));
              setShowComposer({ partners: bulkPartners, bulk: true });
            }}>
              ✉️ Mail an {selected.size} Partner
            </Button>
            <Button $small $danger onClick={() => handleDelete([...selected])}>
              🗑 {selected.size} löschen
            </Button>
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
          <div>Mail</div>
        </TableHeader>
        {loading ? (
          <EmptyState>Laden...</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>Keine Partner gefunden. Füge deinen ersten Kooperationspartner hinzu.</EmptyState>
        ) : (
          filtered.map(partner => {
            const typeInfo = PARTNER_TYPES[partner.type] || {};
            const statusInfo = PARTNER_STATUS[partner.status] || {};
            const isOverdue = partner.next_followup_date && new Date(partner.next_followup_date) <= new Date();
            return (
              <TableRow key={partner.id}>
                <div onClick={e => e.stopPropagation()}><Checkbox type="checkbox" checked={selected.has(partner.id)} onChange={() => toggleSelect(partner.id)} /></div>
                <div onClick={() => setShowDetailModal(partner)} style={{ cursor: 'pointer' }}>
                  <strong>{partner.name}</strong>{partner.company && <span style={{ color: colors.gray, marginLeft: '0.5rem', fontSize: '0.8rem' }}>{partner.company}</span>}
                </div>
                <div style={{ fontSize: '0.8rem' }}>{partner.email}</div>
                <div><TypeIcon>{typeInfo.icon}</TypeIcon><span style={{ fontSize: '0.8rem' }}>{typeInfo.label}</span></div>
                <div style={{ fontSize: '0.8rem' }}>{partner.city || '–'}</div>
                <div><Badge $color={statusInfo.color}>{statusInfo.label}</Badge></div>
                <div style={{ fontSize: '0.75rem' }}>
                  {partner.next_followup_date ? (
                    <span style={{ color: isOverdue ? '#EF4444' : colors.gray }}>
                      {new Date(partner.next_followup_date).toLocaleDateString('de-DE')}
                      {isOverdue && <FollowupBadge>Fällig!</FollowupBadge>}
                    </span>
                  ) : '–'}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <Button $small style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                    onClick={() => setShowComposer({ partner, bulk: false })}>
                    ✉️
                  </Button>
                </div>
              </TableRow>
            );
          })
        )}
      </Table>

      {/* ── MODALS ─────────────────────────── */}
      {showAddModal && (
        <AddPartnerModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); loadData(); }}
        />
      )}

      {showDetailModal && (
        <PartnerDetailModal
          partner={showDetailModal}
          emailLogs={emailLogs.filter(l => l.partner_id === showDetailModal.id)}
          onClose={() => setShowDetailModal(null)}
          onSaved={() => { setShowDetailModal(null); loadData(); }}
          onEmail={(p) => { setShowDetailModal(null); setShowComposer({ partner: p, bulk: false }); }}
          onDelete={(id) => { setShowDetailModal(null); handleDelete([id]); }}
        />
      )}

      {showComposer && (
        <EmailComposerModal
          {...showComposer}
          onClose={() => setShowComposer(null)}
          onSent={() => { setShowComposer(null); loadData(); }}
        />
      )}
    </Layout>
  );
}


// ============================================
// ADD PARTNER MODAL
// ============================================

function AddPartnerModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', type: 'fotograf',
    city: '', website: '', instagram: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.name || !form.email) { toast.error('Name und E-Mail sind Pflicht'); return; }
    setSaving(true);

    // Generate referral code
    const code = `SI-${form.type.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase.from('partners').insert([{
      ...form,
      status: 'neu',
      referral_code: code,
    }]);

    if (error) { toast.error('Fehler: ' + error.message); setSaving(false); return; }
    toast.success(`${form.name} hinzugefügt`);
    onSaved();
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          Partner hinzufügen
          <CloseBtn onClick={onClose}>×</CloseBtn>
        </ModalHeader>
        <ModalBody>
          <FormGrid>
            <FormGroup $noMargin>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Max Mustermann" />
            </FormGroup>
            <FormGroup $noMargin>
              <Label>Firma</Label>
              <Input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Fotostudio XY" />
            </FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup $noMargin>
              <Label>E-Mail *</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="mail@example.de" />
            </FormGroup>
            <FormGroup $noMargin>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+49 ..." />
            </FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup $noMargin>
              <Label>Typ *</Label>
              <Select value={form.type} onChange={e => set('type', e.target.value)}>
                {Object.entries(PARTNER_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup $noMargin>
              <Label>Stadt</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Hamburg" />
            </FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup $noMargin>
              <Label>Website</Label>
              <Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
            </FormGroup>
            <FormGroup $noMargin>
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@handle" />
            </FormGroup>
          </FormGrid>
          <FormGroup>
            <Label>Notizen</Label>
            <TextArea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Interne Notizen..." />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button $primary disabled={saving} onClick={handleSave}>
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}


// ============================================
// PARTNER DETAIL MODAL
// ============================================

function PartnerDetailModal({ partner, emailLogs, onClose, onSaved, onEmail, onDelete }) {
  const [form, setForm] = useState({ ...partner });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const typeInfo = PARTNER_TYPES[form.type] || {};
  const statusInfo = PARTNER_STATUS[form.status] || {};

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('partners').update({
      name: form.name, company: form.company, email: form.email, phone: form.phone,
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
        <ModalHeader>
          {typeInfo.icon} {partner.name} {partner.company && `· ${partner.company}`}
          <CloseBtn onClick={onClose}>×</CloseBtn>
        </ModalHeader>
        <ModalBody>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* LEFT: Form */}
            <div>
              <FormGrid>
                <FormGroup $noMargin>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} />
                </FormGroup>
                <FormGroup $noMargin>
                  <Label>Firma</Label>
                  <Input value={form.company || ''} onChange={e => set('company', e.target.value)} />
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin>
                  <Label>E-Mail</Label>
                  <Input value={form.email} onChange={e => set('email', e.target.value)} />
                </FormGroup>
                <FormGroup $noMargin>
                  <Label>Telefon</Label>
                  <Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin>
                  <Label>Typ</Label>
                  <Select value={form.type} onChange={e => set('type', e.target.value)}>
                    {Object.entries(PARTNER_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup $noMargin>
                  <Label>Status</Label>
                  <Select value={form.status} onChange={e => set('status', e.target.value)}>
                    {Object.entries(PARTNER_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Select>
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin>
                  <Label>Stadt</Label>
                  <Input value={form.city || ''} onChange={e => set('city', e.target.value)} />
                </FormGroup>
                <FormGroup $noMargin>
                  <Label>Provision %</Label>
                  <Input type="number" value={form.provision_percent || 15} onChange={e => set('provision_percent', e.target.value)} />
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup $noMargin>
                  <Label>Website</Label>
                  <Input value={form.website || ''} onChange={e => set('website', e.target.value)} />
                </FormGroup>
                <FormGroup $noMargin>
                  <Label>Instagram</Label>
                  <Input value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} />
                </FormGroup>
              </FormGrid>
              <FormGroup>
                <Label>Referral Code</Label>
                <Input value={form.referral_code || ''} readOnly style={{ background: '#F5F5F5', color: colors.gray }} />
              </FormGroup>
              <FormGroup>
                <Label>Notizen</Label>
                <TextArea value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
              </FormGroup>
            </div>

            {/* RIGHT: Email Log + Actions */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <Label>Status-Übersicht</Label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <Badge $color={statusInfo.color} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>{statusInfo.label}</Badge>
                  {partner.first_contact_date && (
                    <span style={{ fontSize: '0.75rem', color: colors.gray }}>Erstkontakt: {new Date(partner.first_contact_date).toLocaleDateString('de-DE')}</span>
                  )}
                  {partner.last_contact_date && (
                    <span style={{ fontSize: '0.75rem', color: colors.gray }}>Letzter: {new Date(partner.last_contact_date).toLocaleDateString('de-DE')}</span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <Label>E-Mail senden</Label>
                <Button $primary $small style={{ marginTop: '0.5rem' }} onClick={() => onEmail(form)}>
                  ✉️ E-Mail an {form.name}
                </Button>
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
                          <div style={{ color: colors.gray, fontSize: '0.7rem' }}>
                            {log.sent_at ? new Date(log.sent_at).toLocaleString('de-DE') : '–'}
                          </div>
                        </div>
                        <Badge $color={log.status === 'sent' ? colors.green : '#EF4444'}>
                          {log.status === 'sent' ? '✓' : '✗'}
                        </Badge>
                      </EmailLogItem>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button $danger $small onClick={() => onDelete(partner.id)} style={{ marginRight: 'auto' }}>Löschen</Button>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button $primary disabled={saving} onClick={handleSave}>{saving ? 'Speichern...' : 'Speichern'}</Button>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}


// ============================================
// EMAIL COMPOSER MODAL (with editable templates)
// ============================================

function EmailComposerModal({ partner, partners, bulk, onClose, onSent }) {
  const templates = getDefaultTemplates();
  const targetPartners = bulk ? partners : [partner];
  const firstPartner = targetPartners[0];

  const [stage, setStage] = useState('erstansprache');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Load template when stage or partner type changes
  useEffect(() => {
    const type = firstPartner?.type || 'fotograf';
    const tmpl = templates[type]?.[stage];
    if (tmpl) {
      setSubject(tmpl.subject);
      // Replace {name} with actual partner name
      const personalized = tmpl.body.replace(/\{name\}/g, firstPartner?.name || '[Name]');
      setBody(personalized);
    }
  }, [stage, firstPartner?.type, firstPartner?.name]);

  // Preview: replace {name} in current body for display
  const previewHTML = useMemo(() => {
    return wrapInEmailHTML(body, firstPartner?.name);
  }, [body, firstPartner?.name]);

  async function handleSend() {
    if (!subject || !body) { toast.error('Betreff und Text sind Pflicht'); return; }
    setSending(true);

    let successCount = 0;
    let errorCount = 0;

    for (const p of targetPartners) {
      try {
        // Personalize body for each partner
        const personalizedBody = body.replace(/\{name\}/g, p.name || '[Name]');
        const html = wrapInEmailHTML(personalizedBody, p.name);

        // Send via existing API
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: p.email,
            toName: p.name,
            subject: subject,
            htmlContent: html,
          }),
        });

        const result = await response.json();

        // Log to email_logs
        await supabase.from('email_logs').insert([{
          partner_id: p.id,
          recipient_email: p.email,
          recipient_name: p.name,
          subject: subject,
          template_type: `partner_${stage}`,
          status: response.ok ? 'sent' : 'failed',
          error_message: response.ok ? null : (result.error || 'Unknown'),
          brevo_message_id: result.messageId || null,
          sent_at: response.ok ? new Date().toISOString() : null,
        }]);

        // Update partner status + dates
        if (response.ok) {
          successCount++;
          const now = new Date().toISOString();
          const followupDays = FOLLOWUP_DAYS[stage] || 0;
          const nextFollowup = followupDays > 0
            ? new Date(Date.now() + followupDays * 24 * 60 * 60 * 1000).toISOString()
            : null;

          const updates = {
            status: STATUS_AFTER_EMAIL[stage] || p.status,
            last_contact_date: now,
          };
          if (!p.first_contact_date) updates.first_contact_date = now;
          if (nextFollowup) updates.next_followup_date = nextFollowup;
          else if (stage === 'abschluss') updates.next_followup_date = null;

          await supabase.from('partners').update(updates).eq('id', p.id);
        } else {
          errorCount++;
        }

        // Small delay between bulk emails
        if (bulk && targetPartners.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error(`Error sending to ${p.email}:`, err);
        errorCount++;
      }
    }

    setSending(false);
    setSent(true);

    if (errorCount === 0) {
      toast.success(`${successCount} E-Mail(s) gesendet!`);
    } else {
      toast.error(`${successCount} gesendet, ${errorCount} fehlgeschlagen`);
    }

    setTimeout(() => onSent(), 1500);
  }

  return (
    <Overlay onClick={onClose}>
      <Modal $wide onClick={e => e.stopPropagation()}>
        <ModalHeader>
          ✉️ E-Mail Composer {bulk ? `· ${targetPartners.length} Empfänger` : `· ${firstPartner?.name}`}
          <CloseBtn onClick={onClose}>×</CloseBtn>
        </ModalHeader>
        <ModalBody>
          {/* Recipients Info */}
          <div style={{ background: '#F8FAFC', border: `1px solid ${colors.lightGray}`, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <strong>An:</strong>{' '}
            {bulk
              ? targetPartners.map(p => `${p.name} <${p.email}>`).join(', ')
              : `${firstPartner?.name} <${firstPartner?.email}>`
            }
          </div>

          {/* Stage Selector */}
          <Label>Mail-Stufe wählen</Label>
          <StageSelector>
            {EMAIL_STAGES.map(s => (
              <StageBtn key={s.id} $active={stage === s.id} onClick={() => setStage(s.id)}>
                {s.icon} {s.label} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(Tag {s.day})</span>
              </StageBtn>
            ))}
          </StageSelector>

          {/* Subject */}
          <FormGroup>
            <Label>Betreff (editierbar)</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} />
          </FormGroup>

          {/* Composer + Preview side by side */}
          <ComposerLayout>
            <div>
              <Label>Text (editierbar) · <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>Verwende <code style={{ background: '#F3F4F6', padding: '0 4px' }}>{'{name}'}</code> als Platzhalter</span></Label>
              <TextArea $tall value={body} onChange={e => setBody(e.target.value)} />
            </div>
            <div>
              <Label>Vorschau</Label>
              <PreviewFrame>
                <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
              </PreviewFrame>
            </div>
          </ComposerLayout>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button $primary disabled={sending || sent} onClick={handleSend}>
            {sent ? '✓ Gesendet!' : sending ? `Sende... (${targetPartners.length})` : `✉️ Jetzt senden (${targetPartners.length})`}
          </Button>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}
