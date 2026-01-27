// src/pages/ProjectDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getProjectById, updateProject, deleteProject, getDashboardStats } from '../lib/supabase';
import { PACKAGES, ADDONS, THEMES, PROJECT_STATUS, CORE_COMPONENTS, OPTIONAL_COMPONENTS } from '../lib/constants';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const BackLink = styled(Link)`
  color: #666;
  font-size: 0.8rem;
  display: inline-block;
  margin-bottom: 0.5rem;
  
  &:hover { color: #1A1A1A; }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 2rem;
  font-weight: 400;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: ${p => p.$color ? `${p.$color}15` : '#F5F5F5'};
  color: ${p => p.$color || '#666'};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.65rem 1.25rem;
  background: ${p => p.$danger ? '#fff' : p.$primary ? '#1A1A1A' : '#fff'};
  color: ${p => p.$danger ? '#DC2626' : p.$primary ? '#fff' : '#1A1A1A'};
  border: 1px solid ${p => p.$danger ? '#FCA5A5' : p.$primary ? '#1A1A1A' : '#E5E5E5'};
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: ${p => p.$danger ? '#FEE2E2' : p.$primary ? '#333' : '#F5F5F5'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div``;

const Sidebar = styled.div``;

const Section = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #E5E5E5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.1rem;
    font-weight: 400;
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
  
  &.full-width { grid-column: 1 / -1; }
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
  
  &:disabled {
    opacity: 0.6;
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

const LinkBox = styled.div`
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  padding: 0.75rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  
  a {
    color: #1A1A1A;
    &:hover { text-decoration: underline; }
  }
  
  button {
    background: #fff;
    border: 1px solid #E5E5E5;
    color: #666;
    padding: 0.25rem 0.6rem;
    font-size: 0.7rem;
    cursor: pointer;
    
    &:hover { border-color: #1A1A1A; color: #1A1A1A; }
  }
`;

const ComponentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
`;

const ComponentToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${p => p.$active ? '#1A1A1A' : '#FAFAFA'};
  color: ${p => p.$active ? '#fff' : '#666'};
  border: 1px solid ${p => p.$active ? '#1A1A1A' : '#E5E5E5'};
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s ease;
  
  input { display: none; }
  
  &:hover { border-color: #1A1A1A; }
`;

// Sidebar Cards
const InfoCard = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
  margin-bottom: 1rem;
`;

const InfoHeader = styled.div`
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #E5E5E5;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
`;

const InfoBody = styled.div`
  padding: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  
  &:last-child { margin-bottom: 0; }
  
  .label { color: #666; }
  .value { 
    font-weight: 500; 
    color: #1A1A1A;
    font-family: ${p => p.$mono ? "'JetBrains Mono', monospace" : 'inherit'};
  }
`;

const PriceTotal = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid #E5E5E5;
  font-weight: 600;
  
  .value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
  }
`;

const HostingBar = styled.div`
  margin-top: 1rem;
  
  .bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #666;
    margin-bottom: 0.35rem;
  }
  
  .bar {
    height: 6px;
    background: #E5E5E5;
    border-radius: 3px;
    overflow: hidden;
    
    .fill {
      height: 100%;
      background: ${p => p.$expired ? '#DC2626' : '#22c55e'};
      width: ${p => p.$percent}%;
    }
  }
`;

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const [projectRes, statsRes] = await Promise.all([
      getProjectById(id),
      getDashboardStats(),
    ]);
    
    if (projectRes.data) {
      setProject(projectRes.data);
      setFormData(projectRes.data);
    }
    setStats(statsRes);
    setIsLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComponentToggle = (comp) => {
    if (CORE_COMPONENTS.includes(comp)) return;
    const current = formData.active_components || [];
    const updated = current.includes(comp)
      ? current.filter(c => c !== comp)
      : [...current, comp];
    handleChange('active_components', updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProject(id, {
      couple_names: formData.couple_names,
      slug: formData.slug,
      wedding_date: formData.wedding_date,
      status: formData.status,
      custom_domain: formData.custom_domain || null,
      theme: formData.theme,
      package_type: formData.package_type,
      active_components: formData.active_components,
      admin_password: formData.admin_password,
      addons: formData.addons,
      extra_hosting_months: formData.extra_hosting_months,
      total_price: formData.total_price,
    });
    
    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Gespeichert!');
      setProject(formData);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Projekt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    const { error } = await deleteProject(id);
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Projekt gelöscht');
      navigate('/projects');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopiert!');
  };

  // Hosting calculation
  const getHostingInfo = () => {
    if (!formData.wedding_date) return { endDate: null, daysLeft: null, percent: 0 };
    
    const weddingDate = new Date(formData.wedding_date);
    const pkg = PACKAGES[formData.package_type];
    const baseMonths = pkg?.hostingMonths || 1;
    const extraMonths = formData.extra_hosting_months || 0;
    
    const endDate = new Date(weddingDate);
    endDate.setMonth(endDate.getMonth() + baseMonths + extraMonths);
    
    const now = new Date();
    const totalDays = Math.ceil((endDate - weddingDate) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const percent = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
    
    return { 
      endDate: endDate.toLocaleDateString('de-DE'), 
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      percent,
      expired: daysLeft <= 0
    };
  };

  if (isLoading) {
    return <Layout stats={stats}><div style={{ color: '#666', padding: '2rem' }}>Laden...</div></Layout>;
  }

  if (!project) {
    return <Layout stats={stats}><div style={{ padding: '2rem' }}>Projekt nicht gefunden</div></Layout>;
  }

  const baseUrl = formData.custom_domain || `siwedding.de/${formData.slug}`;
  const pkg = PACKAGES[formData.package_type];
  const status = PROJECT_STATUS[formData.status];
  const hosting = getHostingInfo();
  const componentCount = formData.active_components?.length || 0;

  return (
    <Layout stats={stats}>
      <BackLink to="/projects">← Zurück zu Projekte</BackLink>
      
      <Header>
        <div>
          <TitleRow>
            <Title>{formData.couple_names || 'Unbenannt'}</Title>
            <StatusBadge $color={status?.color}>{status?.label || formData.status}</StatusBadge>
          </TitleRow>
        </div>
        <Actions>
          <Button $danger onClick={handleDelete}>Löschen</Button>
          <Button $primary onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        </Actions>
      </Header>
      
      <Grid>
        <MainColumn>
          {/* Basic Info */}
          <Section>
            <SectionHeader>
              <h2>Grunddaten</h2>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <FormGroup>
                  <Label>Paarname</Label>
                  <Input
                    value={formData.couple_names || ''}
                    onChange={(e) => handleChange('couple_names', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Slug (URL)</Label>
                  <Input
                    value={formData.slug || ''}
                    onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Hochzeitsdatum</Label>
                  <Input
                    type="date"
                    value={formData.wedding_date?.split('T')[0] || ''}
                    onChange={(e) => handleChange('wedding_date', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Theme</Label>
                  <Select
                    value={formData.theme || 'editorial'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                  >
                    {Object.values(THEMES).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Status</Label>
                  <Select
                    value={formData.status || 'draft'}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {Object.entries(PROJECT_STATUS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Admin Passwort</Label>
                  <Input
                    value={formData.admin_password || ''}
                    onChange={(e) => handleChange('admin_password', e.target.value)}
                  />
                </FormGroup>
                <FormGroup className="full-width">
                  <Label>Custom Domain</Label>
                  <Input
                    value={formData.custom_domain || ''}
                    onChange={(e) => handleChange('custom_domain', e.target.value.toLowerCase())}
                    placeholder="z.B. sarah-iver.de"
                  />
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </Section>
          
          {/* Links */}
          <Section>
            <SectionHeader>
              <h2>Links</h2>
            </SectionHeader>
            <SectionBody>
              <FormGroup>
                <Label>Hochzeitsseite</Label>
                <LinkBox>
                  <a href={`https://${baseUrl}`} target="_blank" rel="noopener noreferrer">{baseUrl}</a>
                  <button onClick={() => copyToClipboard(`https://${baseUrl}`)}>Kopieren</button>
                </LinkBox>
              </FormGroup>
              <FormGroup>
                <Label>Kunden-Dashboard</Label>
                <LinkBox>
                  <a href={`https://${baseUrl}/admin`} target="_blank" rel="noopener noreferrer">{baseUrl}/admin</a>
                  <button onClick={() => copyToClipboard(`https://${baseUrl}/admin`)}>Kopieren</button>
                </LinkBox>
              </FormGroup>
            </SectionBody>
          </Section>
          
          {/* Components */}
          <Section>
            <SectionHeader>
              <h2>Komponenten ({componentCount} aktiv)</h2>
            </SectionHeader>
            <SectionBody>
              <ComponentsGrid>
                {[...CORE_COMPONENTS, ...OPTIONAL_COMPONENTS.map(c => c.id)].map(comp => {
                  const isCore = CORE_COMPONENTS.includes(comp);
                  const isActive = formData.active_components?.includes(comp);
                  const label = OPTIONAL_COMPONENTS.find(c => c.id === comp)?.name || comp;
                  
                  return (
                    <ComponentToggle 
                      key={comp} 
                      $active={isActive || isCore}
                      onClick={() => !isCore && handleComponentToggle(comp)}
                      style={isCore ? { opacity: 0.6, cursor: 'default' } : {}}
                    >
                      <input type="checkbox" checked={isActive || isCore} onChange={() => {}} />
                      {label}
                    </ComponentToggle>
                  );
                })}
              </ComponentsGrid>
            </SectionBody>
          </Section>
        </MainColumn>
        
        {/* Sidebar */}
        <Sidebar>
          {/* Package Info */}
          <InfoCard>
            <InfoHeader>Paket & Preis</InfoHeader>
            <InfoBody>
              <InfoRow>
                <span className="label">Paket</span>
                <span className="value">{pkg?.name || '–'}</span>
              </InfoRow>
              <InfoRow $mono>
                <span className="label">Paketpreis</span>
                <span className="value">{pkg?.price?.toLocaleString('de-DE')} €</span>
              </InfoRow>
              {formData.addons?.length > 0 && formData.addons.map(addonId => (
                <InfoRow key={addonId} $mono>
                  <span className="label">{ADDONS[addonId]?.name}</span>
                  <span className="value">+{ADDONS[addonId]?.price} €</span>
                </InfoRow>
              ))}
              {formData.extra_hosting_months > 0 && (
                <InfoRow $mono>
                  <span className="label">+{formData.extra_hosting_months} Mon. Hosting</span>
                  <span className="value">+{formData.extra_hosting_months * 25} €</span>
                </InfoRow>
              )}
              <PriceTotal>
                <span>Gesamt</span>
                <span className="value">{formData.total_price?.toLocaleString('de-DE') || '–'} €</span>
              </PriceTotal>
            </InfoBody>
          </InfoCard>
          
          {/* Hosting Info */}
          <InfoCard>
            <InfoHeader>Hosting</InfoHeader>
            <InfoBody>
              <InfoRow>
                <span className="label">Basis</span>
                <span className="value">{pkg?.hostingMonths || 1} Monate</span>
              </InfoRow>
              {formData.extra_hosting_months > 0 && (
                <InfoRow>
                  <span className="label">Extra</span>
                  <span className="value">+{formData.extra_hosting_months} Monate</span>
                </InfoRow>
              )}
              <InfoRow>
                <span className="label">Enddatum</span>
                <span className="value">{hosting.endDate || '–'}</span>
              </InfoRow>
              
              {hosting.endDate && (
                <HostingBar $percent={hosting.percent} $expired={hosting.expired}>
                  <div className="bar-label">
                    <span>{hosting.expired ? 'Abgelaufen' : `${hosting.daysLeft} Tage übrig`}</span>
                  </div>
                  <div className="bar">
                    <div className="fill" />
                  </div>
                </HostingBar>
              )}
            </InfoBody>
          </InfoCard>
          
          {/* Features */}
          <InfoCard>
            <InfoHeader>Features</InfoHeader>
            <InfoBody>
              <InfoRow>
                <span className="label">Save the Date</span>
                <span className="value">{formData.includes_std || pkg?.includesSTD ? '✓' : '–'}</span>
              </InfoRow>
              <InfoRow>
                <span className="label">Archiv-Seite</span>
                <span className="value">{formData.includes_archive || pkg?.includesArchive ? '✓' : '–'}</span>
              </InfoRow>
              <InfoRow>
                <span className="label">Max. Komponenten</span>
                <span className="value">{pkg?.maxOptionalComponents === 999 ? '∞' : pkg?.maxOptionalComponents}</span>
              </InfoRow>
              <InfoRow>
                <span className="label">Feedback-Runden</span>
                <span className="value">{pkg?.feedbackRounds === 999 ? '∞' : pkg?.feedbackRounds}</span>
              </InfoRow>
            </InfoBody>
          </InfoCard>
        </Sidebar>
      </Grid>
    </Layout>
  );
}
