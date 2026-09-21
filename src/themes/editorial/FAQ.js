import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useWedding } from '../../context/WeddingContext';

// ============================================
// ANIMATIONS
// ============================================

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(60px); }
  to { opacity: 1; transform: translateY(0); }
`;

const letterReveal = keyframes`
  0% { opacity: 0; transform: translateY(100%) rotateX(-80deg); }
  100% { opacity: 1; transform: translateY(0) rotateX(0); }
`;

const expandDown = keyframes`
  from { max-height: 0; opacity: 0; }
  to { max-height: 500px; opacity: 1; }
`;

const lineGrow = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const numberCount = keyframes`
  from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

const Section = styled.section`
  padding: var(--section-padding) 0;
  background: var(--editorial-white);
  overflow: hidden;
  position: relative;
`;

const BackgroundNumber = styled.div`
  position: absolute;
  top: 10%;
  right: -10%;
  font-family: var(--font-headline);
  font-size: clamp(20rem, 50vw, 50rem);
  font-weight: 700;
  color: var(--editorial-light-gray);
  opacity: 0.3;
  line-height: 0.8;
  pointer-events: none;
  z-index: 0;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Container = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 4rem);
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3rem;
  align-items: end;
  margin-bottom: clamp(4rem, 8vw, 6rem);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
`;

const TitleBlock = styled.div``;

const Eyebrow = styled.span`
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--editorial-red);
  margin-bottom: 1rem;
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.8s ease forwards;
  `}
`;

const Title = styled.h2`
  font-family: var(--font-headline);
  font-size: clamp(4rem, 15vw, 10rem);
  font-weight: 700;
  color: var(--editorial-black);
  text-transform: uppercase;
  letter-spacing: -0.03em;
  line-height: 0.95;
  /* overflow: hidden bleibt für den Letter-Reveal – Padding verhindert,
     dass Unterlängen (z.B. das "Q") abgeschnitten werden */
  overflow: hidden;
  padding: 0.05em 0 0.18em;
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.15em;
  
  .word {
    display: inline-flex;
    white-space: nowrap;
  }
  
  .letter {
    display: inline-block;
    opacity: 0;
    
    ${p => p.$visible && css`
      animation: ${letterReveal} 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
    `}
  }
`;

const HeaderLine = styled.div`
  height: 3px;
  background: var(--editorial-red);
  transform: scaleX(0);
  transform-origin: left;
  align-self: center;
  
  ${p => p.$visible && css`
    animation: ${lineGrow} 1s ease forwards;
    animation-delay: 0.5s;
  `}
  
  @media (max-width: 768px) {
    width: 60px;
    margin: 0 auto;
  }
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const FAQItem = styled.div`
  border-bottom: 2px solid var(--editorial-light-gray);
  opacity: 0;
  
  ${p => p.$visible && css`
    animation: ${fadeInUp} 0.6s ease forwards;
    animation-delay: ${0.1 + p.$index * 0.08}s;
  `}
  
  &:first-child {
    border-top: 2px solid var(--editorial-light-gray);
  }
`;

const FAQQuestion = styled.button`
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.5rem;
  align-items: center;
  padding: 2rem 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  
  @media (hover: hover) {
    &:hover {
      padding-left: 1rem;
    }
  }

  /* Mobile: Nummer ist ausgeblendet → Icon links, Text rechts daneben */
  @media (max-width: 600px) {
    grid-template-columns: auto 1fr;
    gap: 1rem;
    padding: 1.5rem 0;
  }
`;

const QuestionNumber = styled.span`
  font-family: var(--font-headline);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  color: ${p => p.$open ? 'var(--editorial-red)' : 'var(--editorial-light-gray)'};
  transition: all 0.3s ease;
  min-width: 60px;
  
  @media (max-width: 600px) {
    display: none;
  }
`;

const QuestionText = styled.span`
  font-family: var(--font-headline);
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  font-weight: 700;
  text-transform: uppercase;
  color: var(--editorial-black);
  letter-spacing: -0.01em;
  transition: color 0.3s ease;
  
  ${FAQQuestion}:hover & {
    color: var(--editorial-red);
  }
`;

const QuestionIcon = styled.span`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.$open ? 'var(--editorial-red)' : 'var(--editorial-black)'};
  color: var(--editorial-white);
  font-family: var(--font-headline);
  font-size: 1.5rem;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: rotate(${p => p.$open ? '45deg' : '0'});
  flex-shrink: 0;
  
  @media (max-width: 600px) {
    order: -1;
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
`;

const FAQAnswer = styled.div`
  display: grid;
  grid-template-rows: ${p => p.$open ? '1fr' : '0fr'};
  transition: grid-template-rows 0.4s ease;
`;

const AnswerInner = styled.div`
  overflow: hidden;
`;

const AnswerContent = styled.div`
  padding: 0 0 2.5rem 0;
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 1.5rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AnswerAccent = styled.div`
  width: 3px;
  background: var(--editorial-red);
  justify-self: center;
  
  @media (max-width: 600px) {
    display: none;
  }
`;

const AnswerText = styled.p`
  font-family: var(--font-serif);
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  color: var(--editorial-gray);
  line-height: 1.9;
  margin: 0;
`;

// ============================================
// COMPONENT
// ============================================

function FAQ() {
  const { content } = useWedding();
  const faqData = content?.faq || {};
  
  const title = faqData?.title || 'FAQ';
  const items = Array.isArray(faqData?.questions) ? faqData.questions : [];

  const [visible, setVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const sectionRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observers = itemRefs.current.map((ref, i) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems(prev => [...new Set([...prev, i])]);
          }
        },
        { threshold: 0.2 }
      );
      if (ref) observer.observe(ref);
      return observer;
    });
    return () => observers.forEach(obs => obs.disconnect());
  }, [items.length]);

  // Keine Default-FAQs - zeige nichts wenn keine Fragen angelegt
  if (items.length === 0) return null;

  const renderTitle = () => {
    if (!title) return null;
    const words = title.split(' ');
    let letterIndex = 0;
    
    return words.map((word, wi) => (
      <span key={wi} className="word">
        {word.split('').map((letter, li) => {
          const delay = 0.1 + letterIndex * 0.06;
          letterIndex++;
          return (
            <span 
              key={li} 
              className="letter" 
              style={{ animationDelay: `${delay}s` }}
            >
              {letter}
            </span>
          );
        })}
      </span>
    ));
  };

  return (
    <Section id="faq" ref={sectionRef}>
      <BackgroundNumber>?</BackgroundNumber>
      
      <Container>
        <Header>
          <TitleBlock>
            <Eyebrow $visible={visible}>Fragen & Antworten</Eyebrow>
            <Title $visible={visible}>{renderTitle()}</Title>
          </TitleBlock>
          <HeaderLine $visible={visible} />
        </Header>
        
        <FAQList>
          {items.map((item, i) => (
            <FAQItem 
              key={i} 
              ref={el => itemRefs.current[i] = el}
              $visible={visibleItems.includes(i)}
              $index={i}
            >
              <FAQQuestion onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <QuestionNumber $open={openIndex === i}>
                  {String(i + 1).padStart(2, '0')}
                </QuestionNumber>
                <QuestionText>{item.question}</QuestionText>
                <QuestionIcon $open={openIndex === i}>+</QuestionIcon>
              </FAQQuestion>
              
              <FAQAnswer $open={openIndex === i}>
                <AnswerInner>
                  <AnswerContent>
                    <AnswerAccent />
                    <AnswerText>{item.answer}</AnswerText>
                  </AnswerContent>
                </AnswerInner>
              </FAQAnswer>
            </FAQItem>
          ))}
        </FAQList>
      </Container>
    </Section>
  );
}

export default FAQ;
