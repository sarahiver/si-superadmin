// src/pages/NewProjectPage.js
// Komplett neu gebaut mit CRM-Trennung und Drag & Drop Komponenten
import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { createProject } from '../lib/supabase';
import { THEMES } from '../lib/constants';

// ============================================
// KOMPONENTEN DEFINITION
// ============================================

const ALL_COMPONENTS = [
  // Core (immer aktiv, nicht abwählbar)
  { id: 'hero', name: 'Hero', core: true },
  { id: 'countdown', name: 'Countdown', core: true },
  { id: 'lovestory', name: 'Love Story', core: true },
  { id: 'rsvp', name: 'RSVP', core: true },
  // Optional
  { id: 'timeline', name: 'Tagesablauf', core: false },
  { id: 'locations', name: 'Locations', core: false },
  { id: 'directions', name: 'Anfahrt', core: false },
  { id: 'accommodations', name: 'Unterkünfte', core: false },
  { id: 'dresscode', name: 'Dresscode', core: false },
  { id: 'gallery', name: 'Galerie', core: false },
  { id: 'photoupload', name: 'Foto-Upload', core: false },
  { id: 'guestbook', name: 'Gästebuch', core: false },
  { id: 'musicwishes', name: 'Musikwünsche', core: false },
  { id: 'gifts', name: 'Geschenke', core: false },
  { id: 'witnesses', name: 'Trauzeugen', core: false },
  { id: 'faq', name: 'FAQ', core: false },
  { id: 'weddingabc', name: 'Hochzeits-ABC', core: false },
  { id: 'contact', name: 'Kontakt', core: false },
];

const DEFAULT_ORDER = ALL_COMPONENTS.map(c => c.id);

// ============================================
// STYLED COMPONENTS
// ============================================

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
  max-width: 800px;
`;

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
  
  .icon {
    font-size: 1.25rem;
  }
  
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
  
  &::placeholder {
    color: #999;
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

const GeneratedValue = styled.div`
  font-size: 0.8rem;
  color: #1A1A1A;
  background: #F0F0F0;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
`;

// ============================================
// DRAG & DROP KOMPONENTEN
// ============================================

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
  cursor: ${p => p.$core ? 'grab' : 'pointer'};
  user-select: none;
  transition: all 0.15s ease;
  
  ${p => p.$dragging && `
    opacity: 0.5;
    transform: scale(1.02);
  `}
  
  &:hover {
    border-color: #1A1A1A;
  }
  
  .drag-handle {
    cursor: grab;
    color: ${p => p.$active ? 'rgba(255,255,255,0.5)' : '#999'};
    font-size: 1rem;
    
    &:active {
      cursor: grabbing;
    }
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
    flex-shrink: 0;
    
    ${p => p.$core && `
      opacity: 0.5;
    `}
  }
  
  .name {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
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
  align-items: center;
  padding: 0.75rem 1rem;
  background: #F5F5F5;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #666;
  
  strong {
    color: #1A1A1A;
  }
`;

// ============================================
// SUBMIT BUTTON
// ============================================

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  background: #1A1A1A;
  color: #fff;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: #333;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RequiredNote = styled.div`
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 1.5rem;
  
  span {
    color: #DC2626;
  }
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateSlug = (name1, name2) => {
  if (!name1 || !name2) return '';
  const combined = `${name1}-${name2}`;
  return combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Umlaute entfernen
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const generateHashtag = (name1, name2) => {
  if (!name1 || !name2) return '';
  const clean1 = name1.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
  const clean2 = name2.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
  return `#${clean1}Und${clean2}`;
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // CRM Daten (intern)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  
  // Website Daten (Pflicht)
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  
  // Website Daten (Optional)
  const [location, setLocation] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [hashtagManuallyEdited, setHashtagManuallyEdited] = useState(false);
  const [displayEmail, setDisplayEmail] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  
  // System
  const [theme, setTheme] = useState('botanical');
  const [adminPassword, setAdminPassword] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  
  // Komponenten (Order + Active in einem)
  const [componentOrder, setComponentOrder] = useState(DEFAULT_ORDER);
  const [activeComponents, setActiveComponents] = useState(
    ALL_COMPONENTS.filter(c => c.core).map(c => c.id)
  );
  
  // Drag State
  const [draggedItem, setDraggedItem] = useState(null);

  // Auto-generate slug when names change
  const handlePartner1Change = (value) => {
    setPartner1Name(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value, partner2Name));
    }
    if (!hashtagManuallyEdited) {
      setHashtag(generateHashtag(value, partner2Name));
    }
  };

  const handlePartner2Change = (value) => {
    setPartner2Name(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(partner1Name, value));
    }
    if (!hashtagManuallyEdited) {
      setHashtag(generateHashtag(partner1Name, value));
    }
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleHashtagChange = (value) => {
    setHashtagManuallyEdited(true);
    setHashtag(value);
  };

  // Component toggle
  const toggleComponent = (compId) => {
    const comp = ALL_COMPONENTS.find(c => c.id === compId);
    if (comp?.core) return; // Core components can't be toggled
    
    setActiveComponents(prev => 
      prev.includes(compId) 
        ? prev.filter(id => id !== compId)
        : [...prev, compId]
    );
  };

  // Drag and Drop
  const handleDragStart = (e, compId) => {
    setDraggedItem(compId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, compId) => {
    e.preventDefault();
    if (draggedItem === compId) return;
    
    const newOrder = [...componentOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(compId);
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    setComponentOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!partner1Name || !partner2Name || !weddingDate || !slug) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    
    setIsSubmitting(true);
    
    const coupleNames = `${partner1Name} & ${partner2Name}`;
    
    const projectData = {
      // CRM
      client_name: clientName || null,
      client_email: clientEmail || null,
      client_phone: clientPhone || null,
      client_address: clientAddress || null,
      client_notes: clientNotes || null,
      
      // Website Pflicht
      partner1_name: partner1Name,
      partner2_name: partner2Name,
      couple_names: coupleNames,
      wedding_date: weddingDate,
      slug: slug,
      
      // Website Optional
      location: location || null,
      hashtag: hashtag || null,
      display_email: displayEmail || null,
      display_phone: displayPhone || null,
      
      // System
      theme: theme,
      status: 'draft',
      admin_password: adminPassword || 'wedding2025',
      custom_domain: customDomain || null,
      
      // Komponenten
      active_components: activeComponents,
      component_order: componentOrder,
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

  const coupleNames = partner1Name && partner2Name 
    ? `${partner1Name} & ${partner2Name}` 
    : '';
    
  const activeCount = activeComponents.length;
  const coreCount = ALL_COMPONENTS.filter(c => c.core).length;
  const optionalActiveCount = activeCount - coreCount;

  return (
    <Layout>
      <Header>
        <BackLink to="/projects">← Zurück zu Projekte</BackLink>
        <Title>Neues Projekt anlegen</Title>
      </Header>
      
      <RequiredNote>
        Felder mit <span>*</span> sind Pflichtfelder
      </RequiredNote>
      
      <Form onSubmit={handleSubmit}>
        
        {/* ============================================ */}
        {/* CRM DATEN */}
        {/* ============================================ */}
        <Section>
          <SectionHeader>
            <span className="icon">👤</span>
            <h2>Kundendaten</h2>
            <span className="badge">Intern / CRM</span>
          </SectionHeader>
          <SectionBody>
            <Hint style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
              Diese Daten sind nur für dich sichtbar und werden nicht auf der Website angezeigt.
            </Hint>
            <FormGrid>
              <FormGroup className="full-width">
                <Label>Kundenname</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="z.B. Anna Müller & Max Schmidt"
                />
              </FormGroup>
              <FormGroup>
                <Label>E-Mail (privat)</Label>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="anna.mueller@gmail.com"
                />
              </FormGroup>
              <FormGroup>
                <Label>Telefon (privat)</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+49 171 1234567"
                />
              </FormGroup>
              <FormGroup className="full-width">
                <Label>Adresse</Label>
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Musterstraße 1, 20095 Hamburg"
                />
              </FormGroup>
              <FormGroup className="full-width">
                <Label>Notizen</Label>
                <TextArea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Interne Notizen zum Projekt..."
                />
              </FormGroup>
            </FormGrid>
          </SectionBody>
        </Section>
        
        {/* ============================================ */}
        {/* WEBSITE DATEN - PFLICHT */}
        {/* ============================================ */}
        <Section>
          <SectionHeader>
            <span className="icon">💒</span>
            <h2>Hochzeits-Website</h2>
            <span className="badge">Öffentlich</span>
          </SectionHeader>
          <SectionBody>
            <FormGrid>
              <FormGroup>
                <Label>Partner 1 * (Vorname)</Label>
                <Input
                  value={partner1Name}
                  onChange={(e) => handlePartner1Change(e.target.value)}
                  placeholder="Anna"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Partner 2 * (Vorname)</Label>
                <Input
                  value={partner2Name}
                  onChange={(e) => handlePartner2Change(e.target.value)}
                  placeholder="Max"
                  required
                />
              </FormGroup>
              
              {coupleNames && (
                <FormGroup className="full-width">
                  <Label>Anzeigename (generiert)</Label>
                  <GeneratedValue>{coupleNames}</GeneratedValue>
                </FormGroup>
              )}
              
              <FormGroup>
                <Label>Hochzeitsdatum *</Label>
                <Input
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  required
                />
                <Hint>Wird für Countdown verwendet</Hint>
              </FormGroup>
              <FormGroup>
                <Label>URL-Slug *</Label>
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="anna-max"
                  required
                />
                <Hint>siwedding.de/{slug || 'slug'}</Hint>
              </FormGroup>
            </FormGrid>
          </SectionBody>
        </Section>
        
        {/* ============================================ */}
        {/* WEBSITE DATEN - OPTIONAL */}
        {/* ============================================ */}
        <Section>
          <SectionHeader>
            <span className="icon">✨</span>
            <h2>Zusätzliche Website-Infos</h2>
            <span className="badge">Optional</span>
          </SectionHeader>
          <SectionBody>
            <Hint style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
              Diese Felder können später auch vom Paar im Admin-Dashboard geändert werden.
            </Hint>
            <FormGrid>
              <FormGroup>
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hamburg"
                />
                <Hint>Wird im Hero angezeigt</Hint>
              </FormGroup>
              <FormGroup>
                <Label>Hashtag</Label>
                <Input
                  value={hashtag}
                  onChange={(e) => handleHashtagChange(e.target.value)}
                  placeholder="#AnnaUndMax"
                />
                <Hint>Wird im Footer angezeigt</Hint>
              </FormGroup>
              <FormGroup>
                <Label>Kontakt-E-Mail (für Gäste)</Label>
                <Input
                  type="email"
                  value={displayEmail}
                  onChange={(e) => setDisplayEmail(e.target.value)}
                  placeholder="hochzeit@anna-max.de"
                />
                <Hint>Für die Kontakt-Sektion</Hint>
              </FormGroup>
              <FormGroup>
                <Label>Kontakt-Telefon (für Gäste)</Label>
                <Input
                  value={displayPhone}
                  onChange={(e) => setDisplayPhone(e.target.value)}
                  placeholder="+49 123 456789"
                />
                <Hint>Für die Kontakt-Sektion</Hint>
              </FormGroup>
            </FormGrid>
          </SectionBody>
        </Section>
        
        {/* ============================================ */}
        {/* SYSTEM */}
        {/* ============================================ */}
        <Section>
          <SectionHeader>
            <span className="icon">⚙️</span>
            <h2>Einstellungen</h2>
          </SectionHeader>
          <SectionBody>
            <FormGrid>
              <FormGroup>
                <Label>Theme *</Label>
                <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                  {Object.values(THEMES).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Admin Passwort</Label>
                <Input
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="wedding2025"
                />
                <Hint>Für /{slug || 'slug'}/admin</Hint>
              </FormGroup>
              <FormGroup className="full-width">
                <Label>Custom Domain</Label>
                <Input
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                  placeholder="anna-max.de"
                />
                <Hint>Optional: Eigene Domain statt siwedding.de/{slug}</Hint>
              </FormGroup>
            </FormGrid>
          </SectionBody>
        </Section>
        
        {/* ============================================ */}
        {/* KOMPONENTEN */}
        {/* ============================================ */}
        <Section>
          <SectionHeader>
            <span className="icon">📑</span>
            <h2>Komponenten</h2>
          </SectionHeader>
          <SectionBody>
            <ComponentInfo>
              <span>
                <strong>{activeCount}</strong> aktiv ({coreCount} Basis + {optionalActiveCount} optional)
              </span>
              <span>☰ Ziehen zum Sortieren</span>
            </ComponentInfo>
            
            <ComponentList>
              {componentOrder.map((compId) => {
                const comp = ALL_COMPONENTS.find(c => c.id === compId);
                if (!comp) return null;
                
                const isActive = activeComponents.includes(compId);
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
                    <span className="checkbox">
                      {isActive && '✓'}
                    </span>
                    <span className="name">{comp.name}</span>
                    {comp.core && <span className="badge">Basis</span>}
                  </ComponentItem>
                );
              })}
            </ComponentList>
          </SectionBody>
        </Section>
        
        {/* ============================================ */}
        {/* SUBMIT */}
        {/* ============================================ */}
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wird erstellt...' : 'Projekt erstellen'}
        </SubmitButton>
        
      </Form>
    </Layout>
  );
}
