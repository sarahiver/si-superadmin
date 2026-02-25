// src/pages/PartnerCodesPage.js
// Partner-Tracking-System: Codes verwalten, Visits + Leads + Conversions sehen
// NICHT zu verwechseln mit PartnersPage.js (= Kooperations-CRM)
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import {
  getPartnerCodes, createPartnerCode, updatePartnerCode, deletePartnerCode,
  getPartnerVisits, getPartnerLeads, getPartnerPayouts,
} from '../lib/supabase';
import { generatePayoutPdf } from '../lib/generatePayoutPdf';

// ============================================
// STYLED COMPONENTS
// ============================================
const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666', lightGray: '#E5E5E5', bg: '#F5F5F5', green: '#059669', blue: '#2563EB', orange: '#D97706' };

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
  h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 2rem; font-weight: 400; }
`;

const AddBtn = styled.button`
  background: ${colors.black}; color: ${colors.white}; border: none; padding: 0.75rem 1.5rem;
  font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em;
  text-transform: uppercase; cursor: pointer; transition: background 0.2s;
  &:hover { background: #333; }
`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #fff; border: 1px solid ${colors.lightGray}; padding: 1.5rem;
  .label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.5rem; }
  .value { font-family: 'Instrument Serif', Georgia, serif; font-size: 2rem; font-weight: 400; color: ${colors.black}; }
  .sub { font-size: 0.75rem; color: ${colors.gray}; margin-top: 0.25rem; }
`;

const Table = styled.div`background: #fff; border: 1px solid ${colors.lightGray};`;
const THead = styled.div`
  display: grid; grid-template-columns: 1.5fr 1fr 1fr 80px 80px 80px 100px 60px;
  gap: 0.5rem; padding: 0.75rem 1.25rem; background: #FAFAFA; border-bottom: 1px solid ${colors.lightGray};
  font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray};
  @media (max-width: 900px) { display: none; }
`;
const TRow = styled.div`
  display: grid; grid-template-columns: 1.5fr 1fr 1fr 80px 80px 80px 100px 60px;
  gap: 0.5rem; padding: 0.875rem 1.25rem; border-bottom: 1px solid #f0f0f0; align-items: center;
  font-size: 0.85rem; transition: background 0.1s;
  &:hover { background: #FAFAFA; }
  @media (max-width: 900px) {
    grid-template-columns: 1fr; gap: 0.25rem; padding: 1rem;
  }
`;

const Badge = styled.span`
  display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.7rem; font-weight: 600;
  border-radius: 2px; background: ${p => p.$active ? '#D1FAE5' : '#FEE2E2'}; color: ${p => p.$active ? '#065F46' : '#991B1B'};
`;

const Mono = styled.span`font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: ${colors.black};`;

const SmallBtn = styled.button`
  background: none; border: 1px solid ${colors.lightGray}; padding: 0.3rem 0.6rem; font-size: 0.7rem;
  cursor: pointer; transition: all 0.15s; margin-right: 0.25rem;
  &:hover { border-color: ${colors.black}; }
`;

const DeleteBtn = styled(SmallBtn)`color: ${colors.red}; &:hover { border-color: ${colors.red}; }`;

// ── Modal ──
const Overlay = styled.div`position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center;`;
const Modal = styled.div`background: #fff; width: 90vw; max-width: 550px; max-height: 85vh; overflow-y: auto;`;
const ModalHeader = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid ${colors.lightGray}; font-weight: 600; font-size: 1rem;`;
const ModalBody = styled.div`padding: 1.5rem;`;
const ModalFooter = styled.div`display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid ${colors.lightGray};`;
const CloseBtn = styled.button`background: none; border: none; font-size: 1.5rem; cursor: pointer; color: ${colors.gray};`;
const FormGroup = styled.div`margin-bottom: 1rem;`;
const Label = styled.label`display: block; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.35rem;`;
const Input = styled.input`width: 100%; padding: 0.65rem 0.75rem; border: 1px solid ${colors.lightGray}; font-size: 0.9rem; &:focus { outline: none; border-color: ${colors.black}; }`;
const Select = styled.select`width: 100%; padding: 0.65rem 0.75rem; border: 1px solid ${colors.lightGray}; font-size: 0.9rem; &:focus { outline: none; border-color: ${colors.black}; }`;
const FormRow = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; @media (max-width: 500px) { grid-template-columns: 1fr; }`;

const CopyBtn = styled.button`
  background: ${colors.black}; color: ${colors.white}; border: none; padding: 0.3rem 0.6rem;
  font-size: 0.65rem; font-weight: 600; cursor: pointer; margin-left: 0.5rem;
  &:hover { background: #333; }
`;

const EmptyState = styled.div`padding: 4rem 2rem; text-align: center; color: ${colors.gray};
  h3 { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.4rem; font-weight: 400; margin-bottom: 0.5rem; color: ${colors.black}; }
  p { font-size: 0.9rem; margin-bottom: 1.5rem; }
`;

// ============================================
// COMPONENT
// ============================================
export default function PartnerCodesPage() {
  const [codes, setCodes] = useState([]);
  const [visits, setVisits] = useState([]);
  const [leads, setLeads] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [codesRes, visitsRes, leadsRes, payoutsRes] = await Promise.all([
      getPartnerCodes(),
      getPartnerVisits(),
      getPartnerLeads(),
      getPartnerPayouts(),
    ]);
    if (codesRes.data) setCodes(codesRes.data);
    if (visitsRes.data) setVisits(visitsRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);
    if (payoutsRes.data) setPayouts(payoutsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const totalVisits = visits.length;
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(1) : '0';

  function getVisitsForCode(codeId) {
    return visits.filter(v => v.partner_code_id === codeId).length;
  }

  function getLeadsForCode(codeId) {
    return leads.filter(l => l.partner_code_id === codeId).length;
  }

  function getConversionsForCode(codeId) {
    return leads.filter(l => l.partner_code_id === codeId && l.status === 'converted').length;
  }

  async function handleDelete(code) {
    if (!window.confirm(`"${code.partner_name}" wirklich löschen? Visits/Leads bleiben erhalten.`)) return;
    const { error } = await deletePartnerCode(code.id);
    if (error) { toast.error('Fehler: ' + error.message); return; }
    toast.success('Partner-Code gelöscht');
    load();
  }

  function copyUrl(refSlug) {
    const url = `https://sarahiver.com/?ref=${refSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL kopiert!');
  }

  return (
    <Layout>
      <Header>
        <h1>Partner-Tracking</h1>
        <AddBtn onClick={() => { setEditingCode(null); setShowModal(true); }}>+ Partner-Code</AddBtn>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="label">Partner-Codes</div>
          <div className="value">{codes.filter(c => c.is_active).length}</div>
          <div className="sub">{codes.length} gesamt</div>
        </StatCard>
        <StatCard>
          <div className="label">Visits (gesamt)</div>
          <div className="value">{totalVisits}</div>
          <div className="sub">über Partner-URLs</div>
        </StatCard>
        <StatCard>
          <div className="label">Leads</div>
          <div className="value">{totalLeads}</div>
          <div className="sub">{conversionRate}% Visit→Lead</div>
        </StatCard>
        <StatCard>
          <div className="label">Conversions</div>
          <div className="value">{convertedLeads}</div>
          <div className="sub">gebuchte Projekte</div>
        </StatCard>
        <StatCard>
          <div className="label">Provisionen offen</div>
          <div className="value" style={{ color: colors.orange }}>
            {payouts.filter(p => p.status === 'offen').reduce((sum, p) => sum + Number(p.payout_amount || 0), 0).toFixed(2).replace('.', ',')} €
          </div>
          <div className="sub">{payouts.filter(p => p.status === 'offen').length} Abrechnungen</div>
        </StatCard>
        <StatCard>
          <div className="label">Provisionen ausgezahlt</div>
          <div className="value" style={{ color: colors.green }}>
            {payouts.filter(p => p.status === 'ausgezahlt').reduce((sum, p) => sum + Number(p.payout_amount || 0), 0).toFixed(2).replace('.', ',')} €
          </div>
          <div className="sub">{payouts.filter(p => p.status === 'ausgezahlt').length} Abrechnungen</div>
        </StatCard>
      </StatsGrid>

      {loading ? (
        <EmptyState><p>Laden...</p></EmptyState>
      ) : codes.length === 0 ? (
        <EmptyState>
          <h3>Noch keine Partner-Codes</h3>
          <p>Erstelle den ersten Partner-Code, um Visits und Leads zu tracken.</p>
          <AddBtn onClick={() => setShowModal(true)}>+ Ersten Partner-Code anlegen</AddBtn>
        </EmptyState>
      ) : (
        <Table>
          <THead>
            <span>Partner</span>
            <span>Code / Slug</span>
            <span>Rabatt</span>
            <span>Visits</span>
            <span>Leads</span>
            <span>Conv.</span>
            <span>Status</span>
            <span></span>
          </THead>
          {codes.map(code => (
            <TRow key={code.id}>
              <div>
                <strong>{code.partner_name}</strong>
                {code.partner_email && <div style={{ fontSize: '0.75rem', color: colors.gray }}>{code.partner_email}</div>}
              </div>
              <div>
                <Mono>{code.code}</Mono>
                <CopyBtn onClick={() => copyUrl(code.ref_slug)} title="Partner-URL kopieren">📋 URL</CopyBtn>
              </div>
              <div>
                {code.discount_amount > 0 && `${code.discount_amount}€`}
                {code.discount_amount > 0 && code.discount_percent > 0 && ' / '}
                {code.discount_percent > 0 && `${code.discount_percent}%`}
                {code.commission_percent > 0 && <div style={{ fontSize: '0.7rem', color: colors.gray }}>{code.commission_percent}% Provision</div>}
              </div>
              <div style={{ fontWeight: 600 }}>{code.total_visits || getVisitsForCode(code.id)}</div>
              <div style={{ fontWeight: 600, color: (code.total_leads || getLeadsForCode(code.id)) > 0 ? colors.blue : 'inherit' }}>{code.total_leads || getLeadsForCode(code.id)}</div>
              <div style={{ fontWeight: 600, color: (code.total_conversions || getConversionsForCode(code.id)) > 0 ? colors.green : 'inherit' }}>{code.total_conversions || getConversionsForCode(code.id)}</div>
              <div><Badge $active={code.is_active}>{code.is_active ? 'Aktiv' : 'Inaktiv'}</Badge></div>
              <div>
                <SmallBtn onClick={() => { setEditingCode(code); setShowModal(true); }} title="Bearbeiten">✏️</SmallBtn>
                <DeleteBtn onClick={() => handleDelete(code)} title="Löschen">🗑</DeleteBtn>
              </div>
            </TRow>
          ))}
        </Table>
      )}

      {/* Recent Leads */}
      {leads.length > 0 && (
        <>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: '1.4rem', margin: '2.5rem 0 1rem' }}>
            Letzte Partner-Leads
          </h2>
          <Table>
            <THead style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 100px' }}>
              <span>Name</span>
              <span>E-Mail</span>
              <span>Gutscheincode</span>
              <span>Datum</span>
              <span>Status</span>
            </THead>
            {leads.slice(0, 20).map(lead => (
              <TRow key={lead.id} style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 100px' }}>
                <div><strong>{lead.name}</strong></div>
                <div style={{ fontSize: '0.8rem', color: colors.gray }}>{lead.email}</div>
                <div><Mono>{lead.coupon_code || lead.partner_codes?.code || '–'}</Mono></div>
                <div style={{ fontSize: '0.8rem', color: colors.gray }}>
                  {new Date(lead.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </div>
                <div>
                  <Badge $active={lead.status === 'converted'}>
                    {lead.status === 'new' ? 'Neu' : lead.status === 'contacted' ? 'Kontaktiert' : lead.status === 'converted' ? 'Gebucht' : lead.status}
                  </Badge>
                </div>
              </TRow>
            ))}
          </Table>
        </>
      )}

      {showModal && (
        <PartnerCodeModal
          code={editingCode}
          onClose={() => { setShowModal(false); setEditingCode(null); }}
          onSaved={() => { setShowModal(false); setEditingCode(null); load(); }}
        />
      )}

      {/* Provisionsabrechnungen */}
      {payouts.length > 0 && (
        <>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, fontSize: '1.4rem', margin: '2.5rem 0 1rem' }}>
            Provisionsabrechnungen
          </h2>
          <Table>
            <THead style={{ gridTemplateColumns: '1fr 1.2fr 1fr 100px 100px 80px' }}>
              <span>Nr.</span>
              <span>Partner</span>
              <span>Paar</span>
              <span>Betrag</span>
              <span>Status</span>
              <span>PDF</span>
            </THead>
            {payouts.map(p => (
              <TRow key={p.id} style={{ gridTemplateColumns: '1fr 1.2fr 1fr 100px 100px 80px' }}>
                <div><Mono>{p.invoice_number}</Mono></div>
                <div><strong>{p.partner_name}</strong></div>
                <div style={{ fontSize: '0.8rem', color: colors.gray }}>{p.couple_names || '–'}</div>
                <div><strong style={{ color: colors.green }}>{Number(p.payout_amount).toFixed(2).replace('.', ',')} €</strong></div>
                <div>
                  <Badge $active={p.status === 'ausgezahlt'}>
                    {p.status === 'offen' ? '⏳ Offen' : p.status === 'ausgezahlt' ? '✓ Bezahlt' : p.status}
                  </Badge>
                </div>
                <div>
                  <SmallBtn onClick={() => {
                    generatePayoutPdf(p, { download: true, filename: `${p.invoice_number}.pdf` });
                    toast.success('PDF heruntergeladen');
                  }} title="PDF herunterladen">📃</SmallBtn>
                </div>
              </TRow>
            ))}
          </Table>
        </>
      )}
    </Layout>
  );
}

// ============================================
// ADD/EDIT MODAL
// ============================================
function PartnerCodeModal({ code, onClose, onSaved }) {
  const isEdit = !!code;
  const [form, setForm] = useState({
    partner_name: code?.partner_name || '',
    partner_email: code?.partner_email || '',
    partner_phone: code?.partner_phone || '',
    partner_website: code?.partner_website || '',
    partner_company: code?.partner_company || '',
    partner_iban: code?.partner_iban || '',
    partner_bic: code?.partner_bic || '',
    partner_tax_id: code?.partner_tax_id || '',
    ref_slug: code?.ref_slug || '',
    code: code?.code || '',
    discount_amount: code?.discount_amount || 150,
    discount_percent: code?.discount_percent || 0,
    commission_percent: code?.commission_percent || 15,
    is_active: code?.is_active ?? true,
    notes: code?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Auto-generate slug from partner name
  useEffect(() => {
    if (!isEdit && form.partner_name && !form.ref_slug) {
      const slug = form.partner_name
        .toLowerCase()
        .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      set('ref_slug', slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.partner_name]);

  // Auto-generate coupon code
  useEffect(() => {
    if (!isEdit && form.ref_slug && !form.code) {
      const prefix = form.ref_slug.replace(/-/g, '').substring(0, 8).toUpperCase();
      set('code', `${prefix}${form.discount_amount}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ref_slug, form.discount_amount]);

  async function handleSave() {
    if (!form.partner_name) { toast.error('Partnername ist Pflicht'); return; }
    if (!form.ref_slug) { toast.error('Slug ist Pflicht'); return; }
    if (!form.code) { toast.error('Gutscheincode ist Pflicht'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await updatePartnerCode(code.id, form);
        if (error) throw new Error(error.message);
        toast.success('Partner-Code aktualisiert');
      } else {
        const { error } = await createPartnerCode(form);
        if (error) throw new Error(error.message);
        toast.success('Partner-Code erstellt');
      }
      onSaved();
    } catch (err) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalHeader>
          {isEdit ? 'Partner-Code bearbeiten' : 'Neuer Partner-Code'}
          <CloseBtn onClick={onClose}>×</CloseBtn>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Partnername *</Label>
            <Input value={form.partner_name} onChange={e => set('partner_name', e.target.value)} placeholder="z.B. Hochzeitsplaza" />
          </FormGroup>

          <FormGroup>
            <Label>E-Mail (für Benachrichtigungen)</Label>
            <Input type="email" value={form.partner_email} onChange={e => set('partner_email', e.target.value)} placeholder="kontakt@partner.de" />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>URL-Slug *</Label>
              <Input value={form.ref_slug} onChange={e => set('ref_slug', e.target.value)} placeholder="hochzeitsplaza" />
              <div style={{ fontSize: '0.7rem', color: colors.gray, marginTop: '0.25rem' }}>
                → sarahiver.com/?ref={form.ref_slug || '...'}
              </div>
            </FormGroup>
            <FormGroup>
              <Label>Gutscheincode *</Label>
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="PLAZA150" />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>Rabatt für Paare (€)</Label>
              <Input type="number" value={form.discount_amount} onChange={e => set('discount_amount', Number(e.target.value))} />
            </FormGroup>
            <FormGroup>
              <Label>Rabatt (%)</Label>
              <Input type="number" value={form.discount_percent} onChange={e => set('discount_percent', Number(e.target.value))} />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Provision Partner (%)</Label>
            <Input type="number" value={form.commission_percent} onChange={e => set('commission_percent', Number(e.target.value))} />
          </FormGroup>

          <FormGroup>
            <Label>Firma / Unternehmen</Label>
            <Input value={form.partner_company} onChange={e => set('partner_company', e.target.value)} placeholder="z.B. Festtagsdesign GmbH" />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>IBAN (für Provisionszahlung)</Label>
              <Input value={form.partner_iban} onChange={e => set('partner_iban', e.target.value)} placeholder="DE89 3704 0044 0532 0130 00" />
            </FormGroup>
            <FormGroup>
              <Label>BIC</Label>
              <Input value={form.partner_bic} onChange={e => set('partner_bic', e.target.value)} placeholder="COBADEFFXXX" />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Steuernummer / USt-IdNr.</Label>
            <Input value={form.partner_tax_id} onChange={e => set('partner_tax_id', e.target.value)} placeholder="DE123456789" />
          </FormGroup>

          {isEdit && (
            <FormGroup>
              <Label>Status</Label>
              <Select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')}>
                <option value="true">Aktiv</option>
                <option value="false">Inaktiv</option>
              </Select>
            </FormGroup>
          )}
        </ModalBody>
        <ModalFooter>
          <SmallBtn onClick={onClose}>Abbrechen</SmallBtn>
          <AddBtn onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Speichern...' : isEdit ? 'Speichern' : 'Erstellen'}
          </AddBtn>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}
