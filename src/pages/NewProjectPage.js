// src/pages/NewProjectPage.js
// Editorial Design - Minimalistisch, Bold Typography
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { createProject } from '../lib/supabase';
import { THEMES, ALL_COMPONENTS, DEFAULT_COMPONENT_ORDER, CORE_COMPONENTS } from '../lib/constants';

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
// STYLED COMPONENTS - EDITORIAL STYLE
// ============================================

const Header = styled.div`
  margin-bottom: 3rem;
  border-bottom: 3px solid ${colors.black};
  padding-bottom: 1.5rem;
`;

const BackLink = styled(Link)`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${colors.gray};
  text-decoration: none;
  display: inline-block;
  margin-bottom: 1rem;
  
  &:hover { 
    color: ${colors.black}; 
  }
`;

const Title = styled.h1`
  font-family: 'Oswald', 'Arial Narrow', sans-serif;
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: ${colors.black};
  line-height: 1;
`;

const Form = styled.form`
  max-width: 900px;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${colors.lightGray};
  padding-bottom: 0.75rem;
`;

const SectionNumber = styled.span`
  font-family: 'Oswald', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.red};
  letter-spacing: 0.05em;
`;

const SectionTitle = styled.h2`
  font-family: 'Oswald', sans-serif;
  font-size: 1.25rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${colors.black};
`;

const SectionBadge = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${colors.gray};
  background: ${colors.background};
  padding: 0.25rem 0.5rem;
  margin-left: auto;
`;

const SectionHint = styled.p`
  font-family: 'Source Serif 4', Georgia, serif;
  font-size: 0.9rem;
  font-style: italic;
  color: ${colors.gray};
  margin-bottom: 1.5rem;
  line-height: 1.5;
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
  &.full-width {
    grid-column: 1 / -1;
  }
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
  
  &::placeholder {
    color: #999;
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
  transition: border-color 0.2s ease;
  
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
  color: ${colors.black};
  cursor: pointer;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${colors.black};
  }
`;

const Hint = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: ${colors.gray};
  margin-top: 0.5rem;
`;

const GeneratedPreview = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: ${colors.black};
  color: ${colors.white};
  
  .label {
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${colors.gray};
    margin-bottom: 0.25rem;
  }
  
  .value {
    font-family: 'Oswald', sans-serif;
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: 0.02em;
  }
  
  .url {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: ${colors.red};
    margin-top: 0.5rem;
  }
`;

// ============================================
// COMPONENT LIST - EDITORIAL STYLE
// ============================================

const ComponentListContainer = styled.div`
  border: 2px solid ${colors.black};
`;

const ComponentListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${colors.black};
  color: ${colors.white};
  
  .count {
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.05em;
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
  cursor: ${p => p.$core ? 'grab' : 'pointer'};
  user-select: none;
  transition: all 0.15s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  ${p => p.$dragging && `
    opacity: 0.5;
    background: ${colors.background};
  `}
  
  &:hover {
    background: ${p => p.$active ? colors.black : colors.background};
  }
  
  .drag-handle {
    font-size: 1.1rem;
    color: ${p => p.$active ? colors.gray : colors.lightGray};
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
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
    flex-shrink: 0;
    
    ${p => p.$core && `
      border-style: dashed;
      opacity: 0.6;
    `}
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

// ============================================
// SUBMIT BUTTON - EDITORIAL STYLE
// ============================================

const SubmitButton = styled.button`
  width: 100%;
  padding: 1.25rem 2rem;
  background: ${colors.red};
  color: ${colors.white};
  border: none;
  font-family: 'Oswald', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 2rem;
  
  &:hover:not(:disabled) {
    background: ${colors.black};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RequiredNote = styled.div`
  font-family: 'Source Serif 4', Georgia, serif;
  font-size: 0.85rem;
  font-style: italic;
  color: ${colors.gray};
  margin-bottom: 2rem;
  
  span {
    color: ${colors.red};
    font-weight: 600;
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
    .replace(/[\u0300-\u036f]/g, '')
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
  
  // CRM Daten
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
  
  // Komponenten
  const [componentOrder, setComponentOrder] = useState(DEFAULT_COMPONENT_ORDER);
  const [activeComponents, setActiveComponents] = useState([...CORE_COMPONENTS]);
  
  // Drag State
  const [draggedItem, setDraggedItem] = useState(null);

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

  const toggleComponent = (compId) => {
    const comp = ALL_COMPONENTS.find(c => c.id === compId);
    if (comp?.core) return;
    
    setActiveComponents(prev => 
      prev.includes(compId) 
        ? prev.filter(id => id !== compId)
        : [...prev, compId]
    );
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!partner1Name || !partner2Name || !weddingDate || !slug) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    
    setIsSubmitting(true);
    
    const coupleNames = `${partner1Name} & ${partner2Name}`;
    
    const projectData = {
      client_name: clientName || null,
      client_email: clientEmail || null,
      client_phone: clientPhone || null,
      client_address: clientAddress || null,
      client_notes: clientNotes || null,
      partner1_name: partner1Name,
      partner2_name: partner2Name,
      couple_names: coupleNames,
      wedding_date: weddingDate,
      slug: slug,
      location: location || null,
      hashtag: hashtag || null,
      display_email: displayEmail || null,
      display_phone: displayPhone || null,
      theme: theme,
      status: 'draft',
      admin_password: adminPassword || 'wedding2025',
      custom_domain: customDomain || null,
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
  const coreCount = CORE_COMPONENTS.length;

  return (
    <Layout>
      <Header>
        <BackLink to="/projects">← Zurück zu Projekte</BackLink>
        <Title>Neues Projekt</Title>
      </Header>
      
      <RequiredNote>
        Felder mit <span>*</span> sind Pflichtfelder
      </RequiredNote>
      
      <Form onSubmit={handleSubmit}>
        
        {/* 01 - CRM */}
        <Section>
          <SectionHeader>
            <SectionNumber>01</SectionNumber>
            <SectionTitle>Kundendaten</SectionTitle>
            <SectionBadge>Intern / CRM</SectionBadge>
          </SectionHeader>
          <SectionHint>
            Diese Daten sind nur für dich sichtbar und werden nicht auf der Website angezeigt.
          </SectionHint>
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
        </Section>
        
        {/* 02 - Website Pflicht */}
        <Section>
          <SectionHeader>
            <SectionNumber>02</SectionNumber>
            <SectionTitle>Hochzeits-Website</SectionTitle>
            <SectionBadge>Öffentlich</SectionBadge>
          </SectionHeader>
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
                <GeneratedPreview>
                  <div className="label">Anzeigename</div>
                  <div className="value">{coupleNames}</div>
                  <div className="url">siwedding.de/{slug || '...'}</div>
                </GeneratedPreview>
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
            </FormGroup>
          </FormGrid>
        </Section>
        
        {/* 03 - Website Optional */}
        <Section>
          <SectionHeader>
            <SectionNumber>03</SectionNumber>
            <SectionTitle>Zusätzliche Infos</SectionTitle>
            <SectionBadge>Optional</SectionBadge>
          </SectionHeader>
          <SectionHint>
            Diese Felder können später auch vom Paar im Admin-Dashboard geändert werden.
          </SectionHint>
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
            </FormGroup>
            <FormGroup>
              <Label>Kontakt-Telefon (für Gäste)</Label>
              <Input
                value={displayPhone}
                onChange={(e) => setDisplayPhone(e.target.value)}
                placeholder="+49 123 456789"
              />
            </FormGroup>
          </FormGrid>
        </Section>
        
        {/* 04 - System */}
        <Section>
          <SectionHeader>
            <SectionNumber>04</SectionNumber>
            <SectionTitle>Einstellungen</SectionTitle>
          </SectionHeader>
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
        </Section>
        
        {/* 05 - Komponenten */}
        <Section>
          <SectionHeader>
            <SectionNumber>05</SectionNumber>
            <SectionTitle>Komponenten</SectionTitle>
          </SectionHeader>
          <SectionHint>
            Klicken zum An-/Abwählen, Ziehen zum Sortieren der Reihenfolge.
          </SectionHint>
          
          <ComponentListContainer>
            <ComponentListHeader>
              <span className="count">{activeCount} AKTIV ({coreCount} BASIS + {activeCount - coreCount} OPTIONAL)</span>
              <span className="hint">☰ Drag to reorder</span>
            </ComponentListHeader>
            
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
          </ComponentListContainer>
        </Section>
        
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wird erstellt...' : 'Projekt erstellen'}
        </SubmitButton>
        
      </Form>
    </Layout>
  );
}
