// src/components/AddressAutocomplete.js
// Adress-Autocomplete basierend auf Photon (OpenStreetMap) – kostenlos, kein API-Key nötig
// Befüllt: client_street, client_house_number, client_zip, client_city, client_country
// Fallback: Google Places API wenn REACT_APP_GOOGLE_PLACES_API_KEY gesetzt

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

const colors = {
  black: '#0A0A0A',
  white: '#FAFAFA',
  lightGray: '#E5E5E5',
  gray: '#666666',
};

// ============================================
// PHOTON API (OpenStreetMap) – kostenlos
// ============================================

function parsePhotonFeature(feature) {
  const p = feature.properties || {};
  return {
    street: p.street || p.name || '',
    house_number: p.housenumber || '',
    zip: p.postcode || '',
    city: p.city || p.town || p.village || p.municipality || '',
    country: p.country || 'Deutschland',
  };
}

async function fetchPhotonSuggestions(input, signal) {
  if (!input || input.length < 3) return [];

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&lang=de&limit=5&lat=53.55&lon=9.99&osm_tag=place&osm_tag=highway`;
    const resp = await fetch(url, { signal });
    if (!resp.ok) return [];
    const data = await resp.json();

    if (!data.features?.length) return [];

    return data.features
      .filter(f => {
        const type = f.properties?.osm_value;
        return type !== 'country' && type !== 'state' && type !== 'continent';
      })
      .slice(0, 5)
      .map(f => {
        const p = f.properties || {};
        const streetVal = p.street || p.name || '';
        const nr = p.housenumber || '';
        const cityVal = p.city || p.town || p.village || p.municipality || '';
        const zipVal = p.postcode || '';
        const mainText = [streetVal, nr].filter(Boolean).join(' ') || p.name || '';
        const subText = [zipVal, cityVal].filter(Boolean).join(' ');

        return {
          id: `${f.properties?.osm_id || Math.random()}`,
          mainText,
          subText,
          parsed: parsePhotonFeature(f),
        };
      });
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.warn('Photon API Fehler:', err);
    return [];
  }
}

// ============================================
// GOOGLE PLACES API – optional, als Fallback
// ============================================

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

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

function parseGooglePlace(place) {
  const result = { street: '', house_number: '', zip: '', city: '', country: 'Deutschland' };
  if (!place.address_components) return result;

  for (const comp of place.address_components) {
    const types = comp.types;
    if (types.includes('route')) result.street = comp.long_name;
    else if (types.includes('street_number')) result.house_number = comp.long_name;
    else if (types.includes('postal_code')) result.zip = comp.long_name;
    else if (types.includes('locality')) result.city = comp.long_name;
    else if (types.includes('sublocality_level_1') && !result.city) result.city = comp.long_name;
    else if (types.includes('country')) result.country = comp.long_name;
  }

  return result;
}

// ============================================
// KOMPONENTE
// ============================================

export default function AddressAutocomplete({ street, houseNumber, zip, city, country, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [useGoogle, setUseGoogle] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);
  const abortController = useRef(null);

  // Google Maps laden (falls API-Key vorhanden)
  useEffect(() => {
    if (!GOOGLE_API_KEY) return;

    loadGoogleMapsScript()
      .then(() => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        setGoogleReady(true);
        setUseGoogle(true);
      })
      .catch(() => {
        console.info('Google Places nicht verfügbar – Photon (OSM) wird verwendet');
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

  // Photon-Suche
  const fetchPhoton = useCallback(async (input) => {
    if (abortController.current) abortController.current.abort();
    abortController.current = new AbortController();

    const results = await fetchPhotonSuggestions(input, abortController.current.signal);
    if (results.length > 0) {
      setSuggestions(results);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, []);

  // Google-Suche
  const fetchGoogle = useCallback((input) => {
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
          setSuggestions(
            predictions.slice(0, 5).map(p => ({
              id: p.place_id,
              mainText: p.structured_formatting?.main_text || '',
              subText: p.structured_formatting?.secondary_text || '',
              placeId: p.place_id,
              isGoogle: true,
            }))
          );
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
    debounceTimer.current = setTimeout(() => {
      if (useGoogle && googleReady) {
        fetchGoogle(val);
      } else {
        fetchPhoton(val);
      }
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    if (suggestion.isGoogle && placesService.current) {
      placesService.current.getDetails(
        { placeId: suggestion.placeId, fields: ['address_components'] },
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
    } else if (suggestion.parsed) {
      onChange('client_street', suggestion.parsed.street);
      onChange('client_house_number', suggestion.parsed.house_number);
      onChange('client_zip', suggestion.parsed.zip);
      onChange('client_city', suggestion.parsed.city);
      onChange('client_country', suggestion.parsed.country);
      setShowDropdown(false);
      setSearchValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeIndex]);
      setActiveIndex(-1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  const providerLabel = useGoogle && googleReady ? 'Google' : 'OpenStreetMap';

  return (
    <AddressWrapper>
      {/* Autocomplete Suchfeld – IMMER sichtbar */}
      <SearchRow>
        <SearchGroup>
          <LabelRow>
            <Label>Adresse suchen</Label>
            <ProviderBadge>{providerLabel}</ProviderBadge>
          </LabelRow>
          <SearchInputWrapper>
            <SearchIcon>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </SearchIcon>
            <SearchInput
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              placeholder="z.B. Hauptstraße 82, Hamburg"
            />
          </SearchInputWrapper>

          {showDropdown && suggestions.length > 0 && (
            <Dropdown ref={dropdownRef}>
              {suggestions.map((s, idx) => (
                <DropdownItem
                  key={s.id}
                  $active={idx === activeIndex}
                  onClick={() => handleSelectSuggestion(s)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <DropdownIcon>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </DropdownIcon>
                  <DropdownText>
                    <DropdownMain>{s.mainText}</DropdownMain>
                    {s.subText && <DropdownSub>{s.subText}</DropdownSub>}
                  </DropdownText>
                </DropdownItem>
              ))}
            </Dropdown>
          )}
        </SearchGroup>
      </SearchRow>

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
  const streetVal = data.client_street || '';
  const nr = data.client_house_number || '';
  const zipVal = data.client_zip || '';
  const cityVal = data.client_city || '';
  const countryVal = data.client_country || '';

  const line1 = [streetVal, nr].filter(Boolean).join(' ');
  const line2 = [zipVal, cityVal].filter(Boolean).join(' ');

  if (multiline) {
    return [line1, line2, countryVal].filter(Boolean);
  }

  return [line1, line2, countryVal !== 'Deutschland' ? countryVal : ''].filter(Boolean).join(', ');
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

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Label = styled.label`
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${colors.black};
`;

const ProviderBadge = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.55rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.gray};
  background: ${colors.lightGray};
  padding: 0.15rem 0.4rem;
  border-radius: 2px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 1rem;
  color: ${colors.gray};
  pointer-events: none;
  z-index: 1;
  display: flex;
  align-items: center;
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

  &::placeholder {
    color: ${colors.gray};
    font-size: 0.85rem;
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
  background: ${({ $active }) => ($active ? colors.white : 'transparent')};

  &:hover {
    background: ${colors.white};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${colors.lightGray};
  }
`;

const DropdownIcon = styled.span`
  color: ${colors.gray};
  flex-shrink: 0;
  display: flex;
  align-items: center;
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

  @media (min-width: 600px) {
    grid-template-columns: 1fr 80px 100px 1fr 140px;

    .street { grid-column: 1; }
    .number { grid-column: 2; }
    .zip { grid-column: 3; max-width: none; }
    .city { grid-column: 4; }
    .country { grid-column: 5; }
  }
`;

const FieldGroup = styled.div`
  & > ${Label} {
    margin-bottom: 0.5rem;
  }
`;

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
