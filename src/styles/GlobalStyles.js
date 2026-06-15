// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #FAFAFA;
    color: #1A1A1A;
    min-height: 100vh;
    font-size: 14px;
    line-height: 1.5;
  }

  /* Kein horizontales Auslaufen auf dem Handy (Backstop für alle Seiten) */
  html, body {
    overflow-x: hidden;
  }
  img, video {
    max-width: 100%;
    height: auto;
  }
  svg {
    max-width: 100%;
  }

  /* iOS-Zoom verhindern: Felder < 16px lassen Safari beim Fokus reinzoomen.
     Praktisch alle Inputs hier liegen bei 0.85rem–14px.
     !important schlägt die element-spezifischen styled-components-Klassen. */
  @media (max-width: 768px) {
    input:not([type='checkbox']):not([type='radio']):not([type='range']),
    textarea,
    select {
      font-size: 16px !important;
    }
  }

  /* "Bewegung reduzieren" respektieren (OS-Einstellung) */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  a {
    color: inherit;
    text-decoration: none;
  }
  
  button {
    font-family: inherit;
    cursor: pointer;
  }
  
  input, select, textarea {
    font-family: inherit;
  }
  
  ::selection {
    background: #1A1A1A;
    color: #fff;
  }
`;

export default GlobalStyles;
