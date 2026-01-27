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
