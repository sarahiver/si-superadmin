// src/pages/NewProjectPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { createProject } from '../lib/supabase';
import { PACKAGES, ADDONS, THEMES, CORE_COMPONENTS, OPTIONAL_COMPONENTS } from '../lib/constants';

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  color: #666;
  font-size: 0.8rem;
  display: inline-block;
  margin-bottom: 0.5rem;
  
  &:hover { color: #1A1A1A; }
`;

const Title = styled.h1`
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 2rem;
  font-weight: 400;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div``;

const Sidebar = styled.div`
  position: sticky;
  top: 2rem;
`;

const Section = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #E5E5E5;
  
  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.1rem;
    font-weight: 400;
  }
  
  p {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.25rem;
  }
`;

const SectionBody = styled.div`
  padding: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  &:last-child { margin-bottom: 0; }
  
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #1A1A1A;
    background: #fff;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #1A1A1A;
  }
`;

const Hint = styled.div`
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.35rem;
`;

const PackageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PackageCard = styled.div`
  border: 2px solid ${p => p.$selected ? '#1A1A1A' : '#E5E5E5'};
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  background: ${p => p.$selected ? '#FAFAFA' : '#fff'};
  
  &:hover {
    border-color: ${p => p.$selected ? '#1A1A1A' : '#ccc'};
  }
  
  ${p => p.$popular && `
    &::before {
      content: 'Beliebt';
      position: absolute;
      top: -10px;
      right: 1rem;
      background: #1A1A1A;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.25rem 0.5rem;
    }
  `}
  
  .name {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }
  
  .price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    color: #1A1A1A;
    margin-bottom: 0.75rem;
  }
  
  .features {
    font-size: 0.75rem;
    color: #666;
    line-height: 1.6;
  }
`;

const AddonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AddonCard = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid ${p => p.$selected ? '#1A1A1A' : '#E5E5E5'};
  background: ${p => p.$selected ? '#FAFAFA' : '#fff'};
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: ${p => p.$selected ? '#1A1A1A' : '#ccc'};
  }
  
  input {
    margin-top: 2px;
    accent-color: #1A1A1A;
  }
  
  .info {
    flex: 1;
    
    .name {
      font-weight: 500;
      font-size: 0.85rem;
      margin-bottom: 0.15rem;
    }
    
    .desc {
      font-size: 0.75rem;
      color: #666;
    }
  }
  
  .price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: #1A1A1A;
  }
`;

const ComponentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
`;

const ComponentToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: ${p => p.$active ? '#1A1A1A' : '#FAFAFA'};
  color: ${p => p.$active ? '#fff' : '#666'};
  border: 1px solid ${p => p.$active ? '#1A1A1A' : '#E5E5E5'};
  cursor: ${p => p.$core ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.$core ? 0.6 : 1};
  font-size: 0.8rem;
  transition: all 0.15s ease;
  user-select: none;
  
  &:hover {
    border-color: ${p => p.$core ? '#E5E5E5' : '#1A1A1A'};
  }
`;

const WarningBanner = styled.div`
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  color: #92400E;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PriceSummary = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
`;

const PriceHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #E5E5E5;
  
  h3 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1rem;
    font-weight: 400;
  }
`;

const PriceBody = styled.div`
  padding: 1.25rem;
`;

const PriceLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: ${p => p.$muted ? '#999' : '#1A1A1A'};
  
  .value {
    font-family: 'JetBrains Mono', monospace;
  }
`;

const PriceTotal = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid #E5E5E5;
  font-weight: 600;
  
  .label {
    font-size: 0.9rem;
  }
  
  .value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.25rem;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #1A1A1A;
  color: #fff;
  border: none;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 1rem;
  transition: background 0.2s;
  
  &:hover:not(:disabled) { background: #333; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const HostingInfo = styled.div`
  background: #F5F5F5;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #666;
  
  strong { color: #1A1A1A; }
`;

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [coupleNames, setCoupleNames] = useState('');
  const [slug, setSlug] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [theme, setTheme] = useState('editorial');
  const [selectedPackage, setSelectedPackage] = useState('signature');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [extraHostingMonths, setExtraHostingMonths] = useState(0);
  const [adminPassword, setAdminPassword] = useState('');
  const [activeComponents, setActiveComponents] = useState([...CORE_COMPONENTS, 'timeline', 'locations', 'gallery', 'faq']);

  const handleNameChange = (value) => {
    setCoupleNames(value);
    const newSlug = value
      .toLowerCase()
      .replace(/\s*&\s*/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    setSlug(newSlug);
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  // Toggle component - always allowed, just show warning
  const toggleComponent = (compId) => {
    if (CORE_COMPONENTS.includes(compId)) return; // Can't disable core
    setActiveComponents(prev =>
      prev.includes(compId)
        ? prev.filter(id => id !== compId)
        : [...prev, compId]
    );
  };

  const packagePrice = PACKAGES[selectedPackage]?.price || 0;
  const addonsPrice = selectedAddons.reduce((sum, id) => sum + (ADDONS[id]?.price || 0), 0);
  const hostingPrice = extraHostingMonths * 25;
  const totalPrice = packagePrice + addonsPrice + hostingPrice;

  // Component count check
  const maxComponents = PACKAGES[selectedPackage]?.maxOptionalComponents || 4;
  const optionalCount = activeComponents.filter(c => !CORE_COMPONENTS.includes(c)).length;
  const isOverLimit = maxComponents !== 999 && optionalCount > maxComponents;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!coupleNames || !slug) {
      toast.error('Bitte Paarname und Slug eingeben');
      return;
    }
    
    // Warning if over limit
    if (isOverLimit) {
      const confirmed = window.confirm(
        `Achtung: Du hast ${optionalCount} optionale Komponenten gewählt, aber das ${PACKAGES[selectedPackage]?.name}-Paket enthält nur ${maxComponents}.\n\nTrotzdem fortfahren?`
      );
      if (!confirmed) return;
    }
    
    setIsSubmitting(true);
    
    const projectData = {
      couple_names: coupleNames,
      slug: slug,
      wedding_date: weddingDate || null,
      theme: theme,
      status: 'draft',
      package_type: selectedPackage,
      addons: selectedAddons,
      extra_hosting_months: extraHostingMonths,
      total_price: totalPrice,
      admin_password: adminPassword || 'wedding2025',
      active_components: activeComponents,
      includes_std: selectedAddons.includes('std') || PACKAGES[selectedPackage]?.includesSTD,
      includes_archive: selectedAddons.includes('archive') || PACKAGES[selectedPackage]?.includesArchive,
    };
    
    const { data, error } = await createProject(projectData);
    
    if (error) {
      toast.error('Fehler: ' + error.message);
      setIsSubmitting(false);
    } else {
      toast.success('Projekt erstellt!');
      navigate(`/projects/${data.id}`);
    }
  };

  const stdIncluded = PACKAGES[selectedPackage]?.includesSTD;
  const archiveIncluded = PACKAGES[selectedPackage]?.includesArchive;
  const baseHostingMonths = PACKAGES[selectedPackage]?.hostingMonths || 1;

  const getHostingEndDate = () => {
    if (!weddingDate) return null;
    const date = new Date(weddingDate);
    date.setMonth(date.getMonth() + baseHostingMonths + extraHostingMonths);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <Layout>
      <Header>
        <BackLink to="/projects">← Zurück zu Projekte</BackLink>
        <Title>Neues Projekt anlegen</Title>
      </Header>
      
      <Form onSubmit={handleSubmit}>
        <MainColumn>
          {/* Basic Info */}
          <Section>
            <SectionHeader>
              <h2>Grunddaten</h2>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <FormGroup>
                  <Label>Paarname *</Label>
                  <Input
                    value={coupleNames}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="z.B. Sarah & Iver"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Slug (URL) *</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="sarah-iver"
                    required
                  />
                  <Hint>siwedding.de/{slug || 'slug'}</Hint>
                </FormGroup>
                <FormGroup>
                  <Label>Hochzeitsdatum</Label>
                  <Input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Theme</Label>
                  <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    {Object.values(THEMES).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup className="full-width">
                  <Label>Admin Passwort (Kunden-Dashboard)</Label>
                  <Input
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="wedding2025"
                  />
                  <Hint>Das Passwort für /{slug || 'slug'}/admin</Hint>
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </Section>
          
          {/* Package Selection */}
          <Section>
            <SectionHeader>
              <h2>Paket wählen</h2>
              <p>Bestimmt Umfang, Hosting-Dauer und Preis</p>
            </SectionHeader>
            <SectionBody>
              <PackageGrid>
                {Object.values(PACKAGES).map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    $selected={selectedPackage === pkg.id}
                    $popular={pkg.popular}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    <div className="name">{pkg.name}</div>
                    <div className="price">{pkg.price.toLocaleString('de-DE')} €</div>
                    <div className="features">
                      4 Basis + {pkg.maxOptionalComponents === 999 ? '∞' : pkg.maxOptionalComponents} optionale<br/>
                      {pkg.hostingMonths} Mon. Hosting<br/>
                      {pkg.feedbackRounds === 999 ? '∞' : pkg.feedbackRounds} Feedback-Runden
                      {pkg.includesSTD && <><br/>✓ Save the Date</>}
                      {pkg.includesArchive && <><br/>✓ Archiv-Seite</>}
                    </div>
                  </PackageCard>
                ))}
              </PackageGrid>
              
              {weddingDate && (
                <HostingInfo>
                  Hosting läuft bis <strong>{getHostingEndDate()}</strong> ({baseHostingMonths + extraHostingMonths} Monate nach Hochzeit)
                </HostingInfo>
              )}
            </SectionBody>
          </Section>
          
          {/* Addons */}
          <Section>
            <SectionHeader>
              <h2>Zusatzoptionen</h2>
              <p>Erweitere das Paket nach Bedarf</p>
            </SectionHeader>
            <SectionBody>
              <AddonGrid>
                {Object.values(ADDONS).filter(a => a.id !== 'extraHosting').map(addon => {
                  const isIncluded = (addon.id === 'std' && stdIncluded) || (addon.id === 'archive' && archiveIncluded);
                  const isSelected = selectedAddons.includes(addon.id);
                  
                  return (
                    <AddonCard 
                      key={addon.id} 
                      $selected={isSelected || isIncluded}
                      style={isIncluded ? { opacity: 0.6, pointerEvents: 'none' } : {}}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected || isIncluded}
                        onChange={() => !isIncluded && toggleAddon(addon.id)}
                        disabled={isIncluded}
                      />
                      <div className="info">
                        <div className="name">{addon.name} {isIncluded && '(inkl.)'}</div>
                        <div className="desc">{addon.description}</div>
                      </div>
                      <div className="price">{isIncluded ? '0 €' : `+${addon.price} €`}</div>
                    </AddonCard>
                  );
                })}
              </AddonGrid>
              
              <FormGroup style={{ marginTop: '1.5rem' }}>
                <Label>Extra Hosting-Monate (+25 €/Monat)</Label>
                <Select 
                  value={extraHostingMonths} 
                  onChange={(e) => setExtraHostingMonths(parseInt(e.target.value))}
                >
                  <option value={0}>Keine zusätzlichen Monate</option>
                  <option value={3}>+3 Monate (+75 €)</option>
                  <option value={6}>+6 Monate (+150 €)</option>
                  <option value={12}>+12 Monate (+300 €)</option>
                </Select>
              </FormGroup>
            </SectionBody>
          </Section>
          
          {/* Components */}
          <Section>
            <SectionHeader>
              <h2>Komponenten</h2>
              <p>
                {optionalCount} von {maxComponents === 999 ? '∞' : maxComponents} optionalen Komponenten gewählt
              </p>
            </SectionHeader>
            <SectionBody>
              <Label style={{ marginBottom: '0.75rem' }}>Basis (immer inklusive)</Label>
              <ComponentsGrid style={{ marginBottom: '1.5rem' }}>
                {CORE_COMPONENTS.map(compId => (
                  <ComponentToggle key={compId} $active $core>
                    {compId}
                  </ComponentToggle>
                ))}
              </ComponentsGrid>
              
              <Label style={{ marginBottom: '0.75rem' }}>Optional (zum An-/Abwählen klicken)</Label>
              <ComponentsGrid>
                {OPTIONAL_COMPONENTS.map(comp => {
                  const isActive = activeComponents.includes(comp.id);
                  
                  return (
                    <ComponentToggle 
                      key={comp.id} 
                      $active={isActive}
                      onClick={() => toggleComponent(comp.id)}
                    >
                      {comp.name}
                    </ComponentToggle>
                  );
                })}
              </ComponentsGrid>
              
              {isOverLimit && (
                <WarningBanner>
                  ⚠️ Du hast mehr Komponenten gewählt ({optionalCount}) als im {PACKAGES[selectedPackage]?.name}-Paket enthalten ({maxComponents}).
                </WarningBanner>
              )}
            </SectionBody>
          </Section>
        </MainColumn>
        
        {/* Sidebar - Price Summary */}
        <Sidebar>
          <PriceSummary>
            <PriceHeader>
              <h3>Preisübersicht</h3>
            </PriceHeader>
            <PriceBody>
              <PriceLine>
                <span>Paket {PACKAGES[selectedPackage]?.name}</span>
                <span className="value">{packagePrice.toLocaleString('de-DE')} €</span>
              </PriceLine>
              
              {selectedAddons.map(addonId => (
                <PriceLine key={addonId}>
                  <span>{ADDONS[addonId]?.name}</span>
                  <span className="value">+{ADDONS[addonId]?.price} €</span>
                </PriceLine>
              ))}
              
              {extraHostingMonths > 0 && (
                <PriceLine>
                  <span>+{extraHostingMonths} Monate Hosting</span>
                  <span className="value">+{hostingPrice} €</span>
                </PriceLine>
              )}
              
              <PriceTotal>
                <span className="label">Gesamt</span>
                <span className="value">{totalPrice.toLocaleString('de-DE')} €</span>
              </PriceTotal>
              
              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wird erstellt...' : 'Projekt erstellen'}
              </SubmitButton>
            </PriceBody>
          </PriceSummary>
        </Sidebar>
      </Form>
    </Layout>
  );
}
