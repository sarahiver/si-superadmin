// src/pages/ProjectDetailPage.js
// Editorial Design - Mit zuklappbaren Sections
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getProjectById, updateProject, deleteProject } from '../lib/supabase';
import { THEMES, PROJECT_STATUS, ALL_COMPONENTS, DEFAULT_COMPONENT_ORDER, CORE_COMPONENTS } from '../lib/constants';

// ============================================
// EDITORIAL DESIGN TOKENS
// ============================================

const colors = {
  black: '#0A0A0A',
  white: '#FAFAFA',
  red: '#C41E3A',
  gray: '#666666',
  lightGray: '#E5E5E5',
  background: '#F5F5F5',
};

// ============================================
// STYLED COMPONENTS
// ============================================

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px solid ${colors.black};
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderLeft = styled.div``;

const BackLink = styled(Link)`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${colors.gray};
  text-decoration: none;
  display: inline-block;
  margin-bottom: 0.75rem;
  
  &:hover { color: ${colors.black}; }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-family: 'Oswald', 'Arial Narrow', sans-serif;
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: ${colors.black};
  line-height: 1;
`;

const StatusBadge = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.35rem 0.75rem;
  background: ${p => p.$color ? `${p.$color}20` : colors.background};
  color: ${p => p.$color || colors.gray};
  border: 1px solid ${p => p.$color || colors.lightGray};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  font-family: 'Oswald', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${p => p.$danger && `
    background: transparent;
    color: ${colors.red};
    border: 2px solid ${colors.red};
    
    &:hover {
      background: ${colors.red};
      color: ${colors.white};
    }
  `}
  
  ${p => p.$primary && `
    background: ${colors.red};
    color: ${colors.white};
    border: 2px solid ${colors.red};
    
    &:hover:not(:disabled) {
      background: ${colors.black};
      border-color: ${colors.black};
    }
  `}
  
  ${p => !p.$danger && !p.$primary && `
    background: transparent;
    color: ${colors.black};
    border: 2px solid ${colors.black};
    
    &:hover {
      background: ${colors.black};
      color: ${colors.white};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div``;
const Sidebar = styled.div``;

// ============================================
// COLLAPSIBLE SECTION
// ============================================

const Section = styled.section`
  margin-bottom: 1rem;
  border: 2px solid ${colors.black};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: ${p => p.$isOpen ? colors.black : colors.white};
  color: ${p => p.$isOpen ? colors.white : colors.black};
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${p => p.$isOpen ? colors.black : colors.background};
  }
`;

const SectionNumber = styled.span`
  font-family: 'Oswald', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${p => p.$isOpen ? colors.white : colors.red};
  min-width: 24px;
`;

const SectionTitle = styled.h2`
  font-family: 'Oswald', sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex: 1;
`;

const SectionBadge = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${p => p.$isOpen ? colors.gray : colors.gray};
  background: ${p => p.$isOpen ? 'rgba(255,255,255,0.1)' : colors.background};
  padding: 0.25rem 0.5rem;
`;

const CollapseIcon = styled.span`
  font-size: 1.25rem;
  transition: transform 0.2s ease;
  transform: ${p => p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const SectionBody = styled.div`
  padding: ${p => p.$isOpen ? '1.5rem' : '0'};
  max-height: ${p => p.$isOpen ? '2000px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  border-top: ${p => p.$isOpen ? `1px solid ${colors.lightGray}` : 'none'};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  &.full-width { grid-column: 1 / -1; }
`;

const Label = styled.label`
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${colors.black};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${colors.white};
  border: 2px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: ${colors.black};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${colors.black};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${colors.white};
  border: 2px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: ${colors.black};
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: ${colors.black};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${colors.white};
  border: 2px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${colors.black};
  }
`;

const LinkBox = styled.div`
  background: ${colors.black};
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  &:last-child { margin-bottom: 0; }
  
  a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: ${colors.white};
    text-decoration: none;
    
    &:hover { text-decoration: underline; }
  }
  
  button {
    background: ${colors.red};
    border: none;
    color: ${colors.white};
    padding: 0.4rem 0.75rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    
    &:hover { background: ${colors.white}; color: ${colors.black}; }
  }
`;

// Component List
const ComponentListContainer = styled.div`
  border: 2px solid ${colors.lightGray};
`;

const ComponentListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: ${colors.background};
  
  .count {
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: ${colors.black};
  }
  
  .hint {
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    color: ${colors.gray};
  }
`;

const ComponentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: ${p => p.$active ? colors.black : colors.white};
  color: ${p => p.$active ? colors.white : colors.black};
  border-bottom: 1px solid ${colors.lightGray};
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  
  &:last-child { border-bottom: none; }
  
  ${p => p.$dragging && `opacity: 0.5;`}
  
  &:hover {
    background: ${p => p.$active ? colors.black : colors.background};
  }
  
  .drag-handle {
    color: ${p => p.$active ? colors.gray : colors.lightGray};
    cursor: grab;
  }
  
  .checkbox {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid ${p => p.$active ? colors.white : colors.black};
    background: ${p => p.$active ? colors.white : 'transparent'};
    color: ${colors.black};
    font-size: 0.75rem;
    font-weight: 700;
    ${p => p.$core && `border-style: dashed; opacity: 0.6;`}
  }
  
  .name {
    flex: 1;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .badge {
    font-family: 'Inter', sans-serif;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    background: ${p => p.$active ? colors.red : colors.background};
    color: ${p => p.$active ? colors.white : colors.gray};
  }
`;

// Sidebar
const InfoCard = styled.div`
  border: 2px solid ${colors.black};
  margin-bottom: 1.5rem;
`;

const InfoHeader = styled.div`
  padding: 0.75rem 1rem;
  background: ${colors.black};
  color: ${colors.white};
  font-family: 'Oswald', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const InfoBody = styled.div`
  padding: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  
  &:last-child { margin-bottom: 0; }
  
  .label { color: ${colors.gray}; }
  .value { 
    font-weight: 500; 
    color: ${colors.black};
    text-align: right;
  }
  
  a {
    color: ${colors.red};
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================

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
      <SectionBody $isOpen={isOpen}>
        {children}
      </SectionBody>
    </Section>
  );
}

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
    const { data } = await getProjectById(id);
    if (data) {
      setProject(data);
      setFormData({
        ...data,
        component_order: data.component_order || DEFAULT_COMPONENT_ORDER,
        active_components: data.active_components || [...CORE_COMPONENTS],
      });
    }
    setIsLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleComponent = (compId) => {
    const comp = ALL_COMPONENTS.find(c => c.id === compId);
    if (comp?.core) return;
    
    const current = formData.active_components || [];
    const updated = current.includes(compId)
      ? current.filter(id => id !== compId)
      : [...current, compId];
    handleChange('active_components', updated);
  };

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

  const handleDragEnd = () => setDraggedItem(null);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProject(id, {
      client_name: formData.client_name || null,
      client_email: formData.client_email || null,
      client_phone: formData.client_phone || null,
      client_address: formData.client_address || null,
      client_notes: formData.client_notes || null,
      partner1_name: formData.partner1_name,
      partner2_name: formData.partner2_name,
      couple_names: `${formData.partner1_name} & ${formData.partner2_name}`,
      wedding_date: formData.wedding_date,
      slug: formData.slug,
      location: formData.location || null,
      hashtag: formData.hashtag || null,
      display_email: formData.display_email || null,
      display_phone: formData.display_phone || null,
      theme: formData.theme,
      status: formData.status,
      admin_password: formData.admin_password,
      custom_domain: formData.custom_domain || null,
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
    if (!window.confirm('Projekt wirklich löschen?')) return;
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

  if (isLoading) return <Layout><div style={{ padding: '2rem', color: colors.gray }}>Laden...</div></Layout>;
  if (!project) return <Layout><div style={{ padding: '2rem' }}>Projekt nicht gefunden</div></Layout>;

  const status = PROJECT_STATUS[formData.status];
  const baseUrl = formData.custom_domain || `siwedding.de/${formData.slug}`;
  const coupleNames = formData.partner1_name && formData.partner2_name 
    ? `${formData.partner1_name} & ${formData.partner2_name}`
    : formData.couple_names || 'Unbenannt';
  const activeCount = formData.active_components?.length || 0;
  const componentOrder = formData.component_order || DEFAULT_COMPONENT_ORDER;

  return (
    <Layout>
      <Header>
        <HeaderLeft>
          <BackLink to="/projects">← Zurück zu Projekte</BackLink>
          <TitleRow>
            <Title>{coupleNames}</Title>
            <StatusBadge $color={status?.color}>{status?.label}</StatusBadge>
          </TitleRow>
        </HeaderLeft>
        <Actions>
          <Button $danger onClick={handleDelete}>Löschen</Button>
          <Button $primary onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        </Actions>
      </Header>
      
      <Grid>
        <MainColumn>
          {/* 01 - CRM */}
          <CollapsibleSection number="01" title="Kundendaten" badge="Intern" defaultOpen={false}>
            <FormGrid>
              <FormGroup className="full-width">
                <Label>Kundenname</Label>
                <Input value={formData.client_name || ''} onChange={(e) => handleChange('client_name', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>E-Mail (privat)</Label>
                <Input type="email" value={formData.client_email || ''} onChange={(e) => handleChange('client_email', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Telefon (privat)</Label>
                <Input value={formData.client_phone || ''} onChange={(e) => handleChange('client_phone', e.target.value)} />
              </FormGroup>
              <FormGroup className="full-width">
                <Label>Adresse</Label>
                <Input value={formData.client_address || ''} onChange={(e) => handleChange('client_address', e.target.value)} />
              </FormGroup>
              <FormGroup className="full-width">
                <Label>Notizen</Label>
                <TextArea value={formData.client_notes || ''} onChange={(e) => handleChange('client_notes', e.target.value)} />
              </FormGroup>
            </FormGrid>
          </CollapsibleSection>
          
          {/* 02 - Website */}
          <CollapsibleSection number="02" title="Hochzeits-Website" defaultOpen={true}>
            <FormGrid>
              <FormGroup>
                <Label>Partner 1</Label>
                <Input value={formData.partner1_name || ''} onChange={(e) => handleChange('partner1_name', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Partner 2</Label>
                <Input value={formData.partner2_name || ''} onChange={(e) => handleChange('partner2_name', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Hochzeitsdatum</Label>
                <Input type="date" value={formData.wedding_date?.split('T')[0] || ''} onChange={(e) => handleChange('wedding_date', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>URL-Slug</Label>
                <Input value={formData.slug || ''} onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
              </FormGroup>
              <FormGroup>
                <Label>Location</Label>
                <Input value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} placeholder="Hamburg" />
              </FormGroup>
              <FormGroup>
                <Label>Hashtag</Label>
                <Input value={formData.hashtag || ''} onChange={(e) => handleChange('hashtag', e.target.value)} placeholder="#AnnaUndMax" />
              </FormGroup>
              <FormGroup>
                <Label>Kontakt-E-Mail (Website)</Label>
                <Input value={formData.display_email || ''} onChange={(e) => handleChange('display_email', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Kontakt-Telefon (Website)</Label>
                <Input value={formData.display_phone || ''} onChange={(e) => handleChange('display_phone', e.target.value)} />
              </FormGroup>
            </FormGrid>
          </CollapsibleSection>
          
          {/* 03 - Einstellungen */}
          <CollapsibleSection number="03" title="Einstellungen" defaultOpen={false}>
            <FormGrid>
              <FormGroup>
                <Label>Theme</Label>
                <Select value={formData.theme || 'botanical'} onChange={(e) => handleChange('theme', e.target.value)}>
                  {Object.values(THEMES).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Status</Label>
                <Select value={formData.status || 'draft'} onChange={(e) => handleChange('status', e.target.value)}>
                  {Object.entries(PROJECT_STATUS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Admin Passwort</Label>
                <Input value={formData.admin_password || ''} onChange={(e) => handleChange('admin_password', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Custom Domain</Label>
                <Input value={formData.custom_domain || ''} onChange={(e) => handleChange('custom_domain', e.target.value.toLowerCase())} placeholder="anna-max.de" />
              </FormGroup>
            </FormGrid>
          </CollapsibleSection>
          
          {/* 04 - Links */}
          <CollapsibleSection number="04" title="Links" defaultOpen={true}>
            <LinkBox>
              <a href={`https://${baseUrl}`} target="_blank" rel="noopener noreferrer">{baseUrl}</a>
              <button onClick={() => copyToClipboard(`https://${baseUrl}`)}>Kopieren</button>
            </LinkBox>
            <LinkBox>
              <a href={`https://${baseUrl}/admin`} target="_blank" rel="noopener noreferrer">{baseUrl}/admin</a>
              <button onClick={() => copyToClipboard(`https://${baseUrl}/admin`)}>Kopieren</button>
            </LinkBox>
          </CollapsibleSection>
          
          {/* 05 - Komponenten */}
          <CollapsibleSection number="05" title="Komponenten" defaultOpen={false}>
            <ComponentListContainer>
              <ComponentListHeader>
                <span className="count">{activeCount} AKTIV</span>
                <span className="hint">☰ Drag to reorder</span>
              </ComponentListHeader>
              {componentOrder.map((compId) => {
                const comp = ALL_COMPONENTS.find(c => c.id === compId);
                if (!comp) return null;
                const isActive = formData.active_components?.includes(compId);
                return (
                  <ComponentItem
                    key={compId}
                    $active={isActive}
                    $core={comp.core}
                    $dragging={draggedItem === compId}
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
            </ComponentListContainer>
          </CollapsibleSection>
        </MainColumn>
        
        <Sidebar>
          <InfoCard>
            <InfoHeader>Projekt-Info</InfoHeader>
            <InfoBody>
              <InfoRow>
                <span className="label">Erstellt</span>
                <span className="value">{project.created_at ? new Date(project.created_at).toLocaleDateString('de-DE') : '–'}</span>
              </InfoRow>
              <InfoRow>
                <span className="label">Theme</span>
                <span className="value">{THEMES[formData.theme]?.name}</span>
              </InfoRow>
              <InfoRow>
                <span className="label">Hochzeit</span>
                <span className="value">{formData.wedding_date ? new Date(formData.wedding_date).toLocaleDateString('de-DE') : '–'}</span>
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
                  <span className="value"><a href={`mailto:${formData.client_email}`}>{formData.client_email}</a></span>
                </InfoRow>
                {formData.client_phone && (
                  <InfoRow>
                    <span className="label">Telefon</span>
                    <span className="value"><a href={`tel:${formData.client_phone}`}>{formData.client_phone}</a></span>
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
