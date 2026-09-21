import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useWedding } from '../../context/WeddingContext';
import { downloadLocationsPDF } from '../../lib/locationsPdf';
import { optimizedUrl } from '../../lib/cloudinary';

// ============================================
// ANIMATIONS
// ============================================

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
`;

const imageZoom = keyframes`
  from { transform: scale(1.1); }
  to { transform: scale(1); }
`;

const lineGrow = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const slideInFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-60px); }
  to { opacity: 1; transform: translateX(0); }
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 4rem);
`;

const Header = styled.div`
  margin-bottom: clamp(4rem, 8vw, 6rem);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  font-size: clamp(3rem, 10vw, 7rem);
  font-weight: 700;
  color: var(--editorial-black);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.9;
  max-width: 800px;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.15s;
  `}
`;

const LocationsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(6rem, 12vw, 10rem);

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

const LocationCard = styled.article`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  
  /* Alternate layout */
  &:nth-child(even) {
    grid-template-columns: 1fr 1.2fr;
    
    > *:first-child { order: 2; }
    > *:last-child { order: 1; }
  }
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    
    /* Gleiche Spezifität wie die Desktop-Regel oben, sonst bleibt jede
       zweite Location auf Mobile zweispaltig (Bild zu klein) */
    &:nth-child(even) {
      grid-template-columns: 1fr;
      > *:first-child { order: 1; }
      > *:last-child { order: 2; }
    }
  }

  @media (max-width: 768px) {
    flex: 0 0 85vw;
    max-width: 85vw;
    scroll-snap-align: center;
  }
`;

const ImageSection = styled.div`
  position: relative;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 1s ease forwards;
    animation-delay: ${p.$delay}s;
  `}
`;

const ImageFrame = styled.div`
  position: relative;
  overflow: hidden;
  background: var(--editorial-light-gray);
  
  &::before {
    content: '';
    display: block;
    padding-top: 75%;
  }
  
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(20%);
    transition: filter 0.6s ease;
    
    ${p => p.$visible && css`
      animation: ${imageZoom} 1.5s ease forwards;
    `}
  }
  
  &:hover img {
    filter: grayscale(0%);
  }
`;

const TypeBadge = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  background: var(--editorial-red);
  color: var(--editorial-white);
  padding: 1rem 1.5rem;
  font-family: var(--font-headline);
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  z-index: 2;
`;

const TimeBadge = styled.div`
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  background: var(--editorial-black);
  color: var(--editorial-white);
  padding: 0.75rem 1.25rem;
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 700;
  z-index: 2;
`;

const ContentSection = styled.div`
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${slideInFromLeft} 0.8s ease forwards;
    animation-delay: ${p.$delay + 0.2}s;
  `}
`;

const LocationNumber = styled.span`
  display: block;
  font-family: var(--font-headline);
  font-size: clamp(5rem, 12vw, 10rem);
  font-weight: 700;
  color: var(--editorial-light-gray);
  line-height: 0.7;
  margin-bottom: 1rem;
  margin-left: -0.1em;
`;

const LocationName = styled.h3`
  font-family: var(--font-headline);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  color: var(--editorial-black);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.95;
  margin-bottom: 1.5rem;
`;

const Divider = styled.div`
  width: 60px;
  height: 3px;
  background: var(--editorial-red);
  margin-bottom: 1.5rem;
  transform: scaleX(0);
  transform-origin: left;
  
  ${p => p.$visible && css`
    animation: ${lineGrow} 0.6s ease forwards;
    animation-delay: ${p.$delay + 0.4}s;
  `}
`;

const Description = styled.p`
  font-family: var(--font-serif);
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  color: var(--editorial-gray);
  line-height: 1.8;
  margin-bottom: 2rem;
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const DetailIcon = styled.span`
  font-size: 1.2rem;
  line-height: 1.5;
`;

const DetailText = styled.div`
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--editorial-black);
  line-height: 1.5;
  
  strong {
    display: block;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.7rem;
    color: var(--editorial-gray);
    margin-bottom: 0.2rem;
  }
`;

const MapButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: var(--editorial-black);
  color: var(--editorial-white);
  font-family: var(--font-headline);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--editorial-red);
    transform: translateX(5px);
  }
  
  &::after {
    content: '→';
    transition: transform 0.3s ease;
  }
  
  &:hover::after {
    transform: translateX(5px);
  }
`;

const ExportSection = styled.div`
  margin-top: 2rem;
  opacity: 0;

  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
    animation-delay: 0.2s;
  `}
`;

const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 2.5rem;
  background: var(--editorial-black);
  border: none;
  font-family: var(--font-headline);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--editorial-white);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--editorial-red);
    transform: translateY(-3px);
  }
`;


// ============================================
// COMPONENT
// ============================================

function Locations() {
  const { content, project } = useWedding();
  const locationsData = content?.locations || {};
  
  const title = locationsData.title || 'Die Locations';
  const locations = locationsData.locations || [];

  // Get couple names for PDF
  const name1 = project?.partner1_name || 'Partner1';
  const name2 = project?.partner2_name || 'Partner2';
  const coupleName = `${name1} & ${name2}`;

  const [headerVisible, setHeaderVisible] = useState(false);
  const [visibleCards, setVisibleCards] = useState([]);
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

  const defaultLocations = [
    { 
      type: 'Trauung', 
      name: 'Schloss Heidelberg', 
      description: 'Im historischen Ambiente des Schlosses geben wir uns das Ja-Wort. Die Kapelle bietet den perfekten Rahmen für diesen besonderen Moment.',
      address: 'Schlosshof 1, 69117 Heidelberg', 
      time: '14:00 Uhr', 
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
      maps_url: 'https://maps.google.com' 
    },
    { 
      type: 'Feier', 
      name: 'Orangerie im Schlosspark', 
      description: 'Nach der Trauung feiern wir in der wunderschönen Orangerie. Hohe Decken, historische Architektur und ein atemberaubender Blick in den Park.',
      address: 'Schlosspark 5, 69117 Heidelberg', 
      time: 'Ab 16:00 Uhr', 
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
      maps_url: 'https://maps.google.com' 
    },
  ];

  const items = locations.length > 0 ? locations : defaultLocations;

  // Header observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeaderVisible(true);
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Cards observer
  useEffect(() => {
    const observers = cardRefs.current.map((ref, i) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards(prev => [...new Set([...prev, i])]);
          }
        },
        { threshold: 0.2 }
      );
      if (ref) observer.observe(ref);
      return observer;
    });
    
    return () => observers.forEach(obs => obs.disconnect());
  }, [items.length]);

  const handleExport = () => {
    downloadLocationsPDF(items, coupleName);
  };

  return (
    <Section id="locations" ref={sectionRef}>
      <Container>
        <Header>
          <Eyebrow $visible={headerVisible}>Wo wir feiern</Eyebrow>
          <Title $visible={headerVisible}>{title}</Title>
          <ExportSection $visible={headerVisible}>
            <ExportButton onClick={handleExport}>
              <span>📄</span> Locations als PDF
            </ExportButton>
          </ExportSection>
        </Header>

        <LocationsGrid>
          {items.map((loc, i) => {
            const isVisible = visibleCards.includes(i);
            const delay = 0;
            
            return (
              <LocationCard key={i} ref={el => cardRefs.current[i] = el}>
                <ImageSection $visible={isVisible} $delay={delay}>
                  <ImageFrame $visible={isVisible}>
                    {loc.image && <img src={optimizedUrl.card(loc.image)} alt={loc.name} />}
                  </ImageFrame>
                  <TypeBadge>{loc.type}</TypeBadge>
                  {loc.time && <TimeBadge>{loc.time}</TimeBadge>}
                </ImageSection>
                
                <ContentSection $visible={isVisible} $delay={delay}>
                  <LocationNumber>{String(i + 1).padStart(2, '0')}</LocationNumber>
                  <LocationName>{loc.name}</LocationName>
                  <Divider $visible={isVisible} $delay={delay} />
                  
                  {loc.description && (
                    <Description>{loc.description}</Description>
                  )}
                  
                  <DetailsList>
                    {loc.address && (
                      <DetailItem>
                        <DetailIcon>📍</DetailIcon>
                        <DetailText>
                          <strong>Adresse</strong>
                          {loc.address}
                        </DetailText>
                      </DetailItem>
                    )}
                    {loc.time && (
                      <DetailItem>
                        <DetailIcon>🕐</DetailIcon>
                        <DetailText>
                          <strong>Uhrzeit</strong>
                          {loc.time}
                        </DetailText>
                      </DetailItem>
                    )}
                  </DetailsList>
                  
                  {loc.maps_url && (
                    <MapButton href={loc.maps_url} target="_blank" rel="noopener noreferrer">
                      Route anzeigen
                    </MapButton>
                  )}
                </ContentSection>
              </LocationCard>
            );
          })}
        </LocationsGrid>
      </Container>
    </Section>
  );
}

export default Locations;
