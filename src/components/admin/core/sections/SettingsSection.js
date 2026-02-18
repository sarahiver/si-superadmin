// core/sections/SettingsSection.js
// Bearbeitbare Website-Felder für das Paar
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAdmin } from '../AdminContext';
import { updateProject } from '../../../../lib/supabase';
import PhoneInput from '../../../shared/PhoneInput';

// ============================================
// STYLED COMPONENTS
// ============================================

const Section = styled.section`
  padding: 1.5rem;
  max-width: 600px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Hint = styled.span`
  display: block;
  font-size: 0.75rem;
  color: #888;
  font-weight: 400;
  margin-top: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #333;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const SaveButton = styled.button`
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #333;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  padding: 1rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  color: #155724;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 2rem 0;
`;

const SectionLabel = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  margin-bottom: 1rem;
`;

const EmojiGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const EmojiBtn = styled.button`
  width: 44px;
  height: 44px;
  font-size: 1.4rem;
  border-radius: 8px;
  border: 2px solid ${p => p.$active ? '#1a1a1a' : '#e0e0e0'};
  background: ${p => p.$active ? '#f0f0f0' : '#fff'};
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: #1a1a1a;
    background: #f5f5f5;
  }
`;

const FaviconPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8f8f8;
  border-radius: 8px;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #666;
`;

const FaviconIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #0a0a0a;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
`;

const EMOJI_SUGGESTIONS = ['💍', '🌸', '🤍', '✨', '🕊️', '🌿', '🥂', '🌹', '💐', '🎀', '🪷', '⚘'];

// ============================================
// COMPONENT
// ============================================

export default function SettingsSection() {
  const { project, projectId, showFeedback } = useAdmin();
  
  // Local state for form fields
  const [location, setLocation] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [displayEmail, setDisplayEmail] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [faviconEmoji, setFaviconEmoji] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Initialize from project
  useEffect(() => {
    if (project) {
      setLocation(project.location || '');
      setHashtag(project.hashtag || '');
      setDisplayEmail(project.display_email || '');
      setDisplayPhone(project.display_phone || '');
      setFaviconEmoji(project.favicon_emoji || '');
    }
  }, [project]);
  
  const handleSave = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    setShowSuccess(false);
    
    try {
      const { error } = await updateProject(projectId, {
        location: location || null,
        hashtag: hashtag || null,
        display_email: displayEmail || null,
        display_phone: displayPhone || null,
        favicon_emoji: faviconEmoji || null,
      });
      
      if (error) {
        showFeedback('error', 'Fehler beim Speichern: ' + error.message);
      } else {
        setShowSuccess(true);
        showFeedback('success', 'Einstellungen gespeichert!');
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      showFeedback('error', 'Fehler beim Speichern');
    }
    
    setIsSaving(false);
  };
  
  return (
    <Section>
      <Title>⚙️ Website-Einstellungen</Title>
      <Description>
        Hier könnt ihr einige Informationen anpassen, die auf eurer Hochzeitswebsite angezeigt werden.
      </Description>
      
      {showSuccess && (
        <SuccessMessage>
          ✓ Änderungen gespeichert!
        </SuccessMessage>
      )}

      <SectionLabel>Browser-Tab Icon</SectionLabel>

      <FormGroup>
        <Label>
          Favicon-Emoji
          <Hint>Wird als kleines Icon im Browser-Tab angezeigt. Wählt ein Emoji oder gebt eins ein.</Hint>
        </Label>
        <EmojiGrid>
          {EMOJI_SUGGESTIONS.map(emoji => (
            <EmojiBtn
              key={emoji}
              type="button"
              $active={faviconEmoji === emoji}
              onClick={() => setFaviconEmoji(faviconEmoji === emoji ? '' : emoji)}
              title={emoji}
            >
              {emoji}
            </EmojiBtn>
          ))}
        </EmojiGrid>
        <Input
          type="text"
          value={faviconEmoji}
          onChange={(e) => setFaviconEmoji(e.target.value)}
          placeholder="Emoji eingeben oder oben auswählen…"
          maxLength={4}
          style={{ fontSize: '1.3rem' }}
        />
        {faviconEmoji && (
          <FaviconPreview>
            <FaviconIcon>{faviconEmoji}</FaviconIcon>
            <span>So sieht euer Tab-Icon aus</span>
          </FaviconPreview>
        )}
      </FormGroup>

      <Divider />
      
      <SectionLabel>Anzeige auf der Website</SectionLabel>
      
      <FormGroup>
        <Label>
          Location / Ort
          <Hint>Wird im Hero-Bereich angezeigt (z.B. "Hamburg" oder "Schloss Neuschwanstein")</Hint>
        </Label>
        <Input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="z.B. Hamburg"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>
          Hashtag
          <Hint>Euer Hochzeits-Hashtag für Social Media (wird im Footer angezeigt)</Hint>
        </Label>
        <Input
          type="text"
          value={hashtag}
          onChange={(e) => setHashtag(e.target.value)}
          placeholder="z.B. #AnnaUndMax2025"
        />
      </FormGroup>
      
      <Divider />
      
      <SectionLabel>Kontaktdaten für Gäste</SectionLabel>
      
      <FormGroup>
        <Label>
          Kontakt-E-Mail
          <Hint>Diese E-Mail wird auf der Kontakt-Seite angezeigt</Hint>
        </Label>
        <Input
          type="email"
          value={displayEmail}
          onChange={(e) => setDisplayEmail(e.target.value)}
          placeholder="z.B. hochzeit@anna-max.de"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>
          Kontakt-Telefon
          <Hint>Diese Telefonnummer wird auf der Kontakt-Seite angezeigt</Hint>
        </Label>
        <PhoneInput
          value={displayPhone}
          onChange={(val) => setDisplayPhone(val)}
          placeholder="176 1234567"
        />
      </FormGroup>
      
      <SaveButton onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Speichern...' : 'Änderungen speichern'}
      </SaveButton>
    </Section>
  );
}


// ============================================
// STYLED COMPONENTS
// ============================================

const Section = styled.section`
  padding: 1.5rem;
  max-width: 600px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Hint = styled.span`
  display: block;
  font-size: 0.75rem;
  color: #888;
  font-weight: 400;
  margin-top: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #333;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const SaveButton = styled.button`
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #333;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  padding: 1rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  color: #155724;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 2rem 0;
`;

const SectionLabel = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  margin-bottom: 1rem;
`;

// ============================================
// COMPONENT
// ============================================

export default function SettingsSection() {
  const { project, projectId, showFeedback } = useAdmin();
  
  // Local state for form fields
  const [location, setLocation] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [displayEmail, setDisplayEmail] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Initialize from project
  useEffect(() => {
    if (project) {
      setLocation(project.location || '');
      setHashtag(project.hashtag || '');
      setDisplayEmail(project.display_email || '');
      setDisplayPhone(project.display_phone || '');
    }
  }, [project]);
  
  const handleSave = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    setShowSuccess(false);
    
    try {
      const { error } = await updateProject(projectId, {
        location: location || null,
        hashtag: hashtag || null,
        display_email: displayEmail || null,
        display_phone: displayPhone || null,
      });
      
      if (error) {
        showFeedback('error', 'Fehler beim Speichern: ' + error.message);
      } else {
        setShowSuccess(true);
        showFeedback('success', 'Einstellungen gespeichert!');
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      showFeedback('error', 'Fehler beim Speichern');
    }
    
    setIsSaving(false);
  };
  
  return (
    <Section>
      <Title>⚙️ Website-Einstellungen</Title>
      <Description>
        Hier könnt ihr einige Informationen anpassen, die auf eurer Hochzeitswebsite angezeigt werden.
      </Description>
      
      {showSuccess && (
        <SuccessMessage>
          ✓ Änderungen gespeichert!
        </SuccessMessage>
      )}
      
      <SectionLabel>Anzeige auf der Website</SectionLabel>
      
      <FormGroup>
        <Label>
          Location / Ort
          <Hint>Wird im Hero-Bereich angezeigt (z.B. "Hamburg" oder "Schloss Neuschwanstein")</Hint>
        </Label>
        <Input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="z.B. Hamburg"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>
          Hashtag
          <Hint>Euer Hochzeits-Hashtag für Social Media (wird im Footer angezeigt)</Hint>
        </Label>
        <Input
          type="text"
          value={hashtag}
          onChange={(e) => setHashtag(e.target.value)}
          placeholder="z.B. #AnnaUndMax2025"
        />
      </FormGroup>
      
      <Divider />
      
      <SectionLabel>Kontaktdaten für Gäste</SectionLabel>
      
      <FormGroup>
        <Label>
          Kontakt-E-Mail
          <Hint>Diese E-Mail wird auf der Kontakt-Seite angezeigt</Hint>
        </Label>
        <Input
          type="email"
          value={displayEmail}
          onChange={(e) => setDisplayEmail(e.target.value)}
          placeholder="z.B. hochzeit@anna-max.de"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>
          Kontakt-Telefon
          <Hint>Diese Telefonnummer wird auf der Kontakt-Seite angezeigt</Hint>
        </Label>
        <PhoneInput
          value={displayPhone}
          onChange={(val) => setDisplayPhone(val)}
          placeholder="176 1234567"
        />
      </FormGroup>
      
      <SaveButton onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Speichern...' : 'Änderungen speichern'}
      </SaveButton>
    </Section>
  );
}
