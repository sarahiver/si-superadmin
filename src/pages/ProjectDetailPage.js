// src/pages/ProjectDetailPage.js
// SuperAdmin - Project Detail with Pricing, Contract PDF & Email System
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getProjectById, updateProject, deleteProject, supabase, getPartnerCodeById } from '../lib/supabase';
import { THEMES, PROJECT_STATUS, ALL_COMPONENTS, DEFAULT_COMPONENT_ORDER, CORE_COMPONENTS, PACKAGES, ADDONS, isFeatureIncluded, getAddonPrice, formatPrice } from '../lib/constants';
import { sendWelcomeEmails, sendGoLiveEmail, sendReminderEmail, sendPasswordResetEmail } from '../lib/emailService';
import { generateContractPDF } from '../lib/contractPDF';
import { generateInvoicePDF } from '../lib/invoicePDF';
import { generateWebsiteQRSVG } from '../lib/qrGenerator';
import { adminFetch } from '../lib/apiClient';
import AddressAutocomplete, { formatAddress } from '../components/AddressAutocomplete';
import PhoneInput from '../components/PhoneInput';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const THEME_ACCENT_COLORS = {
  botanical: '#1B4332',
  editorial: '#C41E3A',
  contemporary: '#FF6B6B',
  luxe: '#D4AF37',
  neon: '#FF006E',
  video: '#E50914',
  classic: '#8B6914',
  parallax: '#000000',
};

// Verfügbare Varianten pro Komponente
// Hier neue Designs hinzufügen, wenn sie implementiert sind
const COMPONENT_VARIANTS = {
  countdown: [
    { id: 'default', name: 'Standard', description: 'Theme-Standard Countdown' },
    { id: 'round-clock', name: 'Runde Uhr', description: 'Analoge Uhr mit Zeigern' },
    { id: 'flip-clock', name: 'Flip Clock', description: 'Klassische Klappzahlen' },
    { id: 'minimal', name: 'Minimal', description: 'Nur Zahlen, keine Dekoration' },
  ],
  hero: [
    { id: 'default', name: 'Standard', description: 'Theme-Standard Hero' },
    { id: 'video-bg', name: 'Video Background', description: 'Autoplay Video im Hintergrund' },
    { id: 'parallax', name: 'Parallax', description: 'Parallax Scroll-Effekt' },
    { id: 'split', name: 'Split Screen', description: 'Bild links, Text rechts' },
  ],
  gallery: [
    { id: 'default', name: 'Standard', description: 'Theme-Standard Galerie' },
    { id: 'masonry', name: 'Masonry', description: 'Pinterest-Style Grid' },
    { id: 'carousel', name: 'Carousel', description: 'Horizontal Slider' },
    { id: 'lightbox', name: 'Lightbox Grid', description: 'Vollbild beim Klick' },
  ],
  timeline: [
    { id: 'default', name: 'Standard', description: 'Theme-Standard Timeline' },
    { id: 'horizontal', name: 'Horizontal', description: 'Horizontale Timeline' },
    { id: 'cards', name: 'Karten', description: 'Einzelne Event-Karten' },
  ],
  lovestory: [
    { id: 'default', name: 'Standard', description: 'Theme-Standard Love Story' },
    { id: 'timeline', name: 'Timeline', description: 'Vertikale Timeline' },
    { id: 'slideshow', name: 'Slideshow', description: 'Automatische Slideshow' },
  ],
  rsvp: [
    { id: 'default', name: 'Standard', description: 'Theme-Standard RSVP' },
    { id: 'multi-step', name: 'Multi-Step', description: 'Mehrstufiges Formular' },
    { id: 'minimal', name: 'Minimal', description: 'Kompaktes Formular' },
  ],
  locations: [
    { id: 'default', name: 'Standard', description: 'Theme-Standard Locations' },
    { id: 'map-focus', name: 'Karten-Fokus', description: 'Große interaktive Karte' },
    { id: 'cards', name: 'Karten', description: 'Location-Karten nebeneinander' },
  ],
};

// ============================================
// STYLED COMPONENTS
// ============================================
const Header = styled.div`display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black}; flex-wrap: wrap; gap: 1rem;`;
const HeaderLeft = styled.div``;
const BackLink = styled(Link)`font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; text-decoration: none; display: inline-block; margin-bottom: 0.75rem; &:hover { color: ${colors.black}; }`;
const TitleRow = styled.div`display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;`;
const Title = styled.h1`font-family: 'Oswald', sans-serif; font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 600; text-transform: uppercase; color: ${colors.black}; line-height: 1;`;
const StatusBadge = styled.span`font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.35rem 0.75rem; background: ${p => p.$color ? `${p.$color}20` : colors.background}; color: ${p => p.$color || colors.gray}; border: 1px solid ${p => p.$color || colors.lightGray};`;
const Actions = styled.div`display: flex; gap: 0.75rem; flex-wrap: wrap;`;
const Button = styled.button`padding: 0.75rem 1.5rem; font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s ease; ${p => p.$danger && `background: transparent; color: ${colors.red}; border: 2px solid ${colors.red}; &:hover { background: ${colors.red}; color: ${colors.white}; }`} ${p => p.$primary && `background: ${colors.red}; color: ${colors.white}; border: 2px solid ${colors.red}; &:hover:not(:disabled) { background: ${colors.black}; border-color: ${colors.black}; }`} ${p => p.$secondary && `background: ${colors.black}; color: ${colors.white}; border: 2px solid ${colors.black}; &:hover { background: ${colors.gray}; }`} ${p => !p.$danger && !p.$primary && !p.$secondary && `background: transparent; color: ${colors.black}; border: 2px solid ${colors.black}; &:hover { background: ${colors.black}; color: ${colors.white}; }`} &:disabled { opacity: 0.5; cursor: not-allowed; }`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; padding-bottom: 100px; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const MainColumn = styled.div``;
const Sidebar = styled.div``;
const Section = styled.section`margin-bottom: 1rem; border: 2px solid ${colors.black};`;
const SectionHeader = styled.div`display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: ${p => p.$isOpen ? colors.black : colors.white}; color: ${p => p.$isOpen ? colors.white : colors.black}; cursor: pointer; user-select: none; transition: all 0.2s ease; &:hover { background: ${p => p.$isOpen ? colors.black : colors.background}; }`;
const SectionNumber = styled.span`font-family: 'Oswald', sans-serif; font-size: 0.875rem; font-weight: 600; color: ${p => p.$isOpen ? colors.white : colors.red}; min-width: 24px;`;
const SectionTitle = styled.h2`font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; flex: 1;`;
const SectionBadge = styled.span`font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; background: ${p => p.$isOpen ? 'rgba(255,255,255,0.1)' : colors.background}; padding: 0.25rem 0.5rem;`;
const CollapseIcon = styled.span`font-size: 1.25rem; transition: transform 0.2s ease; transform: ${p => p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};`;
const SectionBody = styled.div`padding: ${p => p.$isOpen ? '1.5rem' : '0'}; max-height: ${p => p.$isOpen ? '5000px' : '0'}; overflow: hidden; transition: all 0.3s ease; border-top: ${p => p.$isOpen ? `1px solid ${colors.lightGray}` : 'none'};`;
const FormGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const FormGroup = styled.div`&.full-width { grid-column: 1 / -1; }`;
const Label = styled.label`display: block; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.5rem;`;
const Input = styled.input`width: 100%; padding: 0.875rem 1rem; background: ${colors.white}; border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.95rem; color: ${colors.black}; &:focus { outline: none; border-color: ${colors.black}; }`;
const TextArea = styled.textarea`width: 100%; padding: 0.875rem 1rem; background: ${colors.white}; border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.95rem; color: ${colors.black}; resize: vertical; min-height: 100px; &:focus { outline: none; border-color: ${colors.black}; }`;
const Select = styled.select`width: 100%; padding: 0.875rem 1rem; background: ${colors.white}; border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 0.95rem; cursor: pointer; &:focus { outline: none; border-color: ${colors.black}; }`;
const LinkBox = styled.div`background: ${colors.black}; padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; &:last-child { margin-bottom: 0; } a { font-family: monospace; font-size: 0.85rem; color: ${colors.white}; text-decoration: none; word-break: break-all; &:hover { text-decoration: underline; } } button { background: ${colors.red}; border: none; color: ${colors.white}; padding: 0.4rem 0.75rem; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; cursor: pointer; flex-shrink: 0; &:hover { background: ${colors.white}; color: ${colors.black}; } }`;
const PackageSelector = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; @media (max-width: 800px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 500px) { grid-template-columns: 1fr; }`;
const PackageCard = styled.div`border: 2px solid ${p => p.$selected ? colors.red : colors.lightGray}; background: ${p => p.$selected ? `${colors.red}10` : colors.white}; padding: 1.25rem; cursor: pointer; transition: all 0.2s ease; &:hover { border-color: ${p => p.$selected ? colors.red : colors.black}; } .name { font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.25rem; } .price { font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 700; color: ${colors.red}; } .price-note { font-size: 0.7rem; color: ${colors.gray}; }`;
const FeatureList = styled.div`background: ${colors.background}; padding: 1rem; margin-bottom: 1.5rem; .title { font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; } ul { list-style: none; padding: 0; margin: 0; } li { font-size: 0.85rem; padding: 0.35rem 0; display: flex; align-items: center; gap: 0.5rem; &::before { content: '✓'; color: ${colors.green}; font-weight: 700; } }`;
const AddonsSection = styled.div`margin-bottom: 1.5rem; .title { font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }`;
const AddonItem = styled.div`display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: ${p => p.$included ? `${colors.green}15` : p.$selected ? `${colors.red}10` : colors.white}; border: 1px solid ${p => p.$included ? colors.green : p.$selected ? colors.red : colors.lightGray}; margin-bottom: 0.5rem; cursor: ${p => p.$included ? 'default' : 'pointer'}; .checkbox { width: 20px; height: 20px; border: 2px solid ${p => p.$included ? colors.green : p.$selected ? colors.red : colors.black}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; background: ${p => (p.$included || p.$selected) ? (p.$included ? colors.green : colors.red) : 'transparent'}; color: white; } .info { flex: 1; } .name { font-size: 0.9rem; font-weight: 500; } .description { font-size: 0.75rem; color: ${colors.gray}; } .price { font-size: 0.85rem; font-weight: 600; } .included-badge { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: ${colors.green}; background: ${colors.green}20; padding: 0.2rem 0.5rem; }`;
const ExtraComponentsRow = styled.div`display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: ${colors.white}; border: 1px solid ${colors.lightGray}; margin-bottom: 0.5rem; .info { flex: 1; } .name { font-size: 0.9rem; font-weight: 500; } .description { font-size: 0.75rem; color: ${colors.gray}; } .counter { display: flex; align-items: center; gap: 0.5rem; button { width: 28px; height: 28px; border: 2px solid ${colors.black}; background: transparent; font-size: 1rem; font-weight: 700; cursor: pointer; &:hover { background: ${colors.black}; color: white; } &:disabled { opacity: 0.3; cursor: not-allowed; } } span { font-size: 1rem; font-weight: 600; min-width: 24px; text-align: center; } } .price { font-size: 0.85rem; font-weight: 600; min-width: 60px; text-align: right; }`;

// Custom Extras Styles
const CustomExtrasSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${colors.lightGray};
`;

const CustomExtrasTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  .title {
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`;

const AddExtraButton = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${colors.red};
  background: transparent;
  border: 1px dashed ${colors.red};
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${colors.red}10;
  }
`;

const CustomExtraItem = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.lightGray};
  padding: 1rem;
  margin-bottom: 0.75rem;

  .extra-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .extra-title-input {
    flex: 1;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.5rem;
    border: 1px solid ${colors.lightGray};
    background: ${colors.white};

    &:focus {
      outline: none;
      border-color: ${colors.black};
    }
  }

  .extra-amount {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    input {
      width: 100px;
      text-align: right;
      font-weight: 600;
      padding: 0.5rem;
      border: 1px solid ${colors.lightGray};
      background: ${colors.white};

      &:focus {
        outline: none;
        border-color: ${colors.black};
      }
    }

    span {
      color: ${colors.gray};
    }
  }

  .extra-description {
    width: 100%;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    padding: 0.5rem;
    border: 1px solid ${colors.lightGray};
    background: ${colors.white};
    resize: vertical;
    min-height: 60px;

    &:focus {
      outline: none;
      border-color: ${colors.black};
    }

    &::placeholder {
      color: ${colors.gray};
    }
  }

  .extra-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.75rem;
  }

  .delete-btn {
    font-size: 0.7rem;
    color: ${colors.red};
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const CustomExtrasSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${colors.red}10;
  border: 1px solid ${colors.red}30;
  margin-top: 0.5rem;

  .label {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .total {
    font-size: 0.95rem;
    font-weight: 700;
    color: ${colors.red};
  }
`;
const PriceSummary = styled.div`background: ${colors.black}; color: white; padding: 1.25rem; .row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem; &.total { border-top: 1px solid ${colors.gray}; padding-top: 0.75rem; margin-top: 0.75rem; font-size: 1.1rem; font-weight: 700; } &.discount { color: ${colors.green}; } } .label { color: ${colors.lightGray}; } .total .label { color: white; }`;
const SettingsGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid ${colors.lightGray}; @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const ComponentListContainer = styled.div`border: 2px solid ${colors.lightGray};`;
const ComponentListHeader = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: ${colors.background}; .count { font-family: 'Oswald', sans-serif; font-size: 0.9rem; } .hint { font-size: 0.7rem; color: ${colors.gray}; }`;
const ComponentWarning = styled.div`background: ${colors.orange}20; border: 1px solid ${colors.orange}; color: ${colors.orange}; padding: 0.75rem 1rem; font-size: 0.8rem; strong { font-weight: 600; }`;
const ComponentItem = styled.div`display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem; background: ${p => p.$active ? colors.black : colors.white}; color: ${p => p.$active ? colors.white : colors.black}; border-bottom: 1px solid ${colors.lightGray}; cursor: pointer; transition: all 0.15s ease; &:last-child { border-bottom: none; } &:hover { background: ${p => p.$active ? colors.black : colors.background}; } .drag-handle { color: ${p => p.$active ? colors.gray : colors.lightGray}; cursor: grab; } .checkbox { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid ${p => p.$active ? colors.white : colors.black}; background: ${p => p.$active ? colors.white : 'transparent'}; color: ${colors.black}; font-size: 0.75rem; font-weight: 700; } .name { flex: 1; font-size: 0.9rem; font-weight: 500; } .badge { font-size: 0.6rem; font-weight: 600; text-transform: uppercase; padding: 0.2rem 0.5rem; background: ${p => p.$active ? colors.red : colors.background}; color: ${p => p.$active ? colors.white : colors.gray}; }`;

// Component Config / Variants Styles
const ComponentConfigSection = styled.div`
  margin-top: 1rem;
`;

const ComponentConfigItem = styled.div`
  background: ${colors.white};
  border: 1px solid ${p => p.$hasConfig ? colors.red : colors.lightGray};
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${colors.black};
  }
`;

const ComponentConfigHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  background: ${p => p.$hasConfig ? `${colors.red}08` : 'transparent'};

  .left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .name {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .variant-badge {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    background: ${colors.red};
    color: ${colors.white};
  }

  .toggle {
    font-size: 0.75rem;
    color: ${colors.gray};
    transition: transform 0.2s ease;
    transform: ${p => p.$open ? 'rotate(180deg)' : 'rotate(0)'};
  }
`;

const ComponentConfigBody = styled.div`
  padding: ${p => p.$open ? '1rem' : '0 1rem'};
  max-height: ${p => p.$open ? '300px' : '0'};
  overflow: hidden;
  transition: all 0.2s ease;
  background: ${colors.background};
  border-top: ${p => p.$open ? `1px solid ${colors.lightGray}` : 'none'};
`;

const VariantSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const VariantChip = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: 2px solid ${p => p.$selected ? colors.red : colors.lightGray};
  background: ${p => p.$selected ? `${colors.red}15` : colors.white};
  color: ${p => p.$selected ? colors.red : colors.black};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${p => p.$selected ? colors.red : colors.black};
  }
`;

const ConfigNotesInput = styled.textarea`
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  padding: 0.75rem;
  border: 1px solid ${colors.lightGray};
  background: ${colors.white};
  resize: vertical;
  min-height: 60px;

  &:focus {
    outline: none;
    border-color: ${colors.black};
  }

  &::placeholder {
    color: ${colors.gray};
  }
`;

const ConfigLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${colors.gray};
  margin-bottom: 0.5rem;
`;

const ConfigSummary = styled.div`
  background: ${colors.black};
  color: ${colors.white};
  padding: 1rem;
  margin-top: 1rem;

  .title {
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
  }

  .item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 0.8rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid ${colors.gray};

    &:last-child {
      border-bottom: none;
    }

    .component {
      color: ${colors.lightGray};
    }

    .variant {
      color: ${colors.red};
      font-weight: 600;
    }
  }

  .empty {
    font-size: 0.8rem;
    color: ${colors.gray};
    text-align: center;
    padding: 0.5rem;
  }
`;
const InfoCard = styled.div`border: 2px solid ${colors.black}; margin-bottom: 1.5rem;`;
const InfoHeader = styled.div`padding: 0.75rem 1rem; background: ${colors.black}; color: white; font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;`;
const InfoBody = styled.div`padding: 1rem;`;
const InfoRow = styled.div`display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.75rem; &:last-child { margin-bottom: 0; } .label { color: ${colors.gray}; } .value { font-weight: 500; text-align: right; } a { color: ${colors.red}; text-decoration: none; &:hover { text-decoration: underline; } }`;

// Email Section Styles
const EmailActions = styled.div`display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const EmailActionCard = styled.button`display: flex; flex-direction: column; align-items: flex-start; padding: 1.25rem; background: ${colors.white}; border: 2px solid ${colors.lightGray}; cursor: pointer; text-align: left; transition: all 0.2s ease; &:hover { border-color: ${colors.black}; } &:disabled { opacity: 0.5; cursor: not-allowed; } .icon { font-size: 1.5rem; margin-bottom: 0.5rem; } .title { font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; } .desc { font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${colors.gray}; margin-top: 0.25rem; }`;
const EmailLogItem = styled.div`background: ${colors.white}; border: 1px solid ${colors.lightGray}; margin-bottom: 0.5rem; overflow: hidden;`;
const EmailLogHeader = styled.div`display: flex; align-items: center; padding: 0.875rem 1rem; gap: 0.75rem; cursor: pointer; transition: background 0.2s ease; &:hover { background: ${colors.background}; }`;
const EmailLogStatus = styled.span`width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; background: ${p => p.$status === 'sent' ? colors.green : p.$status === 'failed' ? colors.red : colors.orange};`;
const EmailLogType = styled.span`font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; flex: 1;`;
const EmailLogDate = styled.span`font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${colors.gray};`;
const EmailLogExpand = styled.span`font-size: 0.75rem; color: ${colors.gray}; transition: transform 0.2s ease; transform: ${p => p.$open ? 'rotate(180deg)' : 'rotate(0)'};`;
const EmailLogDetails = styled.div`padding: ${p => p.$open ? '1rem' : '0 1rem'}; max-height: ${p => p.$open ? '200px' : '0'}; overflow: hidden; transition: all 0.2s ease; background: ${colors.background}; border-top: ${p => p.$open ? `1px solid ${colors.lightGray}` : 'none'};`;
const EmailLogRow = styled.div`display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 0.5rem; &:last-child { margin-bottom: 0; } .label { color: ${colors.gray}; } .value { font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }`;
const EmailStatusBadge = styled.span`font-size: 0.65rem; font-weight: 600; text-transform: uppercase; padding: 0.2rem 0.5rem; background: ${p => p.$success ? `${colors.green}20` : p.$warning ? `${colors.orange}20` : `${colors.red}20`}; color: ${p => p.$success ? colors.green : p.$warning ? colors.orange : colors.red};`;
const EmptyState = styled.div`text-align: center; padding: 2rem; color: ${colors.gray}; font-size: 0.9rem;`;
const ManualEmailBox = styled.div`background: ${colors.background}; padding: 1.25rem; margin-top: 1.5rem;`;

// Password Protection Styles
const PasswordProtectionBox = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: ${colors.background};
  border: 2px solid ${colors.lightGray};
`;

const PasswordHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  .hint {
    font-size: 0.75rem;
    color: ${colors.gray};
  }
`;

const PasswordToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  
  .checkbox {
    width: 24px;
    height: 24px;
    border: 2px solid ${p => p.$active ? colors.green : colors.black};
    background: ${p => p.$active ? colors.green : 'transparent'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
  }
  
  .label {
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const PasswordInputRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  
  input {
    flex: 1;
  }
`;

const PasswordSaveButton = styled.button`
  padding: 0.875rem 1.5rem;
  background: ${colors.black};
  color: ${colors.white};
  border: none;
  font-family: 'Oswald', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${colors.red};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PasswordStatus = styled.div`
  margin-top: 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${p => p.$set ? colors.green : colors.gray};
`;

// Hosting Section Styles
const HostingSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: ${colors.background};
  border: 2px solid ${colors.lightGray};
`;

const HostingSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  .icon { font-size: 1.25rem; }
  .title {
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const HostingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const HostingCard = styled.div`
  background: ${colors.white};
  border: 1px solid ${p => p.$warning ? colors.orange : p.$success ? colors.green : colors.lightGray};
  padding: 1rem;

  .label {
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${colors.gray};
    margin-bottom: 0.35rem;
  }

  .value {
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${p => p.$warning ? colors.orange : p.$success ? colors.green : colors.black};
  }

  .hint {
    font-size: 0.7rem;
    color: ${colors.gray};
    margin-top: 0.25rem;
  }
`;

const HostingToggleRow = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const HostingToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  .checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid ${p => p.$active ? colors.green : colors.lightGray};
    background: ${p => p.$active ? colors.green : 'transparent'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .label {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
  }
`;

const HostingOverrideSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed ${colors.lightGray};
`;

const HostingOverrideToggle = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: ${colors.gray};
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: ${colors.black};
  }
`;

const HostingOverrideFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

// Kundenabwicklung Styles
const WorkflowSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const WorkflowCard = styled.div`
  background: ${colors.white};
  border: 2px solid ${p => p.$complete ? colors.green : colors.lightGray};
  padding: 1.25rem;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid ${colors.lightGray};
  }

  .card-title {
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-badge {
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    background: ${p => p.$complete ? `${colors.green}20` : `${colors.orange}20`};
    color: ${p => p.$complete ? colors.green : colors.orange};
  }
`;

const WorkflowRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.85rem;

  .label {
    color: ${colors.gray};
  }

  .value {
    font-weight: 500;
    color: ${colors.black};
  }

  .value.success {
    color: ${colors.green};
  }

  .value.pending {
    color: ${colors.orange};
  }
`;

const WorkflowCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${p => p.$checked ? `${colors.green}10` : colors.background};
  border: 1px solid ${p => p.$checked ? colors.green : colors.lightGray};
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${p => p.$checked ? colors.green : colors.black};
  }

  .checkbox {
    width: 22px;
    height: 22px;
    border: 2px solid ${p => p.$checked ? colors.green : colors.black};
    background: ${p => p.$checked ? colors.green : 'transparent'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .text {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .date {
    font-size: 0.75rem;
    color: ${colors.gray};
  }
`;

const PDFButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const PDFButton = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.6rem 1rem;
  background: ${p => p.$primary ? colors.black : 'transparent'};
  color: ${p => p.$primary ? colors.white : colors.black};
  border: 1px solid ${colors.black};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${p => p.$primary ? colors.red : colors.black};
    color: ${colors.white};
    border-color: ${p => p.$primary ? colors.red : colors.black};
  }
`;

const WorkflowNotes = styled.div`
  grid-column: 1 / -1;
  margin-top: 1rem;
`;

const PaymentInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${p => p.$paid ? `${colors.green}10` : colors.background};
  border: 1px solid ${p => p.$paid ? colors.green : colors.lightGray};
  margin-bottom: 0.5rem;

  .checkbox {
    width: 22px;
    height: 22px;
    border: 2px solid ${p => p.$paid ? colors.green : colors.black};
    background: ${p => p.$paid ? colors.green : 'transparent'};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
  }

  .label {
    font-size: 0.85rem;
    font-weight: 500;
    min-width: 120px;
  }

  .amount-input {
    width: 100px;
    padding: 0.4rem 0.6rem;
    border: 1px solid ${colors.lightGray};
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    text-align: right;

    &:focus {
      outline: none;
      border-color: ${colors.black};
    }
  }

  .expected {
    font-size: 0.75rem;
    color: ${colors.gray};
  }

  .date {
    font-size: 0.75rem;
    color: ${colors.gray};
    margin-left: auto;
  }
`;

// Sticky Save Bar - immer sichtbar am unteren Bildschirmrand
const StickyBottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${colors.white};
  border-top: 3px solid ${colors.black};
  padding: 1rem 2rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  z-index: 100;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  
  .status-text {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    color: ${colors.gray};
    margin-right: auto;
  }
`;

// QR Code Designer Styles
const QRPreviewBox = styled.div`
  margin-top: 1.5rem;
  border: 2px solid ${colors.lightGray};
  border-radius: 8px;
  overflow: hidden;
`;

const QRPreviewHeader = styled.div`
  padding: 0.75rem 1rem;
  background: ${colors.background};
  border-bottom: 1px solid ${colors.lightGray};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  .title { font-weight: 700; font-size: 0.85rem; }
  .hint { font-size: 0.75rem; color: ${colors.gray}; }
`;

const QRDesignerLayout = styled.div`
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 1.5rem;
  align-items: start;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const QRCanvas = styled.div`
  width: 200px;
  min-height: 200px;
  background: #fff;
  border: 1px solid ${colors.lightGray};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  svg { width: 100%; height: auto; }
`;

const QRDesignPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const QROptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const QROptionLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${colors.gray};
`;

const QRButtonRow = styled.div`
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
`;

const QRToggle = styled.button`
  padding: ${p => p.$small ? '0.25rem 0.5rem' : '0.3rem 0.6rem'};
  font-size: ${p => p.$small ? '0.7rem' : '0.75rem'};
  font-weight: 600;
  border: 2px solid ${p => p.$active ? colors.black : colors.lightGray};
  background: ${p => p.$active ? colors.black : 'white'};
  color: ${p => p.$active ? 'white' : colors.black};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${colors.black}; }
`;

const QRColorRow = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  input[type="color"] {
    width: 32px;
    height: 28px;
    border: 2px solid ${colors.lightGray};
    border-radius: 4px;
    padding: 0;
    cursor: pointer;
  }
`;

const QRImageUpload = styled.div`
  margin-top: 0.3rem;
  input { font-size: 0.75rem; }
  img {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border: 1px solid ${colors.lightGray};
    border-radius: 4px;
    margin-top: 0.3rem;
  }
`;

const QRActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  button {
    background: ${colors.black};
    color: ${colors.white};
    border: none;
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px;
    white-space: nowrap;
    &:hover { opacity: 0.8; }
  }
`;

// QR Code Helper Functions
function getQROptions(formData) {
  return {
    size: 600,
    color: formData.qr_color || '#0A0A0A',
    style: formData.qr_style || 'square',
    logoText: formData.qr_logo_type === 'text' ? (formData.qr_logo_text || '') : '',
    logoImage: formData.qr_logo_type === 'image' ? (formData.qr_logo_image || '') : '',
    frameText: (formData.qr_frame_style && formData.qr_frame_style !== 'none') ? (formData.qr_frame_text || '') : '',
    frameStyle: formData.qr_frame_style || 'none',
  };
}

function renderQRPreview(url, formData = {}) {
  const opts = getQROptions(formData);
  opts.size = 200;
  opts.url = `https://${url}`;
  const svg = generateWebsiteQRSVG(opts);
  const container = document.getElementById('website-qr-preview');
  if (container && svg) {
    container.innerHTML = svg;
  }
}

function downloadQRWithOptions(url, formData) {
  const opts = getQROptions(formData);
  opts.url = `https://${url}`;
  const svg = generateWebsiteQRSVG(opts);
  if (!svg) return;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `qr-${url.replace(/[^a-z0-9]/gi, '-')}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadQRAsPNG(url, formData) {
  const opts = getQROptions(formData);
  opts.url = `https://${url}`;
  const svg = generateWebsiteQRSVG(opts);
  if (!svg) return;
  // Parse SVG to get dimensions
  const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = match ? parseInt(match[1]) : 600;
  const h = match ? parseInt(match[2]) : 600;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-${url.replace(/[^a-z0-9]/gi, '-')}.png`;
    a.click();
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function copyQRSVG(url, formData) {
  const opts = getQROptions(formData);
  opts.url = `https://${url}`;
  const svg = generateWebsiteQRSVG(opts);
  if (svg) {
    navigator.clipboard.writeText(svg).then(() => toast.success('SVG kopiert!'));
  }
}

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================
function CollapsibleSection({ number, title, badge, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Section>
      <SectionHeader $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <SectionNumber $isOpen={isOpen}>{number}</SectionNumber>
        <SectionTitle>{title}</SectionTitle>
        {badge && <SectionBadge $isOpen={isOpen}>{badge}</SectionBadge>}
        <CollapseIcon $isOpen={isOpen}>▼</CollapseIcon>
      </SectionHeader>
      <SectionBody $isOpen={isOpen}>{children}</SectionBody>
    </Section>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [expandedConfigId, setExpandedConfigId] = useState(null);
  const [showHostingOverride, setShowHostingOverride] = useState(false);

  // Hosting calculation helpers
  const getHostingMonths = (pkg) => {
    switch (pkg) {
      case 'starter': return 6;
      case 'standard': return 8;
      case 'premium': return 12;
      case 'individual': return 12;
      default: return 6;
    }
  };

  const calculateHostingDates = (weddingDate, pkg, status) => {
    if (!weddingDate) return { start: null, end: null, stdEnd: null, archiveEnd: null };

    const wedding = new Date(weddingDate);
    const hostingMonths = getHostingMonths(pkg);

    // STD startet 2 Monate vor Hochzeit, endet bei Hochzeit
    const stdStart = new Date(wedding);
    stdStart.setMonth(stdStart.getMonth() - 2);

    // Hosting startet bei STD-Start oder Hochzeit (je nach Paket)
    const hostingStart = new Date(stdStart);

    // Hosting endet X Monate nach Start
    const hostingEnd = new Date(hostingStart);
    hostingEnd.setMonth(hostingEnd.getMonth() + hostingMonths);

    // STD endet bei Hochzeit
    const stdEnd = new Date(wedding);

    // Archiv endet 3 Monate nach Hochzeit
    const archiveEnd = new Date(wedding);
    archiveEnd.setMonth(archiveEnd.getMonth() + 3);

    return {
      start: hostingStart.toISOString().split('T')[0],
      end: hostingEnd.toISOString().split('T')[0],
      stdEnd: stdEnd.toISOString().split('T')[0],
      archiveEnd: archiveEnd.toISOString().split('T')[0],
    };
  };

  const formatDateDE = (dateStr) => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end - today) / (24 * 60 * 60 * 1000));
  };

  useEffect(() => {
    loadProject();
    loadEmailLogs();
  }, [id]);

  // Render QR code when URL or design options change
  useEffect(() => {
    const url = formData.custom_domain || (formData.slug ? `siwedding.de/${formData.slug}` : null);
    if (url) {
      setTimeout(() => renderQRPreview(url, formData), 100);
    }
  }, [formData.custom_domain, formData.slug, formData.qr_style, formData.qr_color, formData.qr_logo_type, formData.qr_logo_text, formData.qr_logo_image, formData.qr_frame_style, formData.qr_frame_text]);

  const loadProject = async () => {
    const { data } = await getProjectById(id);
    if (data) {
      setProject(data);
      setFormData({
        ...data,
        package: data.package || 'starter',
        addons: data.addons || [],
        extra_components_count: data.extra_components_count || 0,
        discount: data.discount || 0,
        custom_price: data.custom_price || 0,
        custom_extras: data.custom_extras || [],
        component_config: data.component_config || {},
        component_order: data.component_order || DEFAULT_COMPONENT_ORDER,
        active_components: data.active_components || [...CORE_COMPONENTS],
        std_date: data.std_date || '',
        archive_date: data.archive_date || '',
        // Hosting fields
        hosting_start_date: data.hosting_start_date || '',
        hosting_end_date: data.hosting_end_date || '',
        has_std: data.has_std ?? (PACKAGES[data.package]?.includesSaveTheDate || false),
        has_archive: data.has_archive ?? (PACKAGES[data.package]?.includesArchive || false),
        std_end_date: data.std_end_date || '',
        archive_end_date: data.archive_end_date || '',
        // Kundenabwicklung fields
        contract_number: data.contract_number || '',
        contract_date: data.contract_date || '',
        contract_sent: data.contract_sent || false,
        contract_sent_date: data.contract_sent_date || '',
        contract_signed: data.contract_signed || false,
        contract_signed_date: data.contract_signed_date || '',
        deposit_invoice_number: data.deposit_invoice_number || '',
        deposit_invoice_date: data.deposit_invoice_date || '',
        deposit_paid: data.deposit_paid || false,
        deposit_paid_date: data.deposit_paid_date || '',
        deposit_amount: data.deposit_amount || 0,
        final_invoice_number: data.final_invoice_number || '',
        final_invoice_date: data.final_invoice_date || '',
        final_paid: data.final_paid || false,
        final_paid_date: data.final_paid_date || '',
        final_amount: data.final_amount || 0,
        workflow_notes: data.workflow_notes || '',
        // Partner-System
        partner_code_id: data.partner_code_id || null,
        coupon_code: data.coupon_code || null,
        contact_request_id: data.contact_request_id || null,
      });
    }
    setIsLoading(false);
  };

  const loadEmailLogs = async () => {
    const { data } = await supabase
      .from('email_logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    setEmailLogs(data || []);
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-fill hosting dates when status changes to std/live and dates are empty
      if (field === 'status' && ['std', 'live'].includes(value) && prev.wedding_date) {
        const dates = calculateHostingDates(prev.wedding_date, prev.package, value);
        if (!prev.hosting_start_date) updated.hosting_start_date = dates.start;
        if (!prev.hosting_end_date) updated.hosting_end_date = dates.end;
        if (!prev.std_end_date) updated.std_end_date = dates.stdEnd;
        if (!prev.archive_end_date) updated.archive_end_date = dates.archiveEnd;
      }

      // Auto-fill when wedding date changes
      if (field === 'wedding_date' && value && ['std', 'live'].includes(prev.status)) {
        const dates = calculateHostingDates(value, prev.package, prev.status);
        if (!prev.hosting_start_date) updated.hosting_start_date = dates.start;
        if (!prev.hosting_end_date) updated.hosting_end_date = dates.end;
        if (!prev.std_end_date) updated.std_end_date = dates.stdEnd;
        if (!prev.archive_end_date) updated.archive_end_date = dates.archiveEnd;
      }

      // Update has_std/has_archive based on package change
      if (field === 'package') {
        const pkg = PACKAGES[value];
        if (pkg) {
          // Only auto-set if not manually overridden (check if it was included in old package)
          const oldPkg = PACKAGES[prev.package];
          if (!oldPkg?.includesSaveTheDate && !prev.addons?.includes('save_the_date')) {
            updated.has_std = pkg.includesSaveTheDate || prev.addons?.includes('save_the_date');
          }
          if (!oldPkg?.includesArchive && !prev.addons?.includes('archive')) {
            updated.has_archive = pkg.includesArchive || prev.addons?.includes('archive');
          }
        }
      }

      // Update has_std/has_archive when addons change
      if (field === 'addons') {
        const pkg = PACKAGES[prev.package];
        updated.has_std = pkg?.includesSaveTheDate || value?.includes('save_the_date');
        updated.has_archive = pkg?.includesArchive || value?.includes('archive');
      }

      return updated;
    });
  };

  const selectedPackage = PACKAGES[formData.package] || PACKAGES.starter;
  const isIndividual = formData.package === 'individual';

  const pricing = useMemo(() => {
    const pkg = PACKAGES[formData.package] || PACKAGES.starter;
    const customExtras = formData.custom_extras || [];
    const customExtrasPrice = customExtras.reduce((sum, extra) => sum + (parseFloat(extra.amount) || 0), 0);

    if (formData.package === 'individual') {
      return { packagePrice: 0, addonsPrice: 0, extraComponentsPrice: 0, customExtrasPrice, discount: 0, total: (formData.custom_price || 0) + customExtrasPrice };
    }
    const addons = formData.addons || [];
    const extraCount = formData.extra_components_count || 0;
    const discount = formData.discount || 0;
    let packagePrice = pkg.price;
    let addonsPrice = 0;
    addons.forEach(addonId => {
      if (!isFeatureIncluded(formData.package, addonId)) {
        addonsPrice += getAddonPrice(addonId, formData.package);
      }
    });
    const extraOverLimit = Math.max(0, extraCount - pkg.extraComponentsIncluded);
    const extraComponentsPrice = extraOverLimit * (ADDONS.extra_component?.price || 50);
    const total = Math.max(0, packagePrice + addonsPrice + extraComponentsPrice + customExtrasPrice - discount);
    return { packagePrice, addonsPrice, extraComponentsPrice, customExtrasPrice, discount, total };
  }, [formData.package, formData.addons, formData.extra_components_count, formData.discount, formData.custom_price, formData.custom_extras]);

  const toggleAddon = (addonId) => {
    if (isFeatureIncluded(formData.package, addonId)) return;
    const current = formData.addons || [];
    handleChange('addons', current.includes(addonId) ? current.filter(i => i !== addonId) : [...current, addonId]);
  };

  // Custom Extras Management
  const addCustomExtra = () => {
    const newExtra = {
      id: Date.now().toString(),
      title: '',
      description: '',
      amount: 0
    };
    handleChange('custom_extras', [...(formData.custom_extras || []), newExtra]);
  };

  const updateCustomExtra = (id, field, value) => {
    const updated = (formData.custom_extras || []).map(extra =>
      extra.id === id ? { ...extra, [field]: value } : extra
    );
    handleChange('custom_extras', updated);
  };

  const deleteCustomExtra = (id) => {
    const updated = (formData.custom_extras || []).filter(extra => extra.id !== id);
    handleChange('custom_extras', updated);
  };

  // Component Config Management
  const setComponentVariant = (componentId, variantId) => {
    const currentConfig = formData.component_config || {};
    const componentConfig = currentConfig[componentId] || {};

    // Wenn default gewählt wird und keine Notizen vorhanden, Config entfernen
    if (variantId === 'default' && !componentConfig.notes) {
      const { [componentId]: removed, ...rest } = currentConfig;
      handleChange('component_config', rest);
    } else {
      handleChange('component_config', {
        ...currentConfig,
        [componentId]: { ...componentConfig, variant: variantId }
      });
    }
  };

  const setComponentNotes = (componentId, notes) => {
    const currentConfig = formData.component_config || {};
    const componentConfig = currentConfig[componentId] || {};

    // Wenn keine Notizen und default Variante, Config entfernen
    if (!notes && (!componentConfig.variant || componentConfig.variant === 'default')) {
      const { [componentId]: removed, ...rest } = currentConfig;
      handleChange('component_config', rest);
    } else {
      handleChange('component_config', {
        ...currentConfig,
        [componentId]: { ...componentConfig, notes }
      });
    }
  };

  const getComponentConfig = (componentId) => {
    return (formData.component_config || {})[componentId] || { variant: 'default', notes: '' };
  };

  const hasComponentConfig = (componentId) => {
    const config = (formData.component_config || {})[componentId];
    return config && (config.variant !== 'default' || config.notes);
  };

  const configuredComponentsCount = Object.keys(formData.component_config || {}).filter(
    id => hasComponentConfig(id)
  ).length;

  const canUseStatus = (key) => {
    if (key === 'std') return isFeatureIncluded(formData.package, 'save_the_date') || (formData.addons || []).includes('save_the_date');
    if (key === 'archive') return isFeatureIncluded(formData.package, 'archive') || (formData.addons || []).includes('archive');
    return true;
  };

  const toggleComponent = (compId) => {
    const comp = ALL_COMPONENTS.find(c => c.id === compId);
    if (comp?.core) return;
    const current = formData.active_components || [];
    handleChange('active_components', current.includes(compId) ? current.filter(i => i !== compId) : [...current, compId]);
  };


  const activeExtraCount = useMemo(() => (formData.active_components || []).filter(id => !CORE_COMPONENTS.includes(id)).length, [formData.active_components]);
  const allowedExtraCount = useMemo(() => (PACKAGES[formData.package]?.extraComponentsIncluded || 0) + (formData.extra_components_count || 0), [formData.package, formData.extra_components_count]);
  const isOverLimit = activeExtraCount > allowedExtraCount && allowedExtraCount < 999;

  const handleDragStart = (e, compId) => { setDraggedItem(compId); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, compId) => {
    e.preventDefault();
    if (draggedItem === compId) return;
    const newOrder = [...(formData.component_order || DEFAULT_COMPONENT_ORDER)];
    const di = newOrder.indexOf(draggedItem), ti = newOrder.indexOf(compId);
    newOrder.splice(di, 1);
    newOrder.splice(ti, 0, draggedItem);
    handleChange('component_order', newOrder);
  };
  const handleDragEnd = () => setDraggedItem(null);

  // Gäste-Passwort speichern (via Supabase RPC)
  const handleSaveGuestPassword = async () => {
    if (!formData.guest_password) {
      toast.error('Bitte Passwort eingeben');
      return;
    }
    
    setIsSavingPassword(true);
    try {
      // Rufe Supabase RPC Funktion auf (serverseitig, sicher)
      const { data, error } = await supabase.rpc('set_project_password', {
        project_id: id,
        new_password: formData.guest_password
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success('Gäste-Passwort gesetzt!');
        // Update lokalen State
        setFormData(prev => ({ ...prev, password_hash: 'set', guest_password: '' }));
      } else {
        throw new Error(data?.error || 'Unbekannter Fehler');
      }
    } catch (err) {
      console.error('Error setting password:', err);
      toast.error('Fehler beim Setzen des Passworts');
    }
    setIsSavingPassword(false);
  };

  const handleSave = async () => {
    // Validierung: Hochzeitsdatum muss in der Zukunft liegen
    if (formData.wedding_date) {
      const weddingDate = new Date(formData.wedding_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (weddingDate < today) {
        toast.error('Hochzeitsdatum muss in der Zukunft liegen');
        return;
      }
    }

    setIsSaving(true);
    const { error } = await updateProject(id, {
      client_name: formData.client_name, client_email: formData.client_email, client_phone: formData.client_phone,
      client_street: formData.client_street, client_house_number: formData.client_house_number,
      client_zip: formData.client_zip, client_city: formData.client_city, client_country: formData.client_country,
      client_notes: formData.client_notes,
      partner1_name: formData.partner1_name, partner2_name: formData.partner2_name,
      couple_names: `${formData.partner1_name || ''} & ${formData.partner2_name || ''}`.trim(),
      wedding_date: formData.wedding_date || null, slug: formData.slug, location: formData.location,
      hashtag: formData.hashtag, display_email: formData.display_email, display_phone: formData.display_phone,
      package: formData.package, addons: formData.addons, extra_components_count: formData.extra_components_count,
      discount: formData.discount, custom_price: formData.custom_price, custom_extras: formData.custom_extras || [],
      total_price: pricing.total,
      theme: formData.theme, status: formData.status, admin_password: formData.admin_password,
      custom_domain: formData.custom_domain, active_components: formData.active_components,
      component_order: formData.component_order,
      component_config: formData.component_config || {},
      std_date: formData.std_date || null, archive_date: formData.archive_date || null,
      password_protected: formData.password_protected || false,
      favicon_emoji: formData.favicon_emoji || null,
      // Hosting fields
      hosting_start_date: formData.hosting_start_date || null,
      hosting_end_date: formData.hosting_end_date || null,
      has_std: formData.has_std || false,
      has_archive: formData.has_archive || false,
      std_end_date: formData.std_end_date || null,
      archive_end_date: formData.archive_end_date || null,
      // Kundenabwicklung fields
      contract_number: formData.contract_number || null,
      contract_date: formData.contract_date || null,
      contract_sent: formData.contract_sent || false,
      contract_sent_date: formData.contract_sent_date || null,
      contract_signed: formData.contract_signed || false,
      contract_signed_date: formData.contract_signed_date || null,
      deposit_invoice_number: formData.deposit_invoice_number || null,
      deposit_invoice_date: formData.deposit_invoice_date || null,
      deposit_paid: formData.deposit_paid || false,
      deposit_paid_date: formData.deposit_paid_date || null,
      deposit_amount: formData.deposit_amount || null,
      final_invoice_number: formData.final_invoice_number || null,
      final_invoice_date: formData.final_invoice_date || null,
      final_paid: formData.final_paid || false,
      final_paid_date: formData.final_paid_date || null,
      final_amount: formData.final_amount || null,
      workflow_notes: formData.workflow_notes || null,
      // QR-Code Design
      qr_style: formData.qr_style || 'square',
      qr_color: formData.qr_color || '#000000',
      qr_logo_type: formData.qr_logo_type || '',
      qr_logo_text: formData.qr_logo_text || '',
      qr_logo_image: formData.qr_logo_image || '',
      qr_frame_style: formData.qr_frame_style || 'none',
      qr_frame_text: formData.qr_frame_text || '',
    });
    if (error) { toast.error('Fehler beim Speichern'); console.error(error); }
    else { 
      toast.success('Gespeichert!'); 
      // Update project ohne State-Reset der Scroll-Position
      setProject(prev => ({ ...prev, ...formData, total_price: pricing.total }));

      // Partner-Benachrichtigung bei Zahlungsstatus-Änderung
      if (formData.partner_code_id) {
        const prevDeposit = project?.deposit_paid || false;
        const prevFinal = project?.final_paid || false;
        const nowDeposit = formData.deposit_paid || false;
        const nowFinal = formData.final_paid || false;

        if ((!prevDeposit && nowDeposit) || (!prevFinal && nowFinal)) {
          // Partner-Code laden für E-Mail
          try {
            const { data: pc } = await getPartnerCodeById(formData.partner_code_id);
            if (pc?.partner_email) {
              const isDeposit = !prevDeposit && nowDeposit;
              const isFinal = !prevFinal && nowFinal;
              const isFullyPaid = nowDeposit && nowFinal;
              const totalPrice = pricing.total || formData.total_price || 0;
              const depositAmount = formData.deposit_amount || 0;
              const finalAmount = formData.final_amount || 0;

              // Provisionslogik: max(Gesamtpreis × %, Gutscheinwert)
              // Bei Paketen unter 1.500€ kann 10% < 150€ sein → dann gilt Gutscheinwert
              const percentProvision = totalPrice * (pc.commission_percent || 10) / 100;
              const discountAmount = pc.discount_amount || 150;
              const totalProvision = Math.max(percentProvision, discountAmount);

              const paymentType = isDeposit ? 'Erste Teilzahlung (50%)' : 'Restzahlung';
              const currentAmount = isDeposit ? depositAmount : finalAmount;

              await adminFetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: pc.partner_email,
                  toName: pc.partner_name,
                  subject: `${isDeposit ? 'Anzahlung' : 'Restzahlung'} eingegangen – ${formData.couple_names || formData.partner1_name}`,
                  htmlContent: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                      <div style="background: #000; color: #fff; display: inline-block; padding: 8px 16px; font-weight: 700; font-size: 18px; letter-spacing: -0.06em; margin-bottom: 30px;">S&amp;I.</div>
                      <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a;">${isDeposit ? 'Anzahlung' : 'Restzahlung'} eingegangen!</h1>
                      <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Gute Neuigkeiten zu eurem vermittelten Paar.</p>
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 12px 0; color: #888; width: 160px;">Paar</td>
                          <td style="padding: 12px 0; color: #1a1a1a; font-weight: 500;">${formData.couple_names || formData.partner1_name || '–'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 12px 0; color: #888;">${paymentType}</td>
                          <td style="padding: 12px 0; color: #1a1a1a; font-weight: 600;">${currentAmount ? currentAmount.toLocaleString('de-DE') + ' €' : '–'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 12px 0; color: #888;">Gesamtbetrag Paket</td>
                          <td style="padding: 12px 0; color: #1a1a1a;">${totalPrice ? totalPrice.toLocaleString('de-DE') + ' €' : '–'}</td>
                        </tr>
                        <tr style="border-bottom: 2px solid #059669;">
                          <td style="padding: 12px 0; color: #888;">Eure Provision</td>
                          <td style="padding: 12px 0; color: #059669; font-weight: 700; font-size: 1.1rem;">${totalProvision.toFixed(2).replace('.', ',')} €</td>
                        </tr>
                      </table>
                      ${isFullyPaid 
                        ? '<div style="background: #D1FAE5; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px;"><p style="color: #065F46; font-size: 14px; font-weight: 600; margin: 0;">Das Projekt ist vollständig bezahlt. Eure Provision von ' + totalProvision.toFixed(2).replace('.', ',') + ' € wird in Kürze überwiesen.</p></div>'
                        : '<p style="color: #666; font-size: 14px; line-height: 1.6;">Die Provision von <strong>' + totalProvision.toFixed(2).replace('.', ',') + ' €</strong> erhaltet ihr nach vollständiger Zahlung des Paares.</p>'}
                      <p style="color: #999; font-size: 12px; margin-top: 8px;">Provision: ${pc.commission_percent}% vom Gesamtbetrag${totalProvision > percentProvision ? ' (mind. ' + discountAmount + ' € Gutscheinwert)' : ''}.</p>
                      <p style="color: #ccc; font-size: 12px; margin-top: 40px;">Automatische Benachrichtigung von S&I. Wedding</p>
                    </div>
                  `,
                }),
              });
              toast.success(`Partner-Benachrichtigung an ${pc.partner_name} gesendet`);
            }
          } catch (err) {
            console.error('Partner notification error:', err);
            // Nicht blockierend – Speichern war erfolgreich
          }
        }
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Projekt wirklich löschen?')) return;
    const { error } = await deleteProject(id);
    if (error) toast.error('Fehler beim Löschen');
    else { toast.success('Projekt gelöscht'); navigate('/projects'); }
  };

  const handleGenerateContract = () => {
    try {
      const result = generateContractPDF(formData, pricing);
      toast.success(`Vertrag erstellt: ${result.filename}`);
    } catch (e) {
      toast.error('PDF-Fehler');
      console.error(e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopiert!');
  };

  // Email Functions - Real Brevo Integration
  const handleSendWelcome = async () => {
    if (!formData.client_email) {
      toast.error('Keine Kunden-E-Mail hinterlegt!');
      return;
    }
    setSendingEmail(true);
    const projectData = { ...formData, id };
    const result = await sendWelcomeEmails(projectData);
    
    if (result.welcome.success && result.credentials.success) {
      toast.success('Willkommens-E-Mails gesendet!');
    } else {
      toast.error('Fehler: ' + (result.welcome.error || result.credentials.error));
    }
    loadEmailLogs();
    setSendingEmail(false);
  };

  const handleSendGoLive = async () => {
    if (!formData.client_email) {
      toast.error('Keine Kunden-E-Mail hinterlegt!');
      return;
    }
    setSendingEmail(true);
    const result = await sendGoLiveEmail({ ...formData, id });
    
    if (result.success) {
      toast.success('Go-Live E-Mail gesendet!');
    } else {
      toast.error('Fehler: ' + result.error);
    }
    loadEmailLogs();
    setSendingEmail(false);
  };

  const handleSendReminder = async () => {
    if (!formData.client_email) {
      toast.error('Keine Kunden-E-Mail hinterlegt!');
      return;
    }
    setSendingEmail(true);
    const result = await sendReminderEmail({ ...formData, id });
    
    if (result.success) {
      toast.success('Erinnerung gesendet!');
    } else {
      toast.error('Fehler: ' + result.error);
    }
    loadEmailLogs();
    setSendingEmail(false);
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Neues Passwort generieren und per E-Mail senden?')) return;
    setSendingEmail(true);
    
    // Sichere Passwort-Generierung mit crypto API
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    const newPw = Array.from(array).map(x => chars[x % chars.length]).join('');

    await updateProject(id, { admin_password: newPw });
    setFormData(prev => ({ ...prev, admin_password: newPw }));

    if (formData.client_email) {
      const result = await sendPasswordResetEmail({ ...formData, id }, newPw);
      if (result.success) {
        // SICHERHEIT: Passwort NICHT im Toast anzeigen!
        toast.success('Neues Passwort generiert und per E-Mail versendet');
      } else {
        toast.error(`E-Mail konnte nicht gesendet werden: ${result.error}`);
      }
    } else {
      toast.success('Neues Passwort generiert (keine E-Mail - Kunde hat keine E-Mail-Adresse)');
    }
    loadEmailLogs();
    setSendingEmail(false);
  };

  if (isLoading) return <Layout><div style={{ padding: '2rem' }}>Laden...</div></Layout>;
  if (!project) return <Layout><div style={{ padding: '2rem' }}>Projekt nicht gefunden</div></Layout>;

  const status = PROJECT_STATUS[formData.status];
  const baseUrl = formData.custom_domain || `siwedding.de/${formData.slug}`;
  const coupleNames = formData.partner1_name && formData.partner2_name ? `${formData.partner1_name} & ${formData.partner2_name}` : 'Unbenannt';
  const componentOrder = formData.component_order || DEFAULT_COMPONENT_ORDER;
  const emailCount = emailLogs.length;

  return (
    <Layout>
      <Header>
        <HeaderLeft>
          <BackLink to="/projects">← Projekte</BackLink>
          <TitleRow>
            <Title>{coupleNames}</Title>
            <StatusBadge $color={status?.color}>{status?.label}</StatusBadge>
          </TitleRow>
        </HeaderLeft>
        <Actions>
          <Button $danger onClick={handleDelete}>Löschen</Button>
        </Actions>
      </Header>

      <Grid>
        <MainColumn>
          {/* Section 01: Kundendaten */}
          <CollapsibleSection number="01" title="Kundendaten" badge="Intern" defaultOpen={false}>
            <FormGrid>
              <FormGroup className="full-width"><Label>Kundenname</Label><Input value={formData.client_name || ''} onChange={e => handleChange('client_name', e.target.value)} /></FormGroup>
              <FormGroup><Label>E-Mail</Label><Input type="email" value={formData.client_email || ''} onChange={e => handleChange('client_email', e.target.value)} /></FormGroup>
              <FormGroup><Label>Telefon</Label><PhoneInput value={formData.client_phone || ''} onChange={val => handleChange('client_phone', val)} placeholder="176 1234567" /></FormGroup>
              <FormGroup className="full-width">
                <AddressAutocomplete
                  street={formData.client_street}
                  houseNumber={formData.client_house_number}
                  zip={formData.client_zip}
                  city={formData.client_city}
                  country={formData.client_country}
                  onChange={handleChange}
                />
              </FormGroup>
              <FormGroup className="full-width"><Label>Notizen</Label><TextArea value={formData.client_notes || ''} onChange={e => handleChange('client_notes', e.target.value)} /></FormGroup>
            </FormGrid>
          </CollapsibleSection>

          {/* Section 02: Hochzeits-Website */}
          <CollapsibleSection number="02" title="Hochzeits-Website" defaultOpen={false}>
            <FormGrid>
              <FormGroup><Label>Partner 1</Label><Input value={formData.partner1_name || ''} onChange={e => handleChange('partner1_name', e.target.value)} /></FormGroup>
              <FormGroup><Label>Partner 2</Label><Input value={formData.partner2_name || ''} onChange={e => handleChange('partner2_name', e.target.value)} /></FormGroup>
              <FormGroup><Label>Hochzeitsdatum</Label><Input type="date" value={formData.wedding_date?.split('T')[0] || ''} onChange={e => handleChange('wedding_date', e.target.value)} min={new Date().toISOString().split('T')[0]} /></FormGroup>
              <FormGroup><Label>Slug</Label><Input value={formData.slug || ''} onChange={e => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /></FormGroup>
              <FormGroup><Label>Location</Label><Input value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} /></FormGroup>
              <FormGroup><Label>Hashtag</Label><Input value={formData.hashtag || ''} onChange={e => handleChange('hashtag', e.target.value)} /></FormGroup>
            </FormGrid>
          </CollapsibleSection>

          {/* Section 03: Paket & Einstellungen */}
          <CollapsibleSection number="03" title="Paket & Einstellungen" defaultOpen={false}>
            <Label>Paket</Label>
            <PackageSelector>
              {Object.values(PACKAGES).map(p => (
                <PackageCard key={p.id} $selected={formData.package === p.id} onClick={() => handleChange('package', p.id)}>
                  <div className="name">{p.name}</div>
                  <div className="price">{p.price > 0 ? formatPrice(p.price) : 'Individuell'}</div>
                  <div className="price-note">{p.hosting}</div>
                </PackageCard>
              ))}
            </PackageSelector>
            
            <FeatureList>
              <div className="title">Enthalten</div>
              <ul>{selectedPackage.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </FeatureList>
            
            {!isIndividual && (
              <AddonsSection>
                <div className="title">Zusatzoptionen</div>
                {['save_the_date', 'archive', 'qr_code', 'invitation_design'].map(addonId => {
                  const addon = ADDONS[addonId];
                  if (!addon) return null;
                  const included = isFeatureIncluded(formData.package, addonId);
                  const selected = (formData.addons || []).includes(addonId);
                  return (
                    <AddonItem key={addonId} $included={included} $selected={selected} onClick={() => toggleAddon(addonId)}>
                      <div className="checkbox">{(included || selected) && '✓'}</div>
                      <div className="info">
                        <div className="name">{addon.name}</div>
                        <div className="description">{addon.description}</div>
                      </div>
                      {included ? <span className="included-badge">Im Paket</span> : <div className="price">+{formatPrice(getAddonPrice(addonId, formData.package))}</div>}
                    </AddonItem>
                  );
                })}
                
                {selectedPackage.extraComponentsIncluded < 999 && (
                  <ExtraComponentsRow>
                    <div className="info">
                      <div className="name">Extra Komponenten</div>
                      <div className="description">{selectedPackage.extraComponentsIncluded} inkl., weitere je {formatPrice(50)}</div>
                    </div>
                    <div className="counter">
                      <button onClick={() => handleChange('extra_components_count', Math.max(0, (formData.extra_components_count || 0) - 1))} disabled={!formData.extra_components_count}>−</button>
                      <span>{formData.extra_components_count || 0}</span>
                      <button onClick={() => handleChange('extra_components_count', (formData.extra_components_count || 0) + 1)}>+</button>
                    </div>
                    <div className="price">+{formatPrice(Math.max(0, (formData.extra_components_count || 0) - selectedPackage.extraComponentsIncluded) * 50)}</div>
                  </ExtraComponentsRow>
                )}
                
                <ExtraComponentsRow>
                  <div className="info"><div className="name">Rabatt</div></div>
                  <Input type="number" value={formData.discount || 0} onChange={e => handleChange('discount', parseFloat(e.target.value) || 0)} style={{ width: '120px', textAlign: 'right' }} />
                </ExtraComponentsRow>

                {/* Custom Extras */}
                <CustomExtrasSection>
                  <CustomExtrasTitle>
                    <span className="title">Individuelle Extras</span>
                    <AddExtraButton onClick={addCustomExtra}>+ Extra hinzufügen</AddExtraButton>
                  </CustomExtrasTitle>

                  {(formData.custom_extras || []).map(extra => (
                    <CustomExtraItem key={extra.id}>
                      <div className="extra-header">
                        <input
                          className="extra-title-input"
                          type="text"
                          value={extra.title}
                          onChange={e => updateCustomExtra(extra.id, 'title', e.target.value)}
                          placeholder="Titel (z.B. Designanpassung Countdown)"
                        />
                        <div className="extra-amount">
                          <input
                            type="number"
                            value={extra.amount || ''}
                            onChange={e => updateCustomExtra(extra.id, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <span>€</span>
                        </div>
                      </div>
                      <textarea
                        className="extra-description"
                        value={extra.description}
                        onChange={e => updateCustomExtra(extra.id, 'description', e.target.value)}
                        placeholder="Detaillierte Beschreibung für Vertrag/Rechnung (z.B. Runde Uhr mit Gold-Akzenten statt Standard-Flip-Counter, Animation bei Ziffernwechsel)"
                      />
                      <div className="extra-footer">
                        <button className="delete-btn" onClick={() => deleteCustomExtra(extra.id)}>✕ Entfernen</button>
                      </div>
                    </CustomExtraItem>
                  ))}

                  {(formData.custom_extras || []).length > 0 && (
                    <CustomExtrasSummary>
                      <span className="label">Individuelle Extras gesamt</span>
                      <span className="total">+{formatPrice(pricing.customExtrasPrice)}</span>
                    </CustomExtrasSummary>
                  )}
                </CustomExtrasSection>
              </AddonsSection>
            )}
            
            {isIndividual && (
              <AddonsSection>
                <div className="title">Individueller Preis</div>
                <ExtraComponentsRow>
                  <div className="info">
                    <div className="name">Gesamtpreis</div>
                    <div className="description">Dieser Preis wird im Vertrag verwendet</div>
                  </div>
                  <Input type="number" value={formData.custom_price || 0} onChange={e => handleChange('custom_price', parseFloat(e.target.value) || 0)} style={{ width: '150px', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }} />
                </ExtraComponentsRow>
              </AddonsSection>
            )}
            
            <PriceSummary>
              {!isIndividual && (
                <>
                  <div className="row"><span className="label">Paket ({selectedPackage.name})</span><span>{formatPrice(pricing.packagePrice)}</span></div>
                  {pricing.addonsPrice > 0 && <div className="row"><span className="label">Zusatzoptionen</span><span>+{formatPrice(pricing.addonsPrice)}</span></div>}
                  {pricing.extraComponentsPrice > 0 && <div className="row"><span className="label">Extra Komponenten</span><span>+{formatPrice(pricing.extraComponentsPrice)}</span></div>}
                  {pricing.customExtrasPrice > 0 && <div className="row"><span className="label">Individuelle Extras</span><span>+{formatPrice(pricing.customExtrasPrice)}</span></div>}
                  {pricing.discount > 0 && <div className="row discount"><span className="label">Rabatt</span><span>-{formatPrice(pricing.discount)}</span></div>}
                </>
              )}
              {isIndividual && (
                <>
                  <div className="row"><span className="label">Individual-Paket</span><span>{formatPrice(formData.custom_price || 0)}</span></div>
                  {pricing.customExtrasPrice > 0 && <div className="row"><span className="label">Individuelle Extras</span><span>+{formatPrice(pricing.customExtrasPrice)}</span></div>}
                </>
              )}
              <div className="row total"><span className="label">Gesamt</span><span>{formatPrice(pricing.total)}</span></div>
            </PriceSummary>
            
            <SettingsGrid>
              <FormGroup><Label>Theme</Label><Select value={formData.theme || 'botanical'} onChange={e => handleChange('theme', e.target.value)}>{Object.values(THEMES).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></FormGroup>
              <FormGroup><Label>Status</Label><Select value={formData.status || 'draft'} onChange={e => handleChange('status', e.target.value)}>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k} disabled={!canUseStatus(k)}>{v.label}{!canUseStatus(k) && ' (nicht gebucht)'}</option>)}</Select></FormGroup>
              <FormGroup><Label>STD-Datum (Save the Date)</Label><Input type="date" value={formData.std_date?.split('T')[0] || ''} onChange={e => handleChange('std_date', e.target.value)} disabled={!canUseStatus('std')} /></FormGroup>
              <FormGroup><Label>Archiv-Datum</Label><Input type="date" value={formData.archive_date?.split('T')[0] || ''} onChange={e => handleChange('archive_date', e.target.value)} disabled={!canUseStatus('archive')} /></FormGroup>
              <FormGroup><Label>Admin Passwort</Label><Input value={formData.admin_password || ''} onChange={e => handleChange('admin_password', e.target.value)} /></FormGroup>
              <FormGroup><Label>Custom Domain</Label><Input value={formData.custom_domain || ''} onChange={e => handleChange('custom_domain', e.target.value.toLowerCase())} placeholder="anna-max.de" /></FormGroup>
            </SettingsGrid>

            {/* Favicon Emoji */}
            <FormGroup style={{ marginTop: '1rem' }}>
              <Label>Tab-Icon (Favicon Emoji)</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                {['💍','🌸','🤍','✨','🕊️','🌿','🥂','🌹','💐','🎀','🪷','⚘'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleChange('favicon_emoji', formData.favicon_emoji === emoji ? '' : emoji)}
                    style={{
                      width: 40, height: 40, fontSize: '1.3rem', borderRadius: 6, cursor: 'pointer',
                      border: formData.favicon_emoji === emoji ? '2px solid #C41E3A' : '2px solid #ddd',
                      background: formData.favicon_emoji === emoji ? '#fff0f0' : '#fff',
                    }}
                  >{emoji}</button>
                ))}
              </div>
              <Input
                type="text"
                value={formData.favicon_emoji || ''}
                onChange={e => handleChange('favicon_emoji', e.target.value)}
                placeholder="Emoji eingeben oder oben auswählen…"
                maxLength={4}
                style={{ fontSize: '1.2rem', maxWidth: 280 }}
              />
            </FormGroup>
            
            {/* Gäste-Passwortschutz */}
            <PasswordProtectionBox>
              <PasswordHeader>
                <PasswordToggle 
                  $active={formData.password_protected}
                  onClick={() => handleChange('password_protected', !formData.password_protected)}
                >
                  <span className="checkbox">{formData.password_protected && '✓'}</span>
                  <span className="label">🔐 Passwortschutz für Gäste</span>
                </PasswordToggle>
                <span className="hint">Gäste müssen Passwort eingeben, um die Website zu sehen</span>
              </PasswordHeader>
              
              {formData.password_protected && (
                <PasswordInputRow>
                  <Input 
                    type="text"
                    value={formData.guest_password || ''} 
                    onChange={e => handleChange('guest_password', e.target.value)}
                    placeholder="Gäste-Passwort eingeben..."
                  />
                  <PasswordSaveButton 
                    onClick={handleSaveGuestPassword}
                    disabled={!formData.guest_password || isSavingPassword}
                  >
                    {isSavingPassword ? '...' : 'Speichern'}
                  </PasswordSaveButton>
                </PasswordInputRow>
              )}
              
              {formData.password_protected && formData.password_hash && (
                <PasswordStatus $set={true}>
                  ✓ Passwort ist gesetzt
                </PasswordStatus>
              )}
            </PasswordProtectionBox>

            {/* Hosting-Übersicht */}
            <HostingSection>
              <HostingSectionTitle>
                <span className="icon">📅</span>
                <span className="title">Hosting & Laufzeiten</span>
              </HostingSectionTitle>

              {(() => {
                const calculated = calculateHostingDates(formData.wedding_date, formData.package, formData.status);
                const hostingStart = formData.hosting_start_date || calculated.start;
                const hostingEnd = formData.hosting_end_date || calculated.end;
                const daysRemaining = getDaysRemaining(hostingEnd);
                const isWarning = daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0;
                const isExpired = daysRemaining !== null && daysRemaining <= 0;

                return (
                  <>
                    <HostingGrid>
                      <HostingCard>
                        <div className="label">Hosting Start</div>
                        <div className="value">{formatDateDE(hostingStart)}</div>
                        <div className="hint">{getHostingMonths(formData.package)} Monate ({selectedPackage.name})</div>
                      </HostingCard>
                      <HostingCard $warning={isWarning} $success={!isWarning && !isExpired && daysRemaining !== null}>
                        <div className="label">Hosting Ende</div>
                        <div className="value">
                          {formatDateDE(hostingEnd)}
                          {daysRemaining !== null && (
                            <> ({isExpired ? 'abgelaufen' : `${daysRemaining} Tage`})</>
                          )}
                        </div>
                      </HostingCard>
                      {formData.has_std && (
                        <HostingCard>
                          <div className="label">STD Ende</div>
                          <div className="value">{formatDateDE(formData.std_end_date || calculated.stdEnd)}</div>
                          <div className="hint">Save the Date → Live</div>
                        </HostingCard>
                      )}
                      {formData.has_archive && (
                        <HostingCard>
                          <div className="label">Archiv Ende</div>
                          <div className="value">{formatDateDE(formData.archive_end_date || calculated.archiveEnd)}</div>
                          <div className="hint">3 Monate nach Hochzeit</div>
                        </HostingCard>
                      )}
                    </HostingGrid>

                    <HostingToggleRow>
                      <HostingToggle $active={formData.has_std} onClick={() => handleChange('has_std', !formData.has_std)}>
                        <span className="checkbox">{formData.has_std && '✓'}</span>
                        <span className="label">Save the Date</span>
                      </HostingToggle>
                      <HostingToggle $active={formData.has_archive} onClick={() => handleChange('has_archive', !formData.has_archive)}>
                        <span className="checkbox">{formData.has_archive && '✓'}</span>
                        <span className="label">Archiv</span>
                      </HostingToggle>
                    </HostingToggleRow>

                    <HostingOverrideSection>
                      <HostingOverrideToggle onClick={() => setShowHostingOverride(!showHostingOverride)}>
                        {showHostingOverride ? '▼ Manuelle Daten ausblenden' : '▶ Daten manuell überschreiben'}
                      </HostingOverrideToggle>

                      {showHostingOverride && (
                        <HostingOverrideFields>
                          <FormGroup>
                            <Label>Hosting Start</Label>
                            <Input
                              type="date"
                              value={formData.hosting_start_date?.split('T')[0] || ''}
                              onChange={e => handleChange('hosting_start_date', e.target.value)}
                              placeholder="Auto-berechnet"
                            />
                          </FormGroup>
                          <FormGroup>
                            <Label>Hosting Ende</Label>
                            <Input
                              type="date"
                              value={formData.hosting_end_date?.split('T')[0] || ''}
                              onChange={e => handleChange('hosting_end_date', e.target.value)}
                              placeholder="Auto-berechnet"
                            />
                          </FormGroup>
                          <FormGroup>
                            <Label>STD Ende</Label>
                            <Input
                              type="date"
                              value={formData.std_end_date?.split('T')[0] || ''}
                              onChange={e => handleChange('std_end_date', e.target.value)}
                              placeholder="Auto: Hochzeitsdatum"
                              disabled={!formData.has_std}
                            />
                          </FormGroup>
                          <FormGroup>
                            <Label>Archiv Ende</Label>
                            <Input
                              type="date"
                              value={formData.archive_end_date?.split('T')[0] || ''}
                              onChange={e => handleChange('archive_end_date', e.target.value)}
                              placeholder="Auto: +3 Mon. nach Hochzeit"
                              disabled={!formData.has_archive}
                            />
                          </FormGroup>
                        </HostingOverrideFields>
                      )}
                    </HostingOverrideSection>
                  </>
                );
              })()}
            </HostingSection>
          </CollapsibleSection>

          {/* Section 04: Kundenabwicklung */}
          <CollapsibleSection number="04" title="Kundenabwicklung" badge={formData.contract_signed && formData.deposit_paid ? '✓ Komplett' : 'Offen'} defaultOpen={false}>
            {formData.coupon_code && (
              <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🤝 <strong>Partner-Projekt</strong> — Gutscheincode: <code style={{ background: '#fff', padding: '0.15rem 0.4rem', fontWeight: 600 }}>{formData.coupon_code}</code></span>
                <span style={{ color: '#92400E', fontSize: '0.75rem' }}>Partner wird bei Zahlung automatisch benachrichtigt</span>
              </div>
            )}
            <WorkflowSection>
              {/* Vertrag */}
              <WorkflowCard $complete={formData.contract_signed}>
                <div className="card-header">
                  <span className="card-title">📄 Vertrag</span>
                  <span className="status-badge">
                    {formData.contract_signed ? 'Unterschrieben' : formData.contract_sent ? 'Gesendet' : 'Ausstehend'}
                  </span>
                </div>

                <WorkflowCheckbox
                  $checked={formData.contract_sent}
                  onClick={() => {
                    const now = new Date().toISOString();
                    handleChange('contract_sent', !formData.contract_sent);
                    if (!formData.contract_sent) handleChange('contract_sent_date', now);
                  }}
                >
                  <span className="checkbox">{formData.contract_sent && '✓'}</span>
                  <span className="text">Vertrag gesendet</span>
                  {formData.contract_sent_date && (
                    <span className="date">{new Date(formData.contract_sent_date).toLocaleDateString('de-DE')}</span>
                  )}
                </WorkflowCheckbox>

                <WorkflowCheckbox
                  $checked={formData.contract_signed}
                  onClick={() => {
                    const now = new Date().toISOString();
                    handleChange('contract_signed', !formData.contract_signed);
                    if (!formData.contract_signed) handleChange('contract_signed_date', now);
                  }}
                >
                  <span className="checkbox">{formData.contract_signed && '✓'}</span>
                  <span className="text">Vertrag unterschrieben</span>
                  {formData.contract_signed_date && (
                    <span className="date">{new Date(formData.contract_signed_date).toLocaleDateString('de-DE')}</span>
                  )}
                </WorkflowCheckbox>

                {formData.contract_number && (
                  <WorkflowRow>
                    <span className="label">Vertragsnummer</span>
                    <span className="value">{formData.contract_number}</span>
                  </WorkflowRow>
                )}

                <PDFButtons>
                  <PDFButton $primary onClick={() => {
                    const result = generateContractPDF(formData, pricing);
                    handleChange('contract_number', result.contractNumber);
                    handleChange('contract_date', new Date().toISOString().split('T')[0]);
                    toast.success(`Vertrag erstellt: ${result.filename}`);
                  }}>
                    📄 Vertrag PDF
                  </PDFButton>
                </PDFButtons>
              </WorkflowCard>

              {/* Zahlungen */}
              <WorkflowCard $complete={formData.deposit_paid && formData.final_paid}>
                <div className="card-header">
                  <span className="card-title">💰 Zahlungen</span>
                  <span className="status-badge">
                    {formData.deposit_paid && formData.final_paid ? 'Bezahlt' : formData.deposit_paid ? '50%' : 'Ausstehend'}
                  </span>
                </div>

                <PaymentInputRow $paid={formData.deposit_paid}>
                  <span
                    className="checkbox"
                    onClick={() => {
                      const now = new Date().toISOString().split('T')[0];
                      handleChange('deposit_paid', !formData.deposit_paid);
                      if (!formData.deposit_paid && !formData.deposit_amount) {
                        handleChange('deposit_paid_date', now);
                        handleChange('deposit_amount', pricing.total / 2);
                      }
                    }}
                  >
                    {formData.deposit_paid && '✓'}
                  </span>
                  <span className="label">Anzahlung (50%)</span>
                  <input
                    type="number"
                    className="amount-input"
                    value={formData.deposit_amount || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      handleChange('deposit_amount', val);
                      if (val > 0 && !formData.deposit_paid) {
                        handleChange('deposit_paid', true);
                        handleChange('deposit_paid_date', new Date().toISOString().split('T')[0]);
                      }
                    }}
                    placeholder="0,00"
                  />
                  <span className="expected">/ {formatPrice(pricing.total / 2)}</span>
                  {formData.deposit_paid_date && (
                    <span className="date">{new Date(formData.deposit_paid_date).toLocaleDateString('de-DE')}</span>
                  )}
                </PaymentInputRow>

                <PaymentInputRow $paid={formData.final_paid}>
                  <span
                    className="checkbox"
                    onClick={() => {
                      const now = new Date().toISOString().split('T')[0];
                      handleChange('final_paid', !formData.final_paid);
                      if (!formData.final_paid && !formData.final_amount) {
                        handleChange('final_paid_date', now);
                        handleChange('final_amount', pricing.total / 2);
                      }
                    }}
                  >
                    {formData.final_paid && '✓'}
                  </span>
                  <span className="label">Restzahlung (50%)</span>
                  <input
                    type="number"
                    className="amount-input"
                    value={formData.final_amount || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      handleChange('final_amount', val);
                      if (val > 0 && !formData.final_paid) {
                        handleChange('final_paid', true);
                        handleChange('final_paid_date', new Date().toISOString().split('T')[0]);
                      }
                    }}
                    placeholder="0,00"
                  />
                  <span className="expected">/ {formatPrice(pricing.total / 2)}</span>
                  {formData.final_paid_date && (
                    <span className="date">{new Date(formData.final_paid_date).toLocaleDateString('de-DE')}</span>
                  )}
                </PaymentInputRow>

                <WorkflowRow>
                  <span className="label">Gesamt bezahlt</span>
                  <span className={`value ${(formData.deposit_amount || 0) + (formData.final_amount || 0) >= pricing.total ? 'success' : 'pending'}`}>
                    {formatPrice((formData.deposit_amount || 0) + (formData.final_amount || 0))} / {formatPrice(pricing.total)}
                  </span>
                </WorkflowRow>

                <PDFButtons>
                  <PDFButton onClick={() => {
                    const result = generateInvoicePDF(formData, pricing, { isDeposit: true });
                    handleChange('deposit_invoice_number', result.invoiceNumber);
                    handleChange('deposit_invoice_date', new Date().toISOString().split('T')[0]);
                    toast.success(`Anzahlungsrechnung erstellt: ${result.filename}`);
                  }}>
                    📃 Anzahlung
                  </PDFButton>
                  <PDFButton onClick={() => {
                    const result = generateInvoicePDF(formData, pricing, { isFinal: true, depositPaid: formData.deposit_paid });
                    handleChange('final_invoice_number', result.invoiceNumber);
                    handleChange('final_invoice_date', new Date().toISOString().split('T')[0]);
                    toast.success(`Schlussrechnung erstellt: ${result.filename}`);
                  }}>
                    📃 Schlussrechnung
                  </PDFButton>
                  <PDFButton $primary onClick={() => {
                    const result = generateInvoicePDF(formData, pricing);
                    toast.success(`Rechnung erstellt: ${result.filename}`);
                  }}>
                    📃 Gesamtrechnung
                  </PDFButton>
                </PDFButtons>
              </WorkflowCard>

              {/* Notizen */}
              <WorkflowNotes>
                <Label>Interne Notizen</Label>
                <TextArea
                  value={formData.workflow_notes || ''}
                  onChange={e => handleChange('workflow_notes', e.target.value)}
                  placeholder="Notizen zur Kundenabwicklung..."
                  style={{ minHeight: '80px' }}
                />
              </WorkflowNotes>
            </WorkflowSection>
          </CollapsibleSection>

          {/* Section 05: Links & QR-Code */}
          <CollapsibleSection number="05" title="Links & QR-Code" defaultOpen={false}>
            <LinkBox>
              <a href={`https://${baseUrl}`} target="_blank" rel="noopener noreferrer">{baseUrl}</a>
              <button onClick={() => copyToClipboard(`https://${baseUrl}`)}>Copy</button>
            </LinkBox>
            <LinkBox>
              <a href={`https://${baseUrl}/admin`} target="_blank" rel="noopener noreferrer">{baseUrl}/admin</a>
              <button onClick={() => copyToClipboard(`https://${baseUrl}/admin`)}>Copy</button>
            </LinkBox>
            
            {/* QR-Code Designer */}
            <QRPreviewBox>
              <QRPreviewHeader>
                <span className="title">📱 Website QR-Code</span>
                <span className="hint">
                  {(formData.addons || []).includes('qr_code') || isFeatureIncluded(formData.package, 'qr_code')
                    ? '✅ QR-Code gebucht — wird mit E-Mails verschickt'
                    : '⚪ QR-Code nicht gebucht — wird nicht verschickt'}
                </span>
              </QRPreviewHeader>
              <QRDesignerLayout>
                {/* Live Preview */}
                <QRCanvas id="website-qr-preview" data-url={`https://${baseUrl}`} />
                
                {/* Design Options */}
                <QRDesignPanel>
                  <QROptionGroup>
                    <QROptionLabel>Stil</QROptionLabel>
                    <QRButtonRow>
                      {[
                        { value: 'square', label: '■ Eckig' },
                        { value: 'rounded', label: '▢ Rund' },
                        { value: 'dots', label: '● Dots' },
                      ].map(s => (
                        <QRToggle key={s.value} $active={(formData.qr_style || 'square') === s.value}
                          onClick={() => handleChange('qr_style', s.value)}>{s.label}</QRToggle>
                      ))}
                    </QRButtonRow>
                  </QROptionGroup>

                  <QROptionGroup>
                    <QROptionLabel>Farbe</QROptionLabel>
                    <QRColorRow>
                      <input type="color" value={formData.qr_color || '#000000'} onChange={e => handleChange('qr_color', e.target.value)} />
                      <QRToggle $active={formData.qr_color === THEME_ACCENT_COLORS[formData.theme]} $small
                        onClick={() => handleChange('qr_color', THEME_ACCENT_COLORS[formData.theme] || '#000000')}>
                        Theme-Farbe
                      </QRToggle>
                      <QRToggle $active={!formData.qr_color || formData.qr_color === '#000000'} $small
                        onClick={() => handleChange('qr_color', '#000000')}>
                        Schwarz
                      </QRToggle>
                    </QRColorRow>
                  </QROptionGroup>

                  <QROptionGroup>
                    <QROptionLabel>Logo (Mitte)</QROptionLabel>
                    <QRButtonRow>
                      <QRToggle $active={!formData.qr_logo_type} onClick={() => { handleChange('qr_logo_type', ''); handleChange('qr_logo_text', ''); }}>Keins</QRToggle>
                      <QRToggle $active={formData.qr_logo_type === 'text'} onClick={() => handleChange('qr_logo_type', 'text')}>Text</QRToggle>
                      <QRToggle $active={formData.qr_logo_type === 'image'} onClick={() => handleChange('qr_logo_type', 'image')}>Bild</QRToggle>
                    </QRButtonRow>
                    {formData.qr_logo_type === 'text' && (
                      <Input value={formData.qr_logo_text || ''} onChange={e => handleChange('qr_logo_text', e.target.value)} placeholder="z.B. S&I. oder A♡N" style={{ marginTop: '0.4rem' }} />
                    )}
                    {formData.qr_logo_type === 'image' && (
                      <QRImageUpload>
                        <input type="file" accept="image/*" onChange={e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => handleChange('qr_logo_image', ev.target.result);
                          reader.readAsDataURL(file);
                        }} />
                        {formData.qr_logo_image && <img src={formData.qr_logo_image} alt="Logo" />}
                      </QRImageUpload>
                    )}
                  </QROptionGroup>

                  <QROptionGroup>
                    <QROptionLabel>Rahmen mit Text</QROptionLabel>
                    <QRButtonRow>
                      <QRToggle $active={!formData.qr_frame_style || formData.qr_frame_style === 'none'} onClick={() => handleChange('qr_frame_style', 'none')}>Keiner</QRToggle>
                      <QRToggle $active={formData.qr_frame_style === 'simple'} onClick={() => handleChange('qr_frame_style', 'simple')}>Eckig</QRToggle>
                      <QRToggle $active={formData.qr_frame_style === 'rounded'} onClick={() => handleChange('qr_frame_style', 'rounded')}>Rund</QRToggle>
                    </QRButtonRow>
                    {formData.qr_frame_style && formData.qr_frame_style !== 'none' && (
                      <Input value={formData.qr_frame_text || ''} onChange={e => handleChange('qr_frame_text', e.target.value)} placeholder="z.B. Scan me! oder Zur Hochzeitsseite" style={{ marginTop: '0.4rem' }} />
                    )}
                  </QROptionGroup>
                </QRDesignPanel>

                {/* Download Actions */}
                <QRActions>
                  <button onClick={() => downloadQRWithOptions(baseUrl, formData)}>⬇ SVG</button>
                  <button onClick={() => downloadQRAsPNG(baseUrl, formData)}>⬇ PNG</button>
                  <button onClick={() => copyQRSVG(baseUrl, formData)}>📋 Copy</button>
                </QRActions>
              </QRDesignerLayout>
            </QRPreviewBox>
          </CollapsibleSection>

          {/* Section 06: Komponenten */}
          <CollapsibleSection number="06" title="Komponenten" defaultOpen={false}>
            {isOverLimit && <ComponentWarning>⚠️ <strong>{activeExtraCount}</strong> Extra aktiv, aber nur <strong>{allowedExtraCount}</strong> gebucht!</ComponentWarning>}
            <ComponentListContainer>
              <ComponentListHeader>
                <span className="count">{(formData.active_components || []).length} aktiv</span>
                <span className="hint">Drag to reorder</span>
              </ComponentListHeader>
              {componentOrder.map(compId => {
                const comp = ALL_COMPONENTS.find(c => c.id === compId);
                if (!comp) return null;
                const isActive = (formData.active_components || []).includes(compId);
                return (
                  <ComponentItem key={compId} $active={isActive} draggable onDragStart={e => handleDragStart(e, compId)} onDragOver={e => handleDragOver(e, compId)} onDragEnd={handleDragEnd} onClick={() => toggleComponent(compId)}>
                    <span className="drag-handle">☰</span>
                    <span className="checkbox">{isActive && '✓'}</span>
                    <span className="name">{comp.name}</span>
                    {comp.core && <span className="badge">Basis</span>}
                  </ComponentItem>
                );
              })}
            </ComponentListContainer>
          </CollapsibleSection>

          {/* Section 06: E-Mails */}
          <CollapsibleSection number="07" title="E-Mails" badge={`${emailCount} gesendet`} defaultOpen={false}>
            <EmailActions>
              <EmailActionCard onClick={handleSendWelcome} disabled={sendingEmail || !formData.client_email}>
                <span className="icon">📧</span>
                <span className="title">Willkommen</span>
                <span className="desc">Vertrag + Zugangsdaten</span>
              </EmailActionCard>
              <EmailActionCard onClick={handleSendGoLive} disabled={sendingEmail || !formData.client_email}>
                <span className="icon">🚀</span>
                <span className="title">Go-Live</span>
                <span className="desc">Website ist online</span>
              </EmailActionCard>
              <EmailActionCard onClick={handleSendReminder} disabled={sendingEmail || !formData.client_email}>
                <span className="icon">⏰</span>
                <span className="title">Erinnerung</span>
                <span className="desc">Inhalte anfordern</span>
              </EmailActionCard>
              <EmailActionCard onClick={handleResetPassword} disabled={sendingEmail}>
                <span className="icon">🔐</span>
                <span className="title">Passwort Reset</span>
                <span className="desc">Neu generieren & senden</span>
              </EmailActionCard>
            </EmailActions>

            <Label>Verlauf ({emailCount})</Label>
            {emailLogs.length === 0 ? (
              <EmptyState>Noch keine E-Mails gesendet</EmptyState>
            ) : (
              emailLogs.map(log => {
                const isOpen = expandedEmailId === log.id;
                const templateLabels = {
                  welcome: 'Willkommen',
                  credentials: 'Zugangsdaten',
                  golive: 'Go-Live',
                  reminder: 'Erinnerung',
                  password_reset: 'Passwort Reset',
                };
                const sentDate = new Date(log.sent_at || log.created_at);
                const formattedDate = sentDate.toLocaleDateString('de-DE');
                const formattedTime = sentDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                const brevoStatus = log.brevo_status;
                
                return (
                  <EmailLogItem key={log.id}>
                    <EmailLogHeader onClick={() => setExpandedEmailId(isOpen ? null : log.id)}>
                      <EmailLogStatus $status={log.opened_at ? 'opened' : log.status} style={{ background: log.opened_at ? colors.green : log.status === 'sent' ? colors.orange : colors.red }} />
                      <EmailLogType>{templateLabels[log.template_type] || log.template_type}</EmailLogType>
                      <EmailLogDate>{formattedDate}</EmailLogDate>
                      {log.opened_at && <span style={{ fontSize: '0.65rem', color: colors.green }}>✓ Gelesen</span>}
                      <EmailLogExpand $open={isOpen}>▼</EmailLogExpand>
                    </EmailLogHeader>
                    <EmailLogDetails $open={isOpen}>
                      <EmailLogRow>
                        <span className="label">Empfänger</span>
                        <span className="value">{log.recipient_email}</span>
                      </EmailLogRow>
                      <EmailLogRow>
                        <span className="label">Betreff</span>
                        <span className="value" style={{ fontSize: '0.75rem' }}>{log.subject}</span>
                      </EmailLogRow>
                      <EmailLogRow>
                        <span className="label">Gesendet</span>
                        <span className="value">{formattedDate}, {formattedTime} Uhr</span>
                      </EmailLogRow>
                      <EmailLogRow>
                        <span className="label">Versand</span>
                        <span className="value">
                          <EmailStatusBadge $success={log.status === 'sent'}>
                            {log.status === 'sent' ? '✓ Gesendet' : log.status === 'failed' ? '✗ Fehlgeschlagen' : '⏳ Ausstehend'}
                          </EmailStatusBadge>
                        </span>
                      </EmailLogRow>
                      {log.delivered_at && (
                        <EmailLogRow>
                          <span className="label">Zugestellt</span>
                          <span className="value">
                            <EmailStatusBadge $success>{new Date(log.delivered_at).toLocaleDateString('de-DE')}, {new Date(log.delivered_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</EmailStatusBadge>
                          </span>
                        </EmailLogRow>
                      )}
                      <EmailLogRow>
                        <span className="label">Geöffnet</span>
                        <span className="value">
                          {log.opened_at ? (
                            <EmailStatusBadge $success>✓ {new Date(log.opened_at).toLocaleDateString('de-DE')}, {new Date(log.opened_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</EmailStatusBadge>
                          ) : (
                            <EmailStatusBadge $warning>Noch nicht geöffnet</EmailStatusBadge>
                          )}
                        </span>
                      </EmailLogRow>
                      {log.clicked_at && (
                        <EmailLogRow>
                          <span className="label">Link geklickt</span>
                          <span className="value">
                            <EmailStatusBadge $success>✓ {new Date(log.clicked_at).toLocaleDateString('de-DE')}, {new Date(log.clicked_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</EmailStatusBadge>
                          </span>
                        </EmailLogRow>
                      )}
                      {log.error_message && (
                        <EmailLogRow>
                          <span className="label">Fehler</span>
                          <span className="value" style={{ color: colors.red, fontSize: '0.7rem' }}>{log.error_message}</span>
                        </EmailLogRow>
                      )}
                    </EmailLogDetails>
                  </EmailLogItem>
                );
              })
            )}

            {!formData.client_email && (
              <ManualEmailBox>
                <p style={{ color: colors.red, margin: 0 }}>⚠️ Keine Kunden-E-Mail hinterlegt. Bitte unter "Kundendaten" ergänzen.</p>
              </ManualEmailBox>
            )}
          </CollapsibleSection>

          {/* Section 07: Design Varianten */}
          <CollapsibleSection number="08" title="Design Varianten" badge={configuredComponentsCount > 0 ? `${configuredComponentsCount} konfiguriert` : ''} defaultOpen={false}>
            <p style={{ fontSize: '0.85rem', color: colors.gray, marginBottom: '1rem' }}>
              Hier kannst du für aktive Komponenten spezielle Design-Varianten auswählen.
              Varianten werden erst angezeigt, wenn sie im Code implementiert sind.
            </p>

            <ComponentConfigSection>
              {(formData.active_components || [])
                .filter(compId => COMPONENT_VARIANTS[compId])
                .map(compId => {
                  const comp = ALL_COMPONENTS.find(c => c.id === compId);
                  if (!comp) return null;
                  const variants = COMPONENT_VARIANTS[compId] || [];
                  const config = getComponentConfig(compId);
                  const isOpen = expandedConfigId === compId;
                  const hasConfig = hasComponentConfig(compId);

                  return (
                    <ComponentConfigItem key={compId} $hasConfig={hasConfig}>
                      <ComponentConfigHeader
                        $hasConfig={hasConfig}
                        $open={isOpen}
                        onClick={() => setExpandedConfigId(isOpen ? null : compId)}
                      >
                        <div className="left">
                          <span className="name">{comp.name}</span>
                          {hasConfig && config.variant !== 'default' && (
                            <span className="variant-badge">
                              {variants.find(v => v.id === config.variant)?.name || config.variant}
                            </span>
                          )}
                        </div>
                        <span className="toggle">▼</span>
                      </ComponentConfigHeader>
                      <ComponentConfigBody $open={isOpen}>
                        <ConfigLabel>Design-Variante</ConfigLabel>
                        <VariantSelector>
                          {variants.map(variant => (
                            <VariantChip
                              key={variant.id}
                              $selected={config.variant === variant.id || (!config.variant && variant.id === 'default')}
                              onClick={() => setComponentVariant(compId, variant.id)}
                              title={variant.description}
                            >
                              {variant.name}
                            </VariantChip>
                          ))}
                        </VariantSelector>
                        <ConfigLabel>Notizen / Spezielle Wünsche</ConfigLabel>
                        <ConfigNotesInput
                          value={config.notes || ''}
                          onChange={e => setComponentNotes(compId, e.target.value)}
                          placeholder="z.B. Gold-Akzente, spezielle Animationen, bestimmte Farben..."
                        />
                      </ComponentConfigBody>
                    </ComponentConfigItem>
                  );
                })}
            </ComponentConfigSection>

            {configuredComponentsCount > 0 && (
              <ConfigSummary>
                <div className="title">Konfigurierte Komponenten</div>
                {Object.entries(formData.component_config || {})
                  .filter(([id, cfg]) => cfg.variant !== 'default' || cfg.notes)
                  .map(([compId, cfg]) => {
                    const comp = ALL_COMPONENTS.find(c => c.id === compId);
                    const variants = COMPONENT_VARIANTS[compId] || [];
                    const variantName = variants.find(v => v.id === cfg.variant)?.name || cfg.variant || 'Standard';
                    return (
                      <div key={compId} className="item">
                        <span className="component">{comp?.name || compId}</span>
                        <span className="variant">{variantName}</span>
                      </div>
                    );
                  })}
              </ConfigSummary>
            )}

            {configuredComponentsCount === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: colors.gray }}>
                Keine speziellen Design-Varianten konfiguriert. Alle Komponenten verwenden das Standard-Design des gewählten Themes.
              </div>
            )}
          </CollapsibleSection>
        </MainColumn>

        <Sidebar>
          <InfoCard>
            <InfoHeader>Projekt-Info</InfoHeader>
            <InfoBody>
              <InfoRow><span className="label">Erstellt</span><span className="value">{project.created_at ? new Date(project.created_at).toLocaleDateString('de-DE') : '-'}</span></InfoRow>
              <InfoRow><span className="label">Paket</span><span className="value">{PACKAGES[formData.package]?.name}</span></InfoRow>
              <InfoRow><span className="label">Theme</span><span className="value">{THEMES[formData.theme]?.name}</span></InfoRow>
              <InfoRow><span className="label">Hochzeit</span><span className="value">{formData.wedding_date ? new Date(formData.wedding_date).toLocaleDateString('de-DE') : '-'}</span></InfoRow>
              <InfoRow><span className="label">Gesamt</span><span className="value" style={{ color: colors.red, fontWeight: 700 }}>{formatPrice(pricing.total)}</span></InfoRow>
            </InfoBody>
          </InfoCard>
          
          {formData.client_email && (
            <InfoCard>
              <InfoHeader>Kontakt</InfoHeader>
              <InfoBody>
                <InfoRow><span className="label">E-Mail</span><span className="value"><a href={`mailto:${formData.client_email}`}>{formData.client_email}</a></span></InfoRow>
                {formData.client_phone && <InfoRow><span className="label">Tel</span><span className="value"><a href={`tel:${formData.client_phone}`}>{formData.client_phone}</a></span></InfoRow>}
                {(formData.client_street || formData.client_city) && <InfoRow><span className="label">Adresse</span><span className="value">{formatAddress(formData)}</span></InfoRow>}
              </InfoBody>
            </InfoCard>
          )}

          <InfoCard>
            <InfoHeader>E-Mails</InfoHeader>
            <InfoBody>
              <InfoRow><span className="label">Gesendet</span><span className="value">{emailCount}</span></InfoRow>
              <InfoRow><span className="label">Letzte</span><span className="value">{emailLogs[0] ? new Date(emailLogs[0].sent_at || emailLogs[0].created_at).toLocaleDateString('de-DE') : '-'}</span></InfoRow>
            </InfoBody>
          </InfoCard>
        </Sidebar>
      </Grid>
      
      {/* Sticky Save Bar - immer sichtbar */}
      <StickyBottomBar>
        <span className="status-text">{coupleNames} • {status?.label}</span>
        <Button $primary onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Speichert...' : '💾 Speichern'}
        </Button>
      </StickyBottomBar>
    </Layout>
  );
}
