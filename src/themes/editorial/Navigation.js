import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useWedding } from '../../context/WeddingContext';

// ============================================
// ANIMATIONS
// ============================================

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const staggerIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateX(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1.5rem clamp(1.5rem, 5vw, 4rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  
  ${p => p.$scrolled && css`
    background: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem clamp(1.5rem, 5vw, 4rem);
  `}
`;

const Logo = styled.a`
  font-family: var(--font-headline);
  font-size: clamp(1rem, 2vw, 1.3rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--editorial-white);
  opacity: 0;
  animation: ${fadeIn} 0.6s ease forwards;
  animation-delay: 0.3s;
  
  &:hover {
    color: var(--editorial-red);
  }
`;

const MenuButton = styled.button`
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  position: relative;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1001;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease forwards;
  animation-delay: 0.5s;
  
  &:hover span {
    background: var(--editorial-red);
  }
`;

const MenuLine = styled.span`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--editorial-white);
  transition: all 0.3s ease;
  
  &:nth-child(1) {
    top: 12px;
    ${p => p.$open && css`
      top: 19px;
      transform: translateX(-50%) rotate(45deg);
    `}
  }
  
  &:nth-child(2) {
    top: 19px;
    ${p => p.$open && css`
      opacity: 0;
      transform: translateX(-50%) scaleX(0);
    `}
  }
  
  &:nth-child(3) {
    top: 26px;
    ${p => p.$open && css`
      top: 19px;
      transform: translateX(-50%) rotate(-45deg);
    `}
  }
`;

const MenuLabel = styled.span`
  position: absolute;
  right: 50px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-body);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--editorial-white);
  white-space: nowrap;
  transition: opacity 0.3s ease;
  
  ${p => p.$open && css`
    opacity: 0;
  `}
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  
  ${p => p.$open && css`
    opacity: 1;
    visibility: visible;
  `}
`;

const MenuPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: min(400px, 85vw);
  height: 100vh;
  background: var(--editorial-black);
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  
  ${p => p.$open && css`
    transform: translateX(0);
  `}
`;

const MenuContent = styled.div`
  padding: 6rem 2.5rem 3rem;
  min-height: 100%;
  display: flex;
  flex-direction: column;
`;

const MenuItems = styled.ul`
  flex: 1;
`;

const MenuItem = styled.li`
  opacity: 0;
  transform: translateX(30px);
  
  ${p => p.$open && css`
    animation: ${staggerIn} 0.5s ease forwards;
    animation-delay: ${p.$delay}s;
  `}
`;

const MenuLink = styled.a`
  display: block;
  font-family: var(--font-headline);
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--editorial-white);
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--editorial-red);
    padding-left: 1rem;
  }
`;

const MenuFooter = styled.div`
  margin-top: auto;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const MenuFooterText = styled.p`
  font-family: var(--font-serif);
  font-size: 0.9rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
`;

// ============================================
// COMPONENT
// ============================================

function Navigation() {
  const { coupleNames, isComponentActive, project } = useWedding();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Get first names for logo
  const names = coupleNames?.split(/\s*[&+]\s*/) || ['Braut', 'Bräutigam'];
  const logoText = `${names[0]?.charAt(0) || 'B'} & ${names[1]?.charAt(0) || 'B'}`;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    setIsOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // All possible items for burger menu (Editorial has burger-only nav, so all items included)
  const allMenuItems = [
    { id: 'top', label: 'Start', always: true },
    { id: 'countdown', label: 'Countdown' },
    { id: 'lovestory', label: 'Unsere Geschichte' },
    { id: 'timeline', label: 'Ablauf' },
    { id: 'locations', label: 'Locations' },
    { id: 'directions', label: 'Anfahrt' },
    { id: 'accommodations', label: 'Hotels' },
    { id: 'dresscode', label: 'Dresscode' },
    { id: 'rsvp', label: 'RSVP' },
    { id: 'gallery', label: 'Galerie' },
    { id: 'gifts', label: 'Geschenke' },
    { id: 'guestbook', label: 'Gästebuch' },
    { id: 'musicwishes', label: 'Musik' },
    { id: 'photoupload', label: 'Fotos' },
    { id: 'faq', label: 'FAQ' },
    { id: 'weddingabc', label: 'ABC' },
    { id: 'witnesses', label: 'Trauzeug:innen' },
  ];

  // Burger menu items - all active components sorted by component_order
  const componentOrder = project?.component_order || [];
  const menuItems = allMenuItems
    .filter(item => item.always || isComponentActive(item.id))
    .sort((a, b) => {
      if (a.always) return -1;
      if (b.always) return 1;
      const indexA = componentOrder.indexOf(a.id);
      const indexB = componentOrder.indexOf(b.id);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  return (
    <>
      <Nav $scrolled={scrolled}>
        <Logo href="#top" onClick={(e) => handleLinkClick(e, 'top')}>{logoText}</Logo>
        
        <MenuButton 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Menü schließen' : 'Menü öffnen'}
        >
          <MenuLabel $open={isOpen}>Menü</MenuLabel>
          <MenuLine $open={isOpen} />
          <MenuLine $open={isOpen} />
          <MenuLine $open={isOpen} />
        </MenuButton>
      </Nav>
      
      <Overlay $open={isOpen} onClick={() => setIsOpen(false)} />
      
      <MenuPanel $open={isOpen}>
        <MenuContent>
          <MenuItems>
            {menuItems.map((item, index) => (
              <MenuItem key={item.id} $open={isOpen} $delay={0.1 + index * 0.05}>
                <MenuLink
                  href={`#${item.id}`}
                  onClick={(e) => handleLinkClick(e, item.id)}
                >
                  {item.label}
                </MenuLink>
              </MenuItem>
            ))}
          </MenuItems>
          
          <MenuFooter>
            <MenuFooterText>
              Wir freuen uns auf euch.
            </MenuFooterText>
          </MenuFooter>
        </MenuContent>
      </MenuPanel>
    </>
  );
}

export default Navigation;
