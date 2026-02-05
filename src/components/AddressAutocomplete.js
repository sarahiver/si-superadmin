// src/components/AddressAutocomplete.js
// Adress-Autocomplete basierend auf Google Places API
// Befüllt: client_street, client_house_number, client_zip, client_city, client_country
//
// Benötigt: REACT_APP_GOOGLE_MAPS_API_KEY in .env / Vercel
// Google Cloud Console → Maps JavaScript API + Places API aktivieren

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { loadGoogleMaps, isGoogleMapsAvailable, generateEmbedUrl } from '../lib/googleMaps';

const colors = {
  black: '#0A0A0A',
  white: '#FAFAFA',
  lightGray: '#E5E5E5',
  gray: '#666666',
  green: '#10B981',
  orange: '#F59E0B',
};

// ============================================
// GOOGLE PLACE PARSER
// ============================================

function parseGooglePlace(place) {
  const result = { street: '', house_number: '', zip: '', city: '', country: 'Deutschland', lat: null, lng: null };
  
  if (place.geometry?.location) {
    result.lat = place.geometry.location.lat();
    result.lng = place.geometry.location.lng();
  }
  
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

export default function AddressAutocomplete({ street, houseNumber, zip, city, country, onChange, showMapPreview = true }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Google Maps laden
  useEffect(() => {
    if (!isGoogleMapsAvailable()) return;

    loadGoogleMaps()
      .then((maps) => {
        autocompleteService.current = new maps.places.AutocompleteService();
        placesService.current = new maps.places.PlacesService(document.createElement('div'));
        setIsReady(true);
      })
      .catch((err) => {
        console.warn('Google Maps konnte nicht geladen werden:', err.message);
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

  // Google Places Suche
  const fetchSuggestions = useCallback((input) => {
    if (!isReady || !autocompleteService.current || input.length < 3) {
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
            }))
          );
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      }
    );
  }, [isReady]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchValue(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    if (!placesService.current) return;

    setIsLoading(true);
    placesService.current.getDetails(
      { placeId: suggestion.placeId, fields: ['address_components', 'geometry'] },
      (place, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const parsed = parseGooglePlace(place);
          onChange('client_street', parsed.street);
          onChange('client_house_number', parsed.house_number);
          onChange('client_zip', parsed.zip);
          onChange('client_city', parsed.city);
          onChange('client_country', parsed.country);

          // Koordinaten für Karten-Preview
          if (parsed.lat && parsed.lng) {
            setMapCoords({ lat: parsed.lat, lng: parsed.lng });
          }
        }
        setShowDropdown(false);
        setSearchValue('');
      }
    );
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

  useEffect(() => { setActiveIndex(-1); }, [suggestions]);

  // Embed URL für Karten-Preview
  const currentAddress = [street, houseNumber, zip, city].filter(Boolean).join(', ');
  const embedUrl = mapCoords
    ? generateEmbedUrl({ lat: mapCoords.lat, lng: mapCoords.lng, zoom: 16 })
    : currentAddress.length > 8
      ? generateEmbedUrl({ address: currentAddress })
      : '';

  const apiAvailable = isGoogleMapsAvailable();

  return (
    <AddressWrapper>
      {/* Suchfeld */}
      <SearchRow>
        <SearchGroup>
          <LabelRow>
            <Label>Adresse suchen</Label>
            {apiAvailable
              ? <ProviderBadge $ready>Google Maps</ProviderBadge>
              : <ProviderBadge>API-Key fehlt</ProviderBadge>
            }
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
              onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
              placeholder={apiAvailable ? 'z.B. Musterstraße 1, Hamburg' : 'Google Maps API-Key in Vercel hinterlegen'}
              disabled={!apiAvailable}
            />
            {isLoading && (
              <LoadingSpinner>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
              </LoadingSpinner>
            )}
          </SearchInputWrapper>

          {/* Dropdown */}
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

      {/* Adressfelder */}
      <FieldsGrid>
        <FieldGroup className="street">
          <Label>Straße</Label>
          <Input value={street || ''} onChange={(e) => onChange('client_street', e.target.value)} placeholder="Straße" />
        </FieldGroup>
        <FieldGroup className="number">
          <Label>Nr.</Label>
          <Input value={houseNumber || ''} onChange={(e) => onChange('client_house_number', e.target.value)} placeholder="Nr." />
        </FieldGroup>
        <FieldGroup className="zip">
          <Label>PLZ</Label>
          <Input value={zip || ''} onChange={(e) => onChange('client_zip', e.target.value)} placeholder="PLZ" />
        </FieldGroup>
        <FieldGroup className="city">
          <Label>Ort</Label>
          <Input value={city || ''} onChange={(e) => onChange('client_city', e.target.value)} placeholder="Ort" />
        </FieldGroup>
        <FieldGroup className="country">
          <Label>Land</Label>
          <Input value={country || 'Deutschland'} onChange={(e) => onChange('client_country', e.target.value)} placeholder="Land" />
        </FieldGroup>
      </FieldsGrid>

      {/* Karten-Preview */}
      {showMapPreview && apiAvailable && embedUrl && (
        <MapPreview>
          <MapLabel>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Vorschau
            {mapCoords && <CoordsBadge>✓ {mapCoords.lat.toFixed(4)}, {mapCoords.lng.toFixed(4)}</CoordsBadge>}
          </MapLabel>
          <MapFrame>
            <iframe
              src={embedUrl}
              title="Kunden-Adresse"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </MapFrame>
        </MapPreview>
      )}

      {!apiAvailable && (
        <ApiHint>
          💡 Für Adress-Autocomplete und Kartenvorschau: <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> in Vercel Environment Variables hinterlegen.
          Benötigt: Maps JavaScript API, Places API, Geocoding API und Maps Embed API.
        </ApiHint>
      )}
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
  color: ${p => p.$ready ? colors.green : colors.orange};
  background: ${p => p.$ready ? `${colors.green}15` : `${colors.orange}15`};
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

const LoadingSpinner = styled.span`
  position: absolute;
  right: 1rem;
  color: ${colors.gray};
  display: flex;
  align-items: center;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-style: dashed;
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

const MapPreview = styled.div`
  margin-top: 0.5rem;
`;

const MapLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${colors.black};
  margin-bottom: 0.5rem;
`;

const CoordsBadge = styled.span`
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: ${colors.green};
  margin-left: 0.25rem;
`;

const MapFrame = styled.div`
  position: relative;
  padding-top: 35%;
  background: ${colors.lightGray};
  overflow: hidden;
  border: 2px solid ${colors.lightGray};

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }

  @media (max-width: 600px) {
    padding-top: 50%;
  }
`;

const ApiHint = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 2px;
  background: ${colors.orange}10;
  border: 1px solid ${colors.orange}30;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: ${colors.gray};
  line-height: 1.5;

  code {
    font-size: 0.75rem;
    background: ${colors.lightGray};
    padding: 0.1rem 0.3rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
`;
