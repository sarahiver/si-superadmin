// src/pages/ProjectDetailPage.js
// SuperAdmin - Project Detail with Pricing & Contract PDF
// npm install jspdf

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import Layout from '../components/Layout';
import { getProjectById, updateProject, deleteProject } from '../lib/supabase';
import { THEMES, PROJECT_STATUS, ALL_COMPONENTS, DEFAULT_COMPONENT_ORDER, CORE_COMPONENTS, PACKAGES, ADDONS, isFeatureIncluded, getAddonPrice, formatPrice } from '../lib/constants';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

// Styled Components (kompakt)
const Header = styled.div`display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black}; flex-wrap: wrap; gap: 1rem;`;
const HeaderLeft = styled.div``;
const BackLink = styled(Link)`font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; text-decoration: none; display: inline-block; margin-bottom: 0.75rem; &:hover { color: ${colors.black}; }`;
const TitleRow = styled.div`display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;`;
const Title = styled.h1`font-family: 'Oswald', sans-serif; font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 600; text-transform: uppercase; color: ${colors.black}; line-height: 1;`;
const StatusBadge = styled.span`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.35rem 0.75rem; background: ${p => p.$color ? `${p.$color}20` : colors.background}; color: ${p => p.$color || colors.gray}; border: 1px solid ${p => p.$color || colors.lightGray};`;
const Actions = styled.div`display: flex; gap: 0.75rem; flex-wrap: wrap;`;
const Button = styled.button`padding: 0.75rem 1.5rem; font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s ease; ${p => p.$danger && `background: transparent; color: ${colors.red}; border: 2px solid ${colors.red}; &:hover { background: ${colors.red}; color: ${colors.white}; }`} ${p => p.$primary && `background: ${colors.red}; color: ${colors.white}; border: 2px solid ${colors.red}; &:hover:not(:disabled) { background: ${colors.black}; border-color: ${colors.black}; }`} ${p => p.$secondary && `background: ${colors.black}; color: ${colors.white}; border: 2px solid ${colors.black}; &:hover { background: ${colors.gray}; }`} ${p => !p.$danger && !p.$primary && !p.$secondary && `background: transparent; color: ${colors.black}; border: 2px solid ${colors.black}; &:hover { background: ${colors.black}; color: ${colors.white}; }`} &:disabled { opacity: 0.5; cursor: not-allowed; }`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const MainColumn = styled.div``;
const Sidebar = styled.div``;
const Section = styled.section`margin-bottom: 1rem; border: 2px solid ${colors.black};`;
const SectionHeader = styled.div`display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: ${p => p.$isOpen ? colors.black : colors.white}; color: ${p => p.$isOpen ? colors.white : colors.black}; cursor: pointer; user-select: none; transition: all 0.2s ease; &:hover { background: ${p => p.$isOpen ? colors.black : colors.background}; }`;
const SectionNumber = styled.span`font-family: 'Oswald', sans-serif; font-size: 0.875rem; font-weight: 600; color: ${p => p.$isOpen ? colors.white : colors.red}; min-width: 24px;`;
const SectionTitle = styled.h2`font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; flex: 1;`;
const SectionBadge = styled.span`font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; background: ${p => p.$isOpen ? 'rgba(255,255,255,0.1)' : colors.background}; padding: 0.25rem 0.5rem;`;
const CollapseIcon = styled.span`font-size: 1.25rem; transition: transform 0.2s ease; transform: ${p => p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};`;
const SectionBody = styled.div`padding: ${p => p.$isOpen ? '1.5rem' : '0'}; max-height: ${p => p.$isOpen ? '3000px' : '0'}; overflow: hidden; transition: all 0.3s ease; border-top: ${p => p.$isOpen ? `1px solid ${colors.lightGray}` : 'none'};`;
const FormGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const FormGroup = styled.div`&.full-width { grid-column: 1 / -1; }`;
const Label = styled.label`display: block; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.5rem;`;
const Input = styled.input`width: 100%; padding: 0.875rem 1rem; background: ${colors.white}; border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.95rem; color: ${colors.black}; &:focus { outline: none; border-color: ${colors.black}; }`;
const TextArea = styled.textarea`width: 100%; padding: 0.875rem 1rem; background: ${colors.white}; border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.95rem; color: ${colors.black}; resize: vertical; min-height: 100px; &:focus { outline: none; border-color: ${colors.black}; }`;
const Select = styled.select`width: 100%; padding: 0.875rem 1rem; background: ${colors.white}; border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.95rem; cursor: pointer; &:focus { outline: none; border-color: ${colors.black}; }`;
const LinkBox = styled.div`background: ${colors.black}; padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; &:last-child { margin-bottom: 0; } a { font-family: monospace; font-size: 0.85rem; color: ${colors.white}; text-decoration: none; &:hover { text-decoration: underline; } } button { background: ${colors.red}; border: none; color: ${colors.white}; padding: 0.4rem 0.75rem; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; cursor: pointer; &:hover { background: ${colors.white}; color: ${colors.black}; } }`;
const PackageSelector = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; @media (max-width: 800px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 500px) { grid-template-columns: 1fr; }`;
const PackageCard = styled.div`border: 2px solid ${p => p.$selected ? colors.red : colors.lightGray}; background: ${p => p.$selected ? `${colors.red}10` : colors.white}; padding: 1.25rem; cursor: pointer; transition: all 0.2s ease; &:hover { border-color: ${p => p.$selected ? colors.red : colors.black}; } .name { font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem; } .price { font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 700; color: ${colors.red}; } .price-note { font-size: 0.7rem; color: ${colors.gray}; }`;
const FeatureList = styled.div`background: ${colors.background}; padding: 1rem; margin-bottom: 1.5rem; .title { font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; } ul { list-style: none; padding: 0; margin: 0; } li { font-size: 0.85rem; padding: 0.35rem 0; display: flex; align-items: center; gap: 0.5rem; &::before { content: '✓'; color: ${colors.green}; font-weight: 700; } }`;
const AddonsSection = styled.div`margin-bottom: 1.5rem; .title { font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }`;
const AddonItem = styled.div`display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: ${p => p.$included ? `${colors.green}15` : p.$selected ? `${colors.red}10` : colors.white}; border: 1px solid ${p => p.$included ? colors.green : p.$selected ? colors.red : colors.lightGray}; margin-bottom: 0.5rem; cursor: ${p => p.$included ? 'default' : 'pointer'}; .checkbox { width: 20px; height: 20px; border: 2px solid ${p => p.$included ? colors.green : p.$selected ? colors.red : colors.black}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; background: ${p => (p.$included || p.$selected) ? (p.$included ? colors.green : colors.red) : 'transparent'}; color: white; } .info { flex: 1; } .name { font-size: 0.9rem; font-weight: 500; } .description { font-size: 0.75rem; color: ${colors.gray}; } .price { font-size: 0.85rem; font-weight: 600; } .included-badge { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: ${colors.green}; background: ${colors.green}20; padding: 0.2rem 0.5rem; }`;
const ExtraComponentsRow = styled.div`display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: ${colors.white}; border: 1px solid ${colors.lightGray}; margin-bottom: 0.5rem; .info { flex: 1; } .name { font-size: 0.9rem; font-weight: 500; } .description { font-size: 0.75rem; color: ${colors.gray}; } .counter { display: flex; align-items: center; gap: 0.5rem; button { width: 28px; height: 28px; border: 2px solid ${colors.black}; background: transparent; font-size: 1rem; font-weight: 700; cursor: pointer; &:hover { background: ${colors.black}; color: white; } &:disabled { opacity: 0.3; } } span { font-size: 1rem; font-weight: 600; min-width: 24px; text-align: center; } } .price { font-size: 0.85rem; font-weight: 600; min-width: 60px; text-align: right; }`;
const PriceSummary = styled.div`background: ${colors.black}; color: white; padding: 1.25rem; .row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem; &.total { border-top: 1px solid ${colors.gray}; padding-top: 0.75rem; margin-top: 0.75rem; font-size: 1.1rem; font-weight: 700; } &.discount { color: ${colors.green}; } } .label { color: ${colors.lightGray}; } .total .label { color: white; }`;
const SettingsGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid ${colors.lightGray}; @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const ComponentListContainer = styled.div`border: 2px solid ${colors.lightGray};`;
const ComponentListHeader = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: ${colors.background}; .count { font-family: 'Oswald', sans-serif; font-size: 0.9rem; } .hint { font-size: 0.7rem; color: ${colors.gray}; }`;
const ComponentWarning = styled.div`background: ${colors.orange}20; border: 1px solid ${colors.orange}; color: ${colors.orange}; padding: 0.75rem 1rem; font-size: 0.8rem; strong { font-weight: 600; }`;
const ComponentItem = styled.div`display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem; background: ${p => p.$active ? colors.black : colors.white}; color: ${p => p.$active ? colors.white : colors.black}; border-bottom: 1px solid ${colors.lightGray}; cursor: pointer; transition: all 0.15s ease; &:last-child { border-bottom: none; } &:hover { background: ${p => p.$active ? colors.black : colors.background}; } .drag-handle { color: ${p => p.$active ? colors.gray : colors.lightGray}; cursor: grab; } .checkbox { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid ${p => p.$active ? colors.white : colors.black}; background: ${p => p.$active ? colors.white : 'transparent'}; color: ${colors.black}; font-size: 0.75rem; font-weight: 700; } .name { flex: 1; font-size: 0.9rem; font-weight: 500; } .badge { font-size: 0.6rem; font-weight: 600; text-transform: uppercase; padding: 0.2rem 0.5rem; background: ${p => p.$active ? colors.red : colors.background}; color: ${p => p.$active ? colors.white : colors.gray}; }`;
const InfoCard = styled.div`border: 2px solid ${colors.black}; margin-bottom: 1.5rem;`;
const InfoHeader = styled.div`padding: 0.75rem 1rem; background: ${colors.black}; color: white; font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;`;
const InfoBody = styled.div`padding: 1rem;`;
const InfoRow = styled.div`display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.75rem; &:last-child { margin-bottom: 0; } .label { color: ${colors.gray}; } .value { font-weight: 500; text-align: right; } a { color: ${colors.red}; text-decoration: none; &:hover { text-decoration: underline; } }`;

function CollapsibleSection({ number, title, badge, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Section>
      <SectionHeader $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <SectionNumber $isOpen={isOpen}>{number}</SectionNumber>
        <SectionTitle>{title}</SectionTitle>
        {badge && <SectionBadge $isOpen={isOpen}>{badge}</SectionBadge>}
        <CollapseIcon $isOpen={isOpen}>▼</CollapseIcon>
      </SectionHeader>
      <SectionBody $isOpen={isOpen}>{children}</SectionBody>
    </Section>
  );
}

// PDF Contract Generator
function generateContractPDF(data, pricing) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const m = 20;
  let y = 20;
  const newPage = (n = 30) => { if (y > 270 - n) { doc.addPage(); y = 20; } };

  doc.setFontSize(24); doc.setFont('helvetica', 'bold');
  doc.text('S&I. WEDDING', pw / 2, y, { align: 'center' }); y += 8;
  doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
  doc.text('Wedding Websites', pw / 2, y, { align: 'center' }); y += 15; doc.setTextColor(0);

  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('VERTRAG', pw / 2, y, { align: 'center' }); y += 8;
  const cNum = `IVL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
  doc.text(`Vertragsnummer: ${cNum}`, pw / 2, y, { align: 'center' }); y += 15; doc.setTextColor(0);

  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Vertragsparteien', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('Zwischen', m, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('S&I. wedding - Iver Arntzen | hello@siwedding.de', m, y); y += 5;
  doc.setFont('helvetica', 'italic'); doc.setTextColor(100);
  doc.text('(nachfolgend "Auftragnehmer")', m, y); y += 8; doc.setTextColor(0);
  doc.setFont('helvetica', 'bold'); doc.text('und', m, y); y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(data.client_name || '[KUNDENNAME]', m, y); y += 5;
  doc.text(data.client_address || '[ADRESSE]', m, y); y += 5;
  doc.text(`E-Mail: ${data.client_email || '[EMAIL]'} | Tel: ${data.client_phone || '[TELEFON]'}`, m, y); y += 5;
  doc.setFont('helvetica', 'italic'); doc.setTextColor(100);
  doc.text('(nachfolgend "Auftraggeber")', m, y); y += 12; doc.setTextColor(0);

  newPage();
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Vertragsgegenstand', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  const couple = `${data.partner1_name || 'Partner 1'} & ${data.partner2_name || 'Partner 2'}`;
  const wDate = data.wedding_date ? new Date(data.wedding_date).toLocaleDateString('de-DE') : '[DATUM]';
  const url = data.custom_domain || `siwedding.de/${data.slug || 'website'}`;
  doc.text(`Brautpaar: ${couple}`, m, y); y += 5;
  doc.text(`Hochzeitsdatum: ${wDate}`, m, y); y += 5;
  doc.text(`Website: https://${url}`, m, y); y += 12;

  newPage(60);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Leistungsumfang', m, y); y += 8;
  const pkg = PACKAGES[data.package] || PACKAGES.starter;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(`Paket: ${pkg.name}`, m, y); y += 6;
  doc.setFont('helvetica', 'normal');
  pkg.features.forEach(f => { newPage(6); doc.text(`- ${f}`, m, y); y += 5; });
  if ((data.addons || []).length > 0) {
    y += 2; doc.text('Zusatzoptionen:', m, y); y += 5;
    data.addons.forEach(id => {
      const a = ADDONS[id];
      if (a && !isFeatureIncluded(data.package, id)) {
        const price = getAddonPrice(id, data.package);
        doc.text(`- ${a.name} (+${formatPrice(price)})`, m, y); y += 5;
      }
    });
  }
  y += 8;

  newPage(50);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Verguetung', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  const px = pw - m - 30;
  
  if (data.package === 'individual') {
    doc.text('Individual-Paket', m, y);
    doc.text(formatPrice(pricing.total), px, y, { align: 'right' }); y += 6;
  } else {
    doc.text(`Paket ${pkg.name}`, m, y); doc.text(formatPrice(pricing.packagePrice), px, y, { align: 'right' }); y += 6;
    if (pricing.addonsPrice > 0) { doc.text('Zusatzoptionen', m, y); doc.text(`+${formatPrice(pricing.addonsPrice)}`, px, y, { align: 'right' }); y += 6; }
    if (pricing.extraComponentsPrice > 0) { doc.text('Extra-Komponenten', m, y); doc.text(`+${formatPrice(pricing.extraComponentsPrice)}`, px, y, { align: 'right' }); y += 6; }
    if (pricing.discount > 0) { doc.setTextColor(16, 185, 129); doc.text('Rabatt', m, y); doc.text(`-${formatPrice(pricing.discount)}`, px, y, { align: 'right' }); y += 6; doc.setTextColor(0); }
  }
  doc.line(m, y, pw - m, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('GESAMT (inkl. MwSt.)', m, y); doc.text(formatPrice(pricing.total), px, y, { align: 'right' }); y += 12;

  newPage(35);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Zahlungsbedingungen', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Zahlung in zwei Raten:', m, y); y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`1. Rate (50%): ${formatPrice(pricing.total / 2)} bei Vertragsabschluss`, m, y); y += 5;
  doc.text(`2. Rate (50%): ${formatPrice(pricing.total / 2)} bei Go-Live`, m, y); y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Bank: S&I. wedding | IBAN: DE XX XXXX XXXX XXXX XXXX XX', m, y); y += 12;

  newPage(50);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Zeitplan: Fertigstellung 14 Werktage nach Erhalt aller Inhalte.', m, y); y += 6;
  doc.text('Nutzungsrechte: Fuer Hosting-Zeitraum. Design verbleibt beim Auftragnehmer.', m, y); y += 6;
  doc.text('Stornierung: Bis 30 Tage vor Hochzeit 50%, danach 100%.', m, y); y += 6;
  doc.text('Es gilt deutsches Recht. Gerichtsstand: Hamburg.', m, y); y += 20;

  newPage(35);
  doc.text(`Hamburg, den ${new Date().toLocaleDateString('de-DE')}`, m, y); y += 25;
  doc.line(m, y, m + 60, y); doc.line(pw - m - 60, y, pw - m, y); y += 5;
  doc.setFontSize(8); doc.setTextColor(100);
  doc.text('Auftragnehmer (S&I. wedding)', m, y);
  doc.text('Auftraggeber', pw - m - 60, y);

  const fn = `SIwedding-Vertrag-${data.slug || 'projekt'}-${cNum}.pdf`;
  doc.save(fn);
  return fn;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    const { data } = await getProjectById(id);
    if (data) {
      setProject(data);
      setFormData({
        ...data,
        package: data.package || 'starter',
        addons: data.addons || [],
        extra_components_count: data.extra_components_count || 0,
        discount: data.discount || 0,
        custom_price: data.custom_price || 0,
        component_order: data.component_order || DEFAULT_COMPONENT_ORDER,
        active_components: data.active_components || [...CORE_COMPONENTS],
      });
    }
    setIsLoading(false);
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const selectedPackage = PACKAGES[formData.package] || PACKAGES.starter;
  const isIndividual = formData.package === 'individual';

  const pricing = useMemo(() => {
    const pkg = PACKAGES[formData.package] || PACKAGES.starter;
    
    // Bei Individual: custom_price ist der Gesamtpreis
    if (formData.package === 'individual') {
      return {
        packagePrice: 0,
        addonsPrice: 0,
        extraComponentsPrice: 0,
        discount: 0,
        total: formData.custom_price || 0,
      };
    }
    
    const addons = formData.addons || [];
    const extraCount = formData.extra_components_count || 0;
    const discount = formData.discount || 0;
    let packagePrice = pkg.price;
    let addonsPrice = 0;
    
    addons.forEach(addonId => {
      if (!isFeatureIncluded(formData.package, addonId)) {
        addonsPrice += getAddonPrice(addonId, formData.package);
      }
    });
    
    const extraOverLimit = Math.max(0, extraCount - pkg.extraComponentsIncluded);
    const extraComponentsPrice = extraOverLimit * (ADDONS.extra_component?.price || 50);
    const total = Math.max(0, packagePrice + addonsPrice + extraComponentsPrice - discount);
    
    return { packagePrice, addonsPrice, extraComponentsPrice, discount, total };
  }, [formData.package, formData.addons, formData.extra_components_count, formData.discount, formData.custom_price]);

  const toggleAddon = (addonId) => {
    if (isFeatureIncluded(formData.package, addonId)) return;
    const current = formData.addons || [];
    handleChange('addons', current.includes(addonId) ? current.filter(i => i !== addonId) : [...current, addonId]);
  };

  const canUseStatus = (key) => {
    if (key === 'std') return isFeatureIncluded(formData.package, 'save_the_date') || (formData.addons || []).includes('save_the_date');
    if (key === 'archive') return isFeatureIncluded(formData.package, 'archive') || (formData.addons || []).includes('archive');
    return true;
  };

  const toggleComponent = (compId) => {
    const comp = ALL_COMPONENTS.find(c => c.id === compId);
    if (comp?.core) return;
    const current = formData.active_components || [];
    handleChange('active_components', current.includes(compId) ? current.filter(i => i !== compId) : [...current, compId]);
  };

  const activeExtraCount = useMemo(() => (formData.active_components || []).filter(id => !CORE_COMPONENTS.includes(id)).length, [formData.active_components]);
  const allowedExtraCount = useMemo(() => (PACKAGES[formData.package]?.extraComponentsIncluded || 0) + (formData.extra_components_count || 0), [formData.package, formData.extra_components_count]);
  const isOverLimit = activeExtraCount > allowedExtraCount && allowedExtraCount < 999;

  const handleDragStart = (e, compId) => { setDraggedItem(compId); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, compId) => {
    e.preventDefault();
    if (draggedItem === compId) return;
    const newOrder = [...(formData.component_order || DEFAULT_COMPONENT_ORDER)];
    const di = newOrder.indexOf(draggedItem), ti = newOrder.indexOf(compId);
    newOrder.splice(di, 1); newOrder.splice(ti, 0, draggedItem);
    handleChange('component_order', newOrder);
  };
  const handleDragEnd = () => setDraggedItem(null);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProject(id, {
      client_name: formData.client_name, client_email: formData.client_email, client_phone: formData.client_phone,
      client_address: formData.client_address, client_notes: formData.client_notes,
      partner1_name: formData.partner1_name, partner2_name: formData.partner2_name,
      couple_names: `${formData.partner1_name} & ${formData.partner2_name}`,
      wedding_date: formData.wedding_date, slug: formData.slug, location: formData.location,
      hashtag: formData.hashtag, display_email: formData.display_email, display_phone: formData.display_phone,
      package: formData.package, addons: formData.addons, extra_components_count: formData.extra_components_count,
      discount: formData.discount, custom_price: formData.custom_price, total_price: pricing.total,
      theme: formData.theme, status: formData.status, admin_password: formData.admin_password,
      custom_domain: formData.custom_domain, active_components: formData.active_components,
      component_order: formData.component_order,
    });
    if (error) { toast.error('Fehler'); console.error(error); }
    else { toast.success('Gespeichert!'); setProject(formData); }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Projekt löschen?')) return;
    const { error } = await deleteProject(id);
    if (error) toast.error('Fehler');
    else { toast.success('Gelöscht'); navigate('/projects'); }
  };

  const handleGenerateContract = () => {
    try { const fn = generateContractPDF(formData, pricing); toast.success(`Vertrag: ${fn}`); }
    catch (e) { toast.error('PDF-Fehler'); console.error(e); }
  };

  const copyToClipboard = (t) => { navigator.clipboard.writeText(t); toast.success('Kopiert!'); };

  if (isLoading) return <Layout><div style={{ padding: '2rem' }}>Laden...</div></Layout>;
  if (!project) return <Layout><div style={{ padding: '2rem' }}>Nicht gefunden</div></Layout>;

  const status = PROJECT_STATUS[formData.status];
  const baseUrl = formData.custom_domain || `siwedding.de/${formData.slug}`;
  const coupleNames = formData.partner1_name && formData.partner2_name ? `${formData.partner1_name} & ${formData.partner2_name}` : 'Unbenannt';
  const componentOrder = formData.component_order || DEFAULT_COMPONENT_ORDER;

  return (
    <Layout>
      <Header>
        <HeaderLeft>
          <BackLink to="/projects">← Projekte</BackLink>
          <TitleRow><Title>{coupleNames}</Title><StatusBadge $color={status?.color}>{status?.label}</StatusBadge></TitleRow>
        </HeaderLeft>
        <Actions>
          <Button $secondary onClick={handleGenerateContract}>📄 Vertrag PDF</Button>
          <Button $danger onClick={handleDelete}>Löschen</Button>
          <Button $primary onClick={handleSave} disabled={isSaving}>{isSaving ? '...' : 'Speichern'}</Button>
        </Actions>
      </Header>

      <Grid>
        <MainColumn>
          <CollapsibleSection number="01" title="Kundendaten" badge="Intern" defaultOpen={false}>
            <FormGrid>
              <FormGroup className="full-width"><Label>Kundenname</Label><Input value={formData.client_name || ''} onChange={e => handleChange('client_name', e.target.value)} /></FormGroup>
              <FormGroup><Label>E-Mail</Label><Input type="email" value={formData.client_email || ''} onChange={e => handleChange('client_email', e.target.value)} /></FormGroup>
              <FormGroup><Label>Telefon</Label><Input value={formData.client_phone || ''} onChange={e => handleChange('client_phone', e.target.value)} /></FormGroup>
              <FormGroup className="full-width"><Label>Adresse</Label><Input value={formData.client_address || ''} onChange={e => handleChange('client_address', e.target.value)} /></FormGroup>
              <FormGroup className="full-width"><Label>Notizen</Label><TextArea value={formData.client_notes || ''} onChange={e => handleChange('client_notes', e.target.value)} /></FormGroup>
            </FormGrid>
          </CollapsibleSection>

          <CollapsibleSection number="02" title="Hochzeits-Website" defaultOpen={true}>
            <FormGrid>
              <FormGroup><Label>Partner 1</Label><Input value={formData.partner1_name || ''} onChange={e => handleChange('partner1_name', e.target.value)} /></FormGroup>
              <FormGroup><Label>Partner 2</Label><Input value={formData.partner2_name || ''} onChange={e => handleChange('partner2_name', e.target.value)} /></FormGroup>
              <FormGroup><Label>Datum</Label><Input type="date" value={formData.wedding_date?.split('T')[0] || ''} onChange={e => handleChange('wedding_date', e.target.value)} /></FormGroup>
              <FormGroup><Label>Slug</Label><Input value={formData.slug || ''} onChange={e => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /></FormGroup>
              <FormGroup><Label>Location</Label><Input value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} /></FormGroup>
              <FormGroup><Label>Hashtag</Label><Input value={formData.hashtag || ''} onChange={e => handleChange('hashtag', e.target.value)} /></FormGroup>
              <FormGroup><Label>Kontakt-E-Mail</Label><Input value={formData.display_email || ''} onChange={e => handleChange('display_email', e.target.value)} /></FormGroup>
              <FormGroup><Label>Kontakt-Telefon</Label><Input value={formData.display_phone || ''} onChange={e => handleChange('display_phone', e.target.value)} /></FormGroup>
            </FormGrid>
          </CollapsibleSection>

          <CollapsibleSection number="03" title="Paket & Einstellungen" defaultOpen={true}>
            <Label>Paket</Label>
            <PackageSelector>
              {Object.values(PACKAGES).map(p => (
                <PackageCard key={p.id} $selected={formData.package === p.id} onClick={() => handleChange('package', p.id)}>
                  <div className="name">{p.name}</div>
                  <div className="price">{p.price > 0 ? formatPrice(p.price) : 'Individuell'}</div>
                  <div className="price-note">{p.hosting}</div>
                </PackageCard>
              ))}
            </PackageSelector>
            
            <FeatureList><div className="title">Enthalten</div><ul>{selectedPackage.features.map((f, i) => <li key={i}>{f}</li>)}</ul></FeatureList>
            
            {!isIndividual && (
              <AddonsSection>
                <div className="title">Zusatzoptionen</div>
                <AddonItem $included={isFeatureIncluded(formData.package, 'save_the_date')} $selected={(formData.addons || []).includes('save_the_date')} onClick={() => toggleAddon('save_the_date')}>
                  <div className="checkbox">{(isFeatureIncluded(formData.package, 'save_the_date') || (formData.addons || []).includes('save_the_date')) && '✓'}</div>
                  <div className="info"><div className="name">{ADDONS.save_the_date.name}</div><div className="description">{ADDONS.save_the_date.description}</div></div>
                  {isFeatureIncluded(formData.package, 'save_the_date') ? <span className="included-badge">Im Paket</span> : <div className="price">+{formatPrice(getAddonPrice('save_the_date', formData.package))}</div>}
                </AddonItem>
                <AddonItem $included={isFeatureIncluded(formData.package, 'archive')} $selected={(formData.addons || []).includes('archive')} onClick={() => toggleAddon('archive')}>
                  <div className="checkbox">{(isFeatureIncluded(formData.package, 'archive') || (formData.addons || []).includes('archive')) && '✓'}</div>
                  <div className="info"><div className="name">{ADDONS.archive.name}</div><div className="description">{ADDONS.archive.description}</div></div>
                  {isFeatureIncluded(formData.package, 'archive') ? <span className="included-badge">Im Paket</span> : <div className="price">+{formatPrice(getAddonPrice('archive', formData.package))}</div>}
                </AddonItem>
                <AddonItem $included={isFeatureIncluded(formData.package, 'qr_code')} $selected={(formData.addons || []).includes('qr_code')} onClick={() => toggleAddon('qr_code')}>
                  <div className="checkbox">{(isFeatureIncluded(formData.package, 'qr_code') || (formData.addons || []).includes('qr_code')) && '✓'}</div>
                  <div className="info"><div className="name">{ADDONS.qr_code.name}</div><div className="description">{ADDONS.qr_code.description}</div></div>
                  {isFeatureIncluded(formData.package, 'qr_code') ? <span className="included-badge">Im Paket</span> : <div className="price">+{formatPrice(getAddonPrice('qr_code', formData.package))}</div>}
                </AddonItem>
                <AddonItem $selected={(formData.addons || []).includes('invitation_design')} onClick={() => toggleAddon('invitation_design')}>
                  <div className="checkbox">{(formData.addons || []).includes('invitation_design') && '✓'}</div>
                  <div className="info"><div className="name">{ADDONS.invitation_design.name}</div><div className="description">{ADDONS.invitation_design.description}</div></div>
                  <div className="price">+{formatPrice(getAddonPrice('invitation_design', formData.package))}</div>
                </AddonItem>
                
                {selectedPackage.extraComponentsIncluded < 999 && (
                  <ExtraComponentsRow>
                    <div className="info"><div className="name">Extra Komponenten</div><div className="description">{selectedPackage.extraComponentsIncluded} inkl., weitere je {formatPrice(50)}</div></div>
                    <div className="counter">
                      <button onClick={() => handleChange('extra_components_count', Math.max(0, (formData.extra_components_count || 0) - 1))} disabled={!formData.extra_components_count}>−</button>
                      <span>{formData.extra_components_count || 0}</span>
                      <button onClick={() => handleChange('extra_components_count', (formData.extra_components_count || 0) + 1)}>+</button>
                    </div>
                    <div className="price">+{formatPrice(Math.max(0, (formData.extra_components_count || 0) - selectedPackage.extraComponentsIncluded) * 50)}</div>
                  </ExtraComponentsRow>
                )}
                
                <ExtraComponentsRow>
                  <div className="info"><div className="name">Rabatt</div></div>
                  <Input type="number" value={formData.discount || 0} onChange={e => handleChange('discount', parseFloat(e.target.value) || 0)} style={{ width: '120px', textAlign: 'right' }} />
                </ExtraComponentsRow>
              </AddonsSection>
            )}
            
            {isIndividual && (
              <AddonsSection>
                <div className="title">Individueller Preis</div>
                <ExtraComponentsRow>
                  <div className="info"><div className="name">Gesamtpreis</div><div className="description">Dieser Preis wird im Vertrag verwendet</div></div>
                  <Input type="number" value={formData.custom_price || 0} onChange={e => handleChange('custom_price', parseFloat(e.target.value) || 0)} style={{ width: '150px', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }} />
                </ExtraComponentsRow>
              </AddonsSection>
            )}
            
            <PriceSummary>
              {!isIndividual && <>
                <div className="row"><span className="label">Paket ({selectedPackage.name})</span><span>{formatPrice(pricing.packagePrice)}</span></div>
                {pricing.addonsPrice > 0 && <div className="row"><span className="label">Zusatzoptionen</span><span>+{formatPrice(pricing.addonsPrice)}</span></div>}
                {pricing.extraComponentsPrice > 0 && <div className="row"><span className="label">Extra Komponenten</span><span>+{formatPrice(pricing.extraComponentsPrice)}</span></div>}
                {pricing.discount > 0 && <div className="row discount"><span className="label">Rabatt</span><span>-{formatPrice(pricing.discount)}</span></div>}
              </>}
              {isIndividual && <div className="row"><span className="label">Individual-Paket</span><span>{formatPrice(pricing.total)}</span></div>}
              <div className="row total"><span className="label">Gesamt</span><span>{formatPrice(pricing.total)}</span></div>
            </PriceSummary>
            
            <SettingsGrid>
              <FormGroup><Label>Theme</Label><Select value={formData.theme || 'botanical'} onChange={e => handleChange('theme', e.target.value)}>{Object.values(THEMES).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></FormGroup>
              <FormGroup><Label>Status</Label><Select value={formData.status || 'draft'} onChange={e => handleChange('status', e.target.value)}>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k} disabled={!canUseStatus(k)}>{v.label}{!canUseStatus(k) && ' (nicht gebucht)'}</option>)}</Select></FormGroup>
              <FormGroup><Label>Admin Passwort</Label><Input value={formData.admin_password || ''} onChange={e => handleChange('admin_password', e.target.value)} /></FormGroup>
              <FormGroup><Label>Custom Domain</Label><Input value={formData.custom_domain || ''} onChange={e => handleChange('custom_domain', e.target.value.toLowerCase())} placeholder="anna-max.de" /></FormGroup>
            </SettingsGrid>
          </CollapsibleSection>

          <CollapsibleSection number="04" title="Links" defaultOpen={true}>
            <LinkBox><a href={`https://${baseUrl}`} target="_blank" rel="noopener noreferrer">{baseUrl}</a><button onClick={() => copyToClipboard(`https://${baseUrl}`)}>Copy</button></LinkBox>
            <LinkBox><a href={`https://${baseUrl}/admin`} target="_blank" rel="noopener noreferrer">{baseUrl}/admin</a><button onClick={() => copyToClipboard(`https://${baseUrl}/admin`)}>Copy</button></LinkBox>
          </CollapsibleSection>

          <CollapsibleSection number="05" title="Komponenten" defaultOpen={false}>
            {isOverLimit && <ComponentWarning>⚠️ <strong>{activeExtraCount}</strong> Extra aktiv, nur <strong>{allowedExtraCount}</strong> gebucht!</ComponentWarning>}
            <ComponentListContainer>
              <ComponentListHeader>
                <span className="count">{(formData.active_components || []).length} aktiv</span>
                <span className="hint">Drag to reorder</span>
              </ComponentListHeader>
              {componentOrder.map(compId => {
                const comp = ALL_COMPONENTS.find(c => c.id === compId);
                if (!comp) return null;
                const isActive = (formData.active_components || []).includes(compId);
                return (
                  <ComponentItem key={compId} $active={isActive} $core={comp.core} draggable
                    onDragStart={e => handleDragStart(e, compId)} onDragOver={e => handleDragOver(e, compId)}
                    onDragEnd={handleDragEnd} onClick={() => toggleComponent(compId)}>
                    <span className="drag-handle">☰</span>
                    <span className="checkbox">{isActive && '✓'}</span>
                    <span className="name">{comp.name}</span>
                    {comp.core && <span className="badge">Basis</span>}
                  </ComponentItem>
                );
              })}
            </ComponentListContainer>
          </CollapsibleSection>
        </MainColumn>

        <Sidebar>
          <InfoCard>
            <InfoHeader>Projekt-Info</InfoHeader>
            <InfoBody>
              <InfoRow><span className="label">Erstellt</span><span className="value">{project.created_at ? new Date(project.created_at).toLocaleDateString('de-DE') : '-'}</span></InfoRow>
              <InfoRow><span className="label">Paket</span><span className="value">{PACKAGES[formData.package]?.name}</span></InfoRow>
              <InfoRow><span className="label">Theme</span><span className="value">{THEMES[formData.theme]?.name}</span></InfoRow>
              <InfoRow><span className="label">Hochzeit</span><span className="value">{formData.wedding_date ? new Date(formData.wedding_date).toLocaleDateString('de-DE') : '-'}</span></InfoRow>
              <InfoRow><span className="label">Gesamt</span><span className="value" style={{ color: colors.red, fontWeight: 700 }}>{formatPrice(pricing.total)}</span></InfoRow>
            </InfoBody>
          </InfoCard>
          {formData.client_email && <InfoCard>
            <InfoHeader>Kontakt</InfoHeader>
            <InfoBody>
              <InfoRow><span className="label">E-Mail</span><span className="value"><a href={`mailto:${formData.client_email}`}>{formData.client_email}</a></span></InfoRow>
              {formData.client_phone && <InfoRow><span className="label">Tel</span><span className="value"><a href={`tel:${formData.client_phone}`}>{formData.client_phone}</a></span></InfoRow>}
            </InfoBody>
          </InfoCard>}
        </Sidebar>
      </Grid>
    </Layout>
  );
}
