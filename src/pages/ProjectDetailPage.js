// src/pages/ProjectDetailPage.js
// Projekt bearbeiten - mit CRM-Trennung und Drag & Drop
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getProjectById, updateProject, deleteProject } from '../lib/supabase';
import { THEMES, PROJECT_STATUS, ALL_COMPONENTS, DEFAULT_COMPONENT_ORDER } from '../lib/constants';

// ============================================
// STYLED COMPONENTS
// ============================================

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
  cursor: pointer;
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
  align-items: center;
  gap: 0.75rem;
  
  .icon { font-size: 1.25rem; }
  
  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.1rem;
    font-weight: 400;
    flex: 1;
  }
  
  .badge {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.25rem 0.5rem;
    background: #F5F5F5;
    color: #666;
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
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  
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

// Component List Styles
const ComponentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ComponentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: ${p => p.$active ? '#1A1A1A' : '#FAFAFA'};
  color: ${p => p.$active ? '#fff' : '#333'};
  border: 1px solid ${p => p.$active ? '#1A1A1A' : '#E5E5E5'};
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  
  ${p => p.$dragging && `opacity: 0.5; transform: scale(1.02);`}
  
  &:hover { border-color: #1A1A1A; }
  
  .drag-handle {
    cursor: grab;
    color: ${p => p.$active ? 'rgba(255,255,255,0.5)' : '#999'};
    &:active { cursor: grabbing; }
  }
  
  .checkbox {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid ${p => p.$active ? '#fff' : '#ccc'};
    background: ${p => p.$active ? '#fff' : 'transparent'};
    color: #1A1A1A;
    font-size: 0.7rem;
    ${p => p.$core && `opacity: 0.5;`}
  }
  
  .name { flex: 1; font-size: 0.85rem; font-weight: 500; }
  
  .badge {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.15rem 0.4rem;
    background: ${p => p.$active ? 'rgba(255,255,255,0.2)' : '#E5E5E5'};
    color: ${p => p.$active ? '#fff' : '#666'};
  }
`;

const ComponentInfo = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #F5F5F5;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #666;
  strong { color: #1A1A1A; }
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
  .value { font-weight: 500; color: #1A1A1A; }
`;

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    const { data, error } = await getProjectById(id);
    if (data) {
      setProject(data);
      setFormData({
        ...data,
        component_order: data.component_order || DEFAULT_COMPONENT_ORDER,
        active_components: data.active_components || ALL_COMPONENTS.filter(c => c.core).map(c => c.id),
      });
    }
    setIsLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Component toggle
  const toggleComponent = (compId) => {
    const comp = ALL_COMPONENTS.find(c => c.id === compId);
    if (comp?.core) return;
    
    const current = formData.active_components || [];
    const updated = current.includes(compId)
      ? current.filter(id => id !== compId)
      : [...current, compId];
    handleChange('active_components', updated);
  };

  // Drag and Drop
  const handleDragStart = (e, compId) => {
    setDraggedItem(compId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, compId) => {
    e.preventDefault();
    if (draggedItem === compId) return;
    
    const newOrder = [...(formData.component_order || DEFAULT_COMPONENT_ORDER)];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(compId);
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    handleChange('component_order', newOrder);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProject(id, {
      // CRM
      client_name: formData.client_name || null,
      client_email: formData.client_email || null,
      client_phone: formData.client_phone || null,
      client_address: formData.client_address || null,
      client_notes: formData.client_notes || null,
      // Website Pflicht
      partner1_name: formData.partner1_name,
      partner2_name: formData.partner2_name,
      couple_names: `${formData.partner1_name} & ${formData.partner2_name}`,
      wedding_date: formData.wedding_date,
      slug: formData.slug,
      // Website Optional
      location: formData.location || null,
      hashtag: formData.hashtag || null,
      display_email: formData.display_email || null,
      display_phone: formData.display_phone || null,
      // System
      theme: formData.theme,
      status: formData.status,
      admin_password: formData.admin_password,
      custom_domain: formData.custom_domain || null,
      // Komponenten
      active_components: formData.active_components,
      component_order: formData.component_order,
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

  if (isLoading) {
    return <Layout><div style={{ color: '#666', padding: '2rem' }}>Laden...</div></Layout>;
  }

  if (!project) {
    return <Layout><div style={{ padding: '2rem' }}>Projekt nicht gefunden</div></Layout>;
  }

  const status = PROJECT_STATUS[formData.status];
  const baseUrl = formData.custom_domain || `siwedding.de/${formData.slug}`;
  const coupleNames = formData.partner1_name && formData.partner2_name 
    ? `${formData.partner1_name} & ${formData.partner2_name}`
    : formData.couple_names || 'Unbenannt';
  
  const activeCount = formData.active_components?.length || 0;
  const coreCount = ALL_COMPONENTS.filter(c => c.core).length;
  const componentOrder = formData.component_order || DEFAULT_COMPONENT_ORDER;

  return (
    <Layout>
      <BackLink to="/projects">← Zurück zu Projekte</BackLink>
      
      <Header>
        <div>
          <TitleRow>
            <Title>{coupleNames}</Title>
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
          {/* CRM */}
          <Section>
            <SectionHeader>
              <span className="icon">👤</span>
              <h2>Kundendaten</h2>
              <span className="badge">Intern / CRM</span>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <FormGroup className="full-width">
                  <Label>Kundenname</Label>
                  <Input
                    value={formData.client_name || ''}
                    onChange={(e) => handleChange('client_name', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>E-Mail (privat)</Label>
                  <Input
                    type="email"
                    value={formData.client_email || ''}
                    onChange={(e) => handleChange('client_email', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Telefon (privat)</Label>
                  <Input
                    value={formData.client_phone || ''}
                    onChange={(e) => handleChange('client_phone', e.target.value)}
                  />
                </FormGroup>
                <FormGroup className="full-width">
                  <Label>Adresse</Label>
                  <Input
                    value={formData.client_address || ''}
                    onChange={(e) => handleChange('client_address', e.target.value)}
                  />
                </FormGroup>
                <FormGroup className="full-width">
                  <Label>Notizen</Label>
                  <TextArea
                    value={formData.client_notes || ''}
                    onChange={(e) => handleChange('client_notes', e.target.value)}
                  />
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </Section>
          
          {/* Website Pflicht */}
          <Section>
            <SectionHeader>
              <span className="icon">💒</span>
              <h2>Hochzeits-Website</h2>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <FormGroup>
                  <Label>Partner 1</Label>
                  <Input
                    value={formData.partner1_name || ''}
                    onChange={(e) => handleChange('partner1_name', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Partner 2</Label>
                  <Input
                    value={formData.partner2_name || ''}
                    onChange={(e) => handleChange('partner2_name', e.target.value)}
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
                  <Label>URL-Slug</Label>
                  <Input
                    value={formData.slug || ''}
                    onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Location</Label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Hamburg"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Hashtag</Label>
                  <Input
                    value={formData.hashtag || ''}
                    onChange={(e) => handleChange('hashtag', e.target.value)}
                    placeholder="#AnnaUndMax"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Kontakt-E-Mail (Website)</Label>
                  <Input
                    value={formData.display_email || ''}
                    onChange={(e) => handleChange('display_email', e.target.value)}
                    placeholder="hochzeit@..."
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Kontakt-Telefon (Website)</Label>
                  <Input
                    value={formData.display_phone || ''}
                    onChange={(e) => handleChange('display_phone', e.target.value)}
                  />
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </Section>
          
          {/* System */}
          <Section>
            <SectionHeader>
              <span className="icon">⚙️</span>
              <h2>Einstellungen</h2>
            </SectionHeader>
            <SectionBody>
              <FormGrid>
                <FormGroup>
                  <Label>Theme</Label>
                  <Select
                    value={formData.theme || 'botanical'}
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
                <FormGroup>
                  <Label>Custom Domain</Label>
                  <Input
                    value={formData.custom_domain || ''}
                    onChange={(e) => handleChange('custom_domain', e.target.value.toLowerCase())}
                    placeholder="anna-max.de"
                  />
                </FormGroup>
              </FormGrid>
            </SectionBody>
          </Section>
          
          {/* Links */}
          <Section>
            <SectionHeader>
              <span className="icon">🔗</span>
              <h2>Links</h2>
            </SectionHeader>
            <SectionBody>
              <FormGroup style={{ marginBottom: '1rem' }}>
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
          
          {/* Komponenten */}
          <Section>
            <SectionHeader>
              <span className="icon">📑</span>
              <h2>Komponenten</h2>
            </SectionHeader>
            <SectionBody>
              <ComponentInfo>
                <span><strong>{activeCount}</strong> aktiv ({coreCount} Basis + {activeCount - coreCount} optional)</span>
                <span>☰ Ziehen zum Sortieren</span>
              </ComponentInfo>
              
              <ComponentList>
                {componentOrder.map((compId) => {
                  const comp = ALL_COMPONENTS.find(c => c.id === compId);
                  if (!comp) return null;
                  
                  const isActive = formData.active_components?.includes(compId);
                  const isDragging = draggedItem === compId;
                  
                  return (
                    <ComponentItem
                      key={compId}
                      $active={isActive}
                      $core={comp.core}
                      $dragging={isDragging}
                      draggable
                      onDragStart={(e) => handleDragStart(e, compId)}
                      onDragOver={(e) => handleDragOver(e, compId)}
                      onDragEnd={handleDragEnd}
                      onClick={() => toggleComponent(compId)}
                    >
                      <span className="drag-handle">☰</span>
                      <span className="checkbox">{isActive && '✓'}</span>
                      <span className="name">{comp.name}</span>
                      {comp.core && <span className="badge">Basis</span>}
                    </ComponentItem>
                  );
                })}
              </ComponentList>
            </SectionBody>
          </Section>
        </MainColumn>
        
        {/* Sidebar */}
        <Sidebar>
          <InfoCard>
            <InfoHeader>Projekt-Info</InfoHeader>
            <InfoBody>
              <InfoRow>
                <span className="label">Erstellt</span>
                <span className="value">
                  {project.created_at ? new Date(project.created_at).toLocaleDateString('de-DE') : '–'}
                </span>
              </InfoRow>
              <InfoRow>
                <span className="label">Theme</span>
                <span className="value">{THEMES[formData.theme]?.name || formData.theme}</span>
              </InfoRow>
              <InfoRow>
                <span className="label">Hochzeit</span>
                <span className="value">
                  {formData.wedding_date 
                    ? new Date(formData.wedding_date).toLocaleDateString('de-DE') 
                    : '–'}
                </span>
              </InfoRow>
              <InfoRow>
                <span className="label">Komponenten</span>
                <span className="value">{activeCount} aktiv</span>
              </InfoRow>
            </InfoBody>
          </InfoCard>
          
          {formData.client_email && (
            <InfoCard>
              <InfoHeader>Schnellkontakt</InfoHeader>
              <InfoBody>
                <InfoRow>
                  <span className="label">E-Mail</span>
                  <span className="value">
                    <a href={`mailto:${formData.client_email}`}>{formData.client_email}</a>
                  </span>
                </InfoRow>
                {formData.client_phone && (
                  <InfoRow>
                    <span className="label">Telefon</span>
                    <span className="value">
                      <a href={`tel:${formData.client_phone}`}>{formData.client_phone}</a>
                    </span>
                  </InfoRow>
                )}
              </InfoBody>
            </InfoCard>
          )}
        </Sidebar>
      </Grid>
    </Layout>
  );
}
