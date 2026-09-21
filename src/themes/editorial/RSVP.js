import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useWedding } from '../../context/WeddingContext';
import { useRSVP } from '../../components/shared/RSVPCore';

// ============================================
// ANIMATIONS
// ============================================

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

const lineGrow = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

const Section = styled.section`
  position: relative;
  padding: var(--section-padding) 0;
  min-height: 100vh;
  overflow: hidden;
`;

const VideoBackground = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
  }
  
  video,
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(100%);
  }
`;

const Container = styled.div`
  position: relative;
  z-index: 10;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 4rem);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: clamp(3rem, 6vw, 5rem);
`;

const Eyebrow = styled.span`
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--editorial-red);
  margin-bottom: 1.5rem;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
  `}
`;

const Title = styled.h2`
  font-family: var(--font-headline);
  font-size: clamp(3rem, 12vw, 8rem);
  font-weight: 700;
  color: var(--editorial-white);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.9;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.15s;
  `}
`;

const Description = styled.p`
  font-family: var(--font-serif);
  font-size: clamp(1rem, 1.8vw, 1.2rem);
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1.5rem;
  line-height: 1.7;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.3s;
  `}
`;

const Deadline = styled.div`
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--editorial-red);
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.4s;
  `}
`;

const Form = styled.form`
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.5s;
  `}
`;

const AttendanceToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const ToggleButton = styled.button`
  padding: 1.5rem 2rem;
  background: ${p => p.$active 
    ? (p.$yes ? 'rgba(76, 175, 80, 0.9)' : 'rgba(196, 30, 58, 0.9)') 
    : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${p => p.$active 
    ? (p.$yes ? 'rgba(76, 175, 80, 1)' : 'var(--editorial-red)') 
    : 'rgba(255, 255, 255, 0.2)'};
  color: var(--editorial-white);
  font-family: var(--font-headline);
  font-size: clamp(0.85rem, 2vw, 1.1rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: ${p => p.$yes ? 'rgba(76, 175, 80, 0.8)' : 'rgba(196, 30, 58, 0.8)'};
    border-color: ${p => p.$yes ? 'rgba(76, 175, 80, 1)' : 'var(--editorial-red)'};
    transform: translateY(-2px);
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
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
  font-family: var(--font-headline);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--editorial-white);
  margin-bottom: 0.75rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--editorial-light-gray);
  border: 2px solid transparent;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--editorial-black);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--editorial-red);
    background: var(--editorial-white);
  }
  
  &::placeholder {
    color: var(--editorial-gray);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--editorial-light-gray);
  border: 2px solid transparent;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--editorial-black);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--editorial-red);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--editorial-light-gray);
  border: 2px solid transparent;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--editorial-black);
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--editorial-red);
    background: var(--editorial-white);
  }
`;

const Divider = styled.div`
  width: 60px;
  height: 2px;
  background: var(--editorial-red);
  margin: 2rem 0;
  transform: scaleX(0);
  transform-origin: left;
  
  ${p => p.$visible && css`
    animation: ${lineGrow} 0.6s ease forwards;
    animation-delay: 0.7s;
  `}
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1.5rem 2rem;
  background: var(--editorial-black);
  color: var(--editorial-white);
  border: none;
  font-family: var(--font-headline);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: var(--editorial-red);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  ${p => p.$submitting && css`
    animation: ${pulse} 1s ease infinite;
  `}
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background: rgba(196, 30, 58, 0.1);
  border-left: 3px solid var(--editorial-red);
  color: var(--editorial-red);
  font-family: var(--font-body);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`;

const GuestSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
`;

const GuestSectionTitle = styled.h4`
  font-family: var(--font-headline);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--editorial-white);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const GuestCard = styled.div`
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &:first-of-type {
    padding-top: 0;
  }
`;

const GuestNumber = styled.span`
  display: inline-block;
  font-family: var(--font-headline);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--editorial-red);
  margin-bottom: 1rem;
`;

const GuestFields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const GuestField = styled.div``;

const SuccessState = styled.div`
  text-align: center;
  padding: clamp(3rem, 8vw, 6rem) 2rem;
  opacity: 0;
  animation: ${fadeInUp} 0.8s ease forwards;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  border: 2px solid var(--editorial-red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--editorial-red);
`;

const SuccessTitle = styled.h3`
  font-family: var(--font-headline);
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  color: var(--editorial-white);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
`;

const SuccessText = styled.p`
  font-family: var(--font-serif);
  font-size: clamp(1rem, 1.8vw, 1.2rem);
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
`;

// ============================================
// COMPONENT
// ============================================

function RSVP() {
  const { content } = useWedding();
  const rsvpData = content?.rsvp || {};
  
  const title = rsvpData.title || 'RSVP';
  const description = rsvpData.description || 'Bitte gebt uns bis zum Stichtag Bescheid, ob ihr dabei seid.';
  const deadline = rsvpData.deadline || '';
  const askDietary = rsvpData.ask_dietary !== false;
  const askAllergies = rsvpData.ask_allergies !== false;
  const customQuestion = rsvpData.custom_question || '';
  
  const {
    formData,
    submitting,
    submitted,
    error,
    updateField,
    submit,
  } = useRSVP();
  
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submit();
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Hintergrund: eigenes Bild/Video aus dem Dashboard, sonst Default-Video
  const DEFAULT_VIDEO = 'https://res.cloudinary.com/si-weddings/video/upload/v1770287435/212698_small_cibloj.mp4';
  const customMedia = rsvpData.background_media;
  const customUrl = typeof customMedia === 'string' ? customMedia : customMedia?.url;
  const isVideoUrl = (url) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || '') || /\/video\/upload\//.test(url || '');
  let bgType = 'video';
  let bgUrl = DEFAULT_VIDEO;
  if (customUrl) {
    bgUrl = customUrl;
    bgType = (typeof customMedia === 'object' && customMedia?.type) || (isVideoUrl(customUrl) ? 'video' : 'image');
  } else if (rsvpData.video_background) {
    bgUrl = rsvpData.video_background; // Legacy-Feld
  }

  return (
    <Section id="rsvp" ref={sectionRef}>
      <VideoBackground>
        {bgType === 'image' ? (
          <img src={bgUrl} alt="" />
        ) : (
          <video key={bgUrl} autoPlay muted loop playsInline>
            <source src={bgUrl} />
          </video>
        )}
      </VideoBackground>
      
      <Container>
        <Header>
          <Eyebrow $visible={visible}>Seid ihr dabei?</Eyebrow>
          <Title $visible={visible}>{title}</Title>
          {!submitted && <Description $visible={visible}>{description}</Description>}
          {!submitted && deadline && (
            <Deadline $visible={visible}>
              Bitte antwortet bis {formatDeadline(deadline)}
            </Deadline>
          )}
        </Header>
        
        {submitted ? (
          <SuccessState>
            <SuccessIcon>{formData.attending ? '✓' : '✗'}</SuccessIcon>
            <SuccessTitle>{formData.attending ? 'Danke!' : 'Schade!'}</SuccessTitle>
            <SuccessText>
              {formData.attending 
                ? 'Vielen Dank! Wir freuen uns auf euch!' 
                : 'Schade, dass ihr nicht dabei sein könnt. Danke für die Rückmeldung!'}
            </SuccessText>
          </SuccessState>
        ) : (
        <Form $visible={visible} onSubmit={handleSubmit}>
          <AttendanceToggle>
            <ToggleButton
              type="button"
              $active={formData.attending === true}
              $yes
              onClick={() => updateField('attending', true)}
            >
              Ja, ich bin dabei
            </ToggleButton>
            <ToggleButton
              type="button"
              $active={formData.attending === false}
              onClick={() => updateField('attending', false)}
            >
              Leider nicht
            </ToggleButton>
          </AttendanceToggle>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FormGrid>
            <FormGroup>
              <Label>Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Vor- und Nachname"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>E-Mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="email@beispiel.de"
                required
              />
            </FormGroup>
            
            {formData.attending && (
              <>
                <FormGroup>
                  <Label>Anzahl Personen</Label>
                  <Select
                    value={formData.persons}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value);
                      updateField('persons', newCount);
                      // Initialize guests array if needed
                      const currentGuests = formData.guests || [];
                      if (newCount > currentGuests.length) {
                        const newGuests = [...currentGuests];
                        for (let i = currentGuests.length; i < newCount; i++) {
                          newGuests.push({ name: '', dietary: '', allergies: '' });
                        }
                        updateField('guests', newGuests);
                      } else {
                        updateField('guests', currentGuests.slice(0, newCount));
                      }
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Personen'}</option>
                    ))}
                  </Select>
                </FormGroup>
                
                {/* Bei 1 Person: einfache Felder */}
                {formData.persons === 1 && (
                  <>
                    {askDietary && (
                      <FormGroup>
                        <Label>Ernährung</Label>
                        <Select
                          value={formData.dietary}
                          onChange={(e) => updateField('dietary', e.target.value)}
                        >
                          <option value="">Keine besonderen Wünsche</option>
                          <option value="vegetarisch">Vegetarisch</option>
                          <option value="vegan">Vegan</option>
                          <option value="andere">Andere</option>
                        </Select>
                      </FormGroup>
                    )}
                    
                    {askAllergies && (
                      <FormGroup className="full-width">
                        <Label>Allergien / Unverträglichkeiten</Label>
                        <Input
                          type="text"
                          value={formData.allergies}
                          onChange={(e) => updateField('allergies', e.target.value)}
                          placeholder="z.B. Nüsse, Laktose..."
                        />
                      </FormGroup>
                    )}
                  </>
                )}
                
                {/* Bei mehreren Personen: Felder pro Person */}
                {formData.persons > 1 && (askDietary || askAllergies) && (
                  <FormGroup className="full-width">
                    <GuestSection>
                      <GuestSectionTitle>Angaben pro Person</GuestSectionTitle>
                      {Array.from({ length: formData.persons }, (_, i) => {
                        const guest = formData.guests?.[i] || { name: '', dietary: '', allergies: '' };
                        const updateGuest = (field, value) => {
                          const newGuests = [...(formData.guests || [])];
                          if (!newGuests[i]) newGuests[i] = { name: '', dietary: '', allergies: '' };
                          newGuests[i] = { ...newGuests[i], [field]: value };
                          updateField('guests', newGuests);
                        };
                        
                        return (
                          <GuestCard key={i}>
                            <GuestNumber>Person {i + 1}{i === 0 ? ' (Hauptgast)' : ''}</GuestNumber>
                            <GuestFields>
                              {i > 0 && (
                                <GuestField>
                                  <Label>Name</Label>
                                  <Input
                                    type="text"
                                    value={guest.name}
                                    onChange={(e) => updateGuest('name', e.target.value)}
                                    placeholder={`Name Person ${i + 1}`}
                                  />
                                </GuestField>
                              )}
                              {askDietary && (
                                <GuestField>
                                  <Label>Ernährung</Label>
                                  <Select
                                    value={i === 0 ? formData.dietary : guest.dietary}
                                    onChange={(e) => i === 0 
                                      ? updateField('dietary', e.target.value)
                                      : updateGuest('dietary', e.target.value)
                                    }
                                  >
                                    <option value="">Keine besonderen Wünsche</option>
                                    <option value="vegetarisch">Vegetarisch</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="andere">Andere</option>
                                  </Select>
                                </GuestField>
                              )}
                              {askAllergies && (
                                <GuestField>
                                  <Label>Allergien</Label>
                                  <Input
                                    type="text"
                                    value={i === 0 ? formData.allergies : guest.allergies}
                                    onChange={(e) => i === 0
                                      ? updateField('allergies', e.target.value)
                                      : updateGuest('allergies', e.target.value)
                                    }
                                    placeholder="z.B. Nüsse, Laktose..."
                                  />
                                </GuestField>
                              )}
                            </GuestFields>
                          </GuestCard>
                        );
                      })}
                    </GuestSection>
                  </FormGroup>
                )}
              </>
            )}
            
            {customQuestion && (
              <FormGroup className="full-width">
                <Label>{customQuestion}</Label>
                <TextArea
                  value={formData.customAnswer || ''}
                  onChange={(e) => updateField('customAnswer', e.target.value)}
                  placeholder="Deine Antwort..."
                />
              </FormGroup>
            )}

            <FormGroup className="full-width">
              <Label>Nachricht (optional)</Label>
              <TextArea
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="Möchtet ihr uns noch etwas mitteilen?"
              />
            </FormGroup>
          </FormGrid>
          
          <Divider $visible={visible} />
          
          <SubmitButton type="submit" disabled={submitting} $submitting={submitting}>
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </SubmitButton>
        </Form>
        )}
      </Container>
    </Section>
  );
}

export default RSVP;
