// src/components/AddressAutocomplete.js
// Google Places Autocomplete für Adressfelder
// Befüllt: street, house_number, zip, city, country
//
// Setup: REACT_APP_GOOGLE_PLACES_API_KEY in .env setzen
// Google Cloud Console → Places API (New) aktivieren
// Alternativ funktioniert alles auch ohne API Key – dann nur manuelle Eingabe

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

const colors = {
  black: '#0A0A0A',
  white: '#FAFAFA',
  lightGray: '#E5E5E5',
  gray: '#666666',
};

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

// Google Maps Script laden (einmalig)
let googleScriptPromise = null;
function loadGoogleMapsScript() {
  if (googleScriptPromise) return googleScriptPromise;
  if (window.google?.maps?.places) return Promise.resolve();

  googleScriptPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_API_KEY) {
      reject(new Error('No API key'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&language=de`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

// Adress-Komponenten aus Google Place extrahieren
function parseGooglePlace(place) {
  const result = { street: '', house_number: '', zip: '', city: '', country: 'Deutschland' };

  if (!place.address_components) return result;

  for (const comp of place.address_components) {
    const types = comp.types;
    if (types.includes('route')) {
      result.street = comp.long_name;
    } else if (types.includes('street_number')) {
      result.house_number = comp.long_name;
    } else if (types.includes('postal_code')) {
      result.zip = comp.long_name;
    } else if (types.includes('locality')) {
      result.city = comp.long_name;
    } else if (types.includes('sublocality_level_1') && !result.city) {
      result.city = comp.long_name;
    } else if (types.includes('country')) {
      result.country = comp.long_name;
    }
  }

  return result;
}

export default function AddressAutocomplete({ street, houseNumber, zip, city, country, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Google Maps laden
  useEffect(() => {
    if (!GOOGLE_API_KEY) return;

    loadGoogleMapsScript()
      .then(() => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        setGoogleReady(true);
      })
      .catch(() => {
        console.warn('Google Places konnte nicht geladen werden – manuelle Eingabe aktiv');
      });
  }, []);

  // Klick außerhalb schließt Dropdown
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchSuggestions = useCallback((input) => {
    if (!googleReady || !autocompleteService.current || input.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input,
        types: ['address'],
        componentRestrictions: { country: ['de', 'at', 'ch'] },
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5));
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      }
    );
  }, [googleReady]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchValue(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId: suggestion.place_id, fields: ['address_components'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const parsed = parseGooglePlace(place);
          onChange('client_street', parsed.street);
          onChange('client_house_number', parsed.house_number);
          onChange('client_zip', parsed.zip);
          onChange('client_city', parsed.city);
          onChange('client_country', parsed.country);
        }
        setShowDropdown(false);
        setSearchValue('');
      }
    );
  };

  return (
    <AddressWrapper>
      {/* Autocomplete Suche - nur wenn Google API verfügbar */}
      {GOOGLE_API_KEY && (
        <SearchRow>
          <SearchGroup>
            <Label>Adresse suchen</Label>
            <SearchInputWrapper>
              <SearchIcon>🔍</SearchIcon>
              <SearchInput
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={handleSearchInput}
                placeholder={googleReady ? 'z.B. Fischergasse 95, Trebur' : 'Google Places wird geladen...'}
                disabled={!googleReady}
              />
              {!googleReady && GOOGLE_API_KEY && <LoadingDot />}
            </SearchInputWrapper>

            {showDropdown && suggestions.length > 0 && (
              <Dropdown ref={dropdownRef}>
                {suggestions.map((s) => (
                  <DropdownItem
                    key={s.place_id}
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    <DropdownIcon>📍</DropdownIcon>
                    <DropdownText>
                      <DropdownMain>{s.structured_formatting?.main_text}</DropdownMain>
                      <DropdownSub>{s.structured_formatting?.secondary_text}</DropdownSub>
                    </DropdownText>
                  </DropdownItem>
                ))}
              </Dropdown>
            )}
          </SearchGroup>
        </SearchRow>
      )}

      {/* Adressfelder - immer sichtbar, manuell editierbar */}
      <FieldsGrid>
        <FieldGroup className="street">
          <Label>Straße</Label>
          <Input
            value={street || ''}
            onChange={(e) => onChange('client_street', e.target.value)}
            placeholder="Straße"
          />
        </FieldGroup>
        <FieldGroup className="number">
          <Label>Nr.</Label>
          <Input
            value={houseNumber || ''}
            onChange={(e) => onChange('client_house_number', e.target.value)}
            placeholder="Nr."
          />
        </FieldGroup>
        <FieldGroup className="zip">
          <Label>PLZ</Label>
          <Input
            value={zip || ''}
            onChange={(e) => onChange('client_zip', e.target.value)}
            placeholder="PLZ"
          />
        </FieldGroup>
        <FieldGroup className="city">
          <Label>Ort</Label>
          <Input
            value={city || ''}
            onChange={(e) => onChange('client_city', e.target.value)}
            placeholder="Ort"
          />
        </FieldGroup>
        <FieldGroup className="country">
          <Label>Land</Label>
          <Input
            value={country || 'Deutschland'}
            onChange={(e) => onChange('client_country', e.target.value)}
            placeholder="Land"
          />
        </FieldGroup>
      </FieldsGrid>
    </AddressWrapper>
  );
}

// Hilfsfunktion: Formatierte Adresse aus Einzelfeldern
export function formatAddress(data, options = {}) {
  const { multiline = false } = options;
  const street = data.client_street || '';
  const nr = data.client_house_number || '';
  const zip = data.client_zip || '';
  const city = data.client_city || '';
  const country = data.client_country || '';

  const line1 = [street, nr].filter(Boolean).join(' ');
  const line2 = [zip, city].filter(Boolean).join(' ');

  if (multiline) {
    return [line1, line2, country].filter(Boolean);
  }

  return [line1, line2, country !== 'Deutschland' ? country : ''].filter(Boolean).join(', ');
}

// ============================================
// STYLED COMPONENTS
// ============================================

const AddressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SearchRow = styled.div`
  margin-bottom: 0.25rem;
`;

const SearchGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${colors.black};
  margin-bottom: 0.5rem;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 1rem;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  background: ${colors.white};
  border: 2px dashed ${colors.lightGray};
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: ${colors.black};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${colors.black};
    border-style: solid;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${colors.gray};
    font-size: 0.85rem;
  }
`;

const LoadingDot = styled.div`
  position: absolute;
  right: 1rem;
  width: 8px;
  height: 8px;
  background: ${colors.gray};
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 2px solid ${colors.black};
  z-index: 100;
  max-height: 280px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${colors.white};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${colors.lightGray};
  }
`;

const DropdownIcon = styled.span`
  font-size: 0.85rem;
  flex-shrink: 0;
`;

const DropdownText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const DropdownMain = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${colors.black};
`;

const DropdownSub = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: ${colors.gray};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 80px;
  gap: 1rem;

  .street { grid-column: 1; }
  .number { grid-column: 2; }
  .zip { grid-column: 1; max-width: 120px; }
  .city { grid-column: 2; grid-column: 1 / -1; }

  /* Responsive 5-Spalten Layout auf Desktop */
  @media (min-width: 600px) {
    grid-template-columns: 1fr 80px 100px 1fr 140px;

    .street { grid-column: 1; }
    .number { grid-column: 2; }
    .zip { grid-column: 3; max-width: none; }
    .city { grid-column: 4; }
    .country { grid-column: 5; }
  }
`;

const FieldGroup = styled.div``;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${colors.white};
  border: 2px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: ${colors.black};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${colors.black};
  }

  &::placeholder {
    color: #bbb;
    font-size: 0.85rem;
  }
`;
