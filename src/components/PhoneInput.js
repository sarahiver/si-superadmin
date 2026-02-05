// src/components/shared/PhoneInput.js
// Wiederverwendbare Telefon-Eingabe mit Landesvorwahl-Picker
// Keine externe API nötig - statische Länderliste
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// ============================================
// COUNTRY DATA (Sortiert: DACH zuerst, dann häufige)
// ============================================
const COUNTRIES = [
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Deutschland' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Österreich' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Schweiz' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Niederlande' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgien' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'Frankreich' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italien' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spanien' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'Großbritannien' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Irland' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Dänemark' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Schweden' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norwegen' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finnland' },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Polen' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Tschechien' },
  { code: 'HU', dial: '+36', flag: '🇭🇺', name: 'Ungarn' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Griechenland' },
  { code: 'HR', dial: '+385', flag: '🇭🇷', name: 'Kroatien' },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'Rumänien' },
  { code: 'BG', dial: '+359', flag: '🇧🇬', name: 'Bulgarien' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Türkei' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russland' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'USA' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brasilien' },
  { code: 'LU', dial: '+352', flag: '🇱🇺', name: 'Luxemburg' },
  { code: 'LI', dial: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: 'SK', dial: '+421', flag: '🇸🇰', name: 'Slowakei' },
  { code: 'SI', dial: '+386', flag: '🇸🇮', name: 'Slowenien' },
];

// ============================================
// HELPER: Parse existing phone number
// ============================================
function parsePhone(value) {
  if (!value) return { countryCode: 'DE', dial: '+49', number: '' };
  const trimmed = value.trim();

  // Try to match a known dial code at the start
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    const normalized = trimmed.startsWith('00') ? '+' + trimmed.slice(2) : trimmed;
    // Sort by dial code length descending to match longest first
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      if (normalized.startsWith(c.dial)) {
        const rest = normalized.slice(c.dial.length).replace(/^\s+/, '');
        return { countryCode: c.code, dial: c.dial, number: rest };
      }
    }
  }

  // If starts with 0 (German landline/mobile style), assume DE
  if (trimmed.startsWith('0')) {
    return { countryCode: 'DE', dial: '+49', number: trimmed.slice(1) };
  }

  // Fallback: return as-is with DE default
  return { countryCode: 'DE', dial: '+49', number: trimmed };
}

// ============================================
// STYLED COMPONENTS
// ============================================
const Wrapper = styled.div`
  display: flex;
  gap: 0;
  position: relative;
`;

const CountryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.6rem 0.6rem;
  font-size: 0.95rem;
  background: ${p => p.$variant === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  color: ${p => p.$variant === 'dark' ? '#fff' : '#333'};
  border: 2px solid ${p => p.$variant === 'dark' ? '#444' : '#e0e0e0'};
  border-right: none;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  white-space: nowrap;
  min-width: 90px;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    background: ${p => p.$variant === 'dark' ? '#333' : '#eee'};
  }

  &:focus {
    outline: none;
    border-color: ${p => p.$variant === 'dark' ? '#888' : '#333'};
  }
`;

const DialCode = styled.span`
  font-size: 0.85rem;
  color: ${p => p.$variant === 'dark' ? '#aaa' : '#666'};
  font-variant-numeric: tabular-nums;
`;

const Chevron = styled.span`
  font-size: 0.6rem;
  margin-left: 2px;
  color: ${p => p.$variant === 'dark' ? '#888' : '#999'};
`;

const NumberInput = styled.input`
  flex: 1;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  border: 2px solid ${p => p.$variant === 'dark' ? '#444' : '#e0e0e0'};
  border-left: 1px solid ${p => p.$variant === 'dark' ? '#333' : '#eee'};
  border-radius: 0 8px 8px 0;
  background: ${p => p.$variant === 'dark' ? '#1a1a1a' : '#fff'};
  color: ${p => p.$variant === 'dark' ? '#fff' : '#333'};
  transition: border-color 0.2s;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${p => p.$variant === 'dark' ? '#888' : '#333'};
  }

  &::placeholder {
    color: ${p => p.$variant === 'dark' ? '#666' : '#aaa'};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 1000;
  width: 280px;
  max-height: 260px;
  overflow-y: auto;
  background: ${p => p.$variant === 'dark' ? '#1a1a1a' : '#fff'};
  border: 1px solid ${p => p.$variant === 'dark' ? '#444' : '#ddd'};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { 
    background: ${p => p.$variant === 'dark' ? '#444' : '#ccc'}; 
    border-radius: 3px; 
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
  border: none;
  border-bottom: 1px solid ${p => p.$variant === 'dark' ? '#333' : '#eee'};
  background: ${p => p.$variant === 'dark' ? '#222' : '#fafafa'};
  color: ${p => p.$variant === 'dark' ? '#fff' : '#333'};
  outline: none;

  &::placeholder {
    color: ${p => p.$variant === 'dark' ? '#666' : '#aaa'};
  }
`;

const CountryOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${p => p.$variant === 'dark' ? '#ddd' : '#333'};
  background: ${p => p.$selected 
    ? (p.$variant === 'dark' ? '#333' : '#f0f0f0') 
    : 'transparent'};

  &:hover {
    background: ${p => p.$variant === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  }
`;

const CountryName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CountryDial = styled.span`
  font-size: 0.8rem;
  color: ${p => p.$variant === 'dark' ? '#888' : '#999'};
  font-variant-numeric: tabular-nums;
`;

// ============================================
// COMPONENT
// ============================================
/**
 * PhoneInput - Telefon-Eingabe mit Landesvorwahl-Picker
 * 
 * @param {string} value - Gespeicherter Wert (z.B. "+49 176 1234567")
 * @param {function} onChange - Callback mit kombiniertem Wert (dial + number)
 * @param {string} placeholder - Placeholder für die Nummer
 * @param {string} variant - "light" (default) oder "dark"
 * @param {object} style - Optional: zusätzliche Styles für den Wrapper
 */
export default function PhoneInput({ 
  value, 
  onChange, 
  placeholder = '176 1234567', 
  variant = 'light',
  style 
}) {
  const parsed = parsePhone(value);
  const [selectedCode, setSelectedCode] = useState(parsed.countryCode);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const initializedRef = useRef(false);

  // Sync from outside when value changes (but not on our own changes)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    const p = parsePhone(value);
    setSelectedCode(p.countryCode);
    setNumber(p.number);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const selectedCountry = COUNTRIES.find(c => c.code === selectedCode) || COUNTRIES[0];

  const emitChange = useCallback((dial, num) => {
    const cleaned = num.replace(/^\s+/, '');
    const combined = cleaned ? `${dial} ${cleaned}` : '';
    onChange(combined);
  }, [onChange]);

  const handleCountrySelect = (country) => {
    setSelectedCode(country.code);
    setOpen(false);
    setSearch('');
    emitChange(country.dial, number);
  };

  const handleNumberChange = (e) => {
    const val = e.target.value;
    setNumber(val);
    emitChange(selectedCountry.dial, val);
  };

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <Wrapper ref={wrapperRef} style={style}>
      <CountryButton
        type="button"
        onClick={() => setOpen(!open)}
        $variant={variant}
        title={selectedCountry.name}
      >
        <span>{selectedCountry.flag}</span>
        <DialCode $variant={variant}>{selectedCountry.dial}</DialCode>
        <Chevron $variant={variant}>▼</Chevron>
      </CountryButton>

      <NumberInput
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        $variant={variant}
      />

      {open && (
        <Dropdown $variant={variant}>
          <SearchInput
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Land suchen..."
            $variant={variant}
          />
          {filtered.map(c => (
            <CountryOption
              key={c.code}
              $variant={variant}
              $selected={c.code === selectedCode}
              onClick={() => handleCountrySelect(c)}
            >
              <span>{c.flag}</span>
              <CountryName>{c.name}</CountryName>
              <CountryDial $variant={variant}>{c.dial}</CountryDial>
            </CountryOption>
          ))}
          {filtered.length === 0 && (
            <CountryOption $variant={variant} style={{ cursor: 'default', color: '#888' }}>
              Kein Land gefunden
            </CountryOption>
          )}
        </Dropdown>
      )}
    </Wrapper>
  );
}

// Re-export für direkte Nutzung
export { COUNTRIES, parsePhone };
