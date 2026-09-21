import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useWedding } from '../../context/WeddingContext';
import { optimizedUrl } from '../../lib/cloudinary';

// ============================================
// ANIMATIONS
// ============================================

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

const Section = styled.section`
  padding: var(--section-padding) 0;
  background: var(--editorial-white);
  overflow: hidden;
`;

const Container = styled.div`
  max-width: 1000px;
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
  font-size: clamp(2.5rem, 10vw, 5rem);
  font-weight: 700;
  color: var(--editorial-black);
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
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  font-style: italic;
  color: var(--editorial-gray);
  margin-top: 1.5rem;
  line-height: 1.7;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.3s;
  `}
`;

const WitnessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.4s;
  `}

  @media (max-width: 768px) {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 0.75rem;
    margin: 0 calc(-1 * var(--section-padding-x, 24px));
    padding: 0 var(--section-padding-x, 24px);
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

const WitnessCard = styled.div`
  background: var(--editorial-light-gray);
  padding: 2.5rem;
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    flex: 0 0 80vw;
    max-width: 80vw;
    scroll-snap-align: center;
  }
`;

const WitnessImage = styled.div`
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  background: var(--editorial-white);
  border: 3px solid var(--editorial-red);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(30%);
    transition: filter 0.3s ease;
  }
  
  ${WitnessCard}:hover & img {
    filter: grayscale(0%);
  }
`;

const WitnessPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
`;

const WitnessFor = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: var(--editorial-red);
  color: var(--editorial-white);
  font-family: var(--font-body);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
`;

const WitnessName = styled.h3`
  font-family: var(--font-headline);
  font-size: 1.3rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--editorial-black);
  margin-bottom: 1rem;
`;

const WitnessInfo = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const WitnessLink = styled.a`
  display: inline-block;
  padding: 0.5rem 1rem;
  font-family: var(--font-headline);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--editorial-gray);
  text-decoration: none;
  border: 1px solid rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--editorial-red);
    border-color: var(--editorial-red);
    color: var(--editorial-white);
  }
`;

const Note = styled.p`
  text-align: center;
  font-family: var(--font-serif);
  font-size: 0.95rem;
  font-style: italic;
  color: var(--editorial-gray);
  margin-top: 3rem;
  padding: 1.5rem;
  background: var(--editorial-light-gray);
  border-left: 3px solid var(--editorial-red);
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.5s;
  `}
`;

// ============================================
// COMPONENT
// ============================================

function ContactWitnesses() {
  const { content } = useWedding();
  const witnessData = content?.witnesses || {};

  const title = witnessData.title || 'Trauzeug:innen';
  const description = witnessData.description || 'Für Überraschungen, Fragen oder geheime Absprachen – wendet euch an unsere Trauzeug:innen.';
  const witnesses = witnessData.persons || [];
  const note = witnessData.note || '';


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

  // Keine Defaults - nur rendern wenn Personen vorhanden
  if (witnesses.length === 0) return null;

  const getWhatsAppNumber = (person) => (person.whatsapp || person.phone || '').replace(/\D/g, '');

  return (
    <Section id="witnesses" ref={sectionRef}>
      <Container>
        <Header>
          <Eyebrow $visible={visible}>Eure Ansprechpartner</Eyebrow>
          <Title $visible={visible}>{title}</Title>
          <Description $visible={visible}>{description}</Description>
        </Header>

        <WitnessGrid $visible={visible}>
          {witnesses.map((witness, i) => (
            <WitnessCard key={i}>
              <WitnessImage>
                {witness.image ? (
                  <img src={optimizedUrl.avatar(witness.image)} alt={witness.name} />
                ) : (
                  <WitnessPlaceholder>💍</WitnessPlaceholder>
                )}
              </WitnessImage>

              {witness.role && (
                <WitnessFor>{witness.role}</WitnessFor>
              )}
              <WitnessName>{witness.name}</WitnessName>

              <WitnessInfo>
                {getWhatsAppNumber(witness) && (
                  <WitnessLink
                    href={`https://wa.me/${getWhatsAppNumber(witness)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </WitnessLink>
                )}
                {witness.phone && (
                  <WitnessLink href={`tel:${witness.phone.replace(/\s/g, '')}`}>
                    Anrufen
                  </WitnessLink>
                )}
                {witness.email && (
                  <WitnessLink href={`mailto:${witness.email}`}>
                    E-Mail
                  </WitnessLink>
                )}
              </WitnessInfo>
            </WitnessCard>
          ))}
        </WitnessGrid>

        {note && (
          <Note $visible={visible}>{note}</Note>
        )}
      </Container>
    </Section>
  );
}

export default ContactWitnesses;
