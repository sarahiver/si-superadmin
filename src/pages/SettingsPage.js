// src/pages/SettingsPage.js
// Site Settings inkl. Promo Banner Editor
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

const colors = {
  black: '#0A0A0A',
  white: '#FAFAFA',
  red: '#C41E3A',
  green: '#10B981',
  gray: '#666666',
  lightGray: '#E5E5E5',
  background: '#F5F5F5'
};

// ============================================
// STYLED COMPONENTS
// ============================================
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px solid ${colors.black};
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-family: 'Oswald', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: ${colors.black};
  line-height: 1;
`;

const Subtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: ${colors.gray};
  margin-top: 0.5rem;
`;

const Section = styled.div`
  background: ${colors.white};
  border: 2px solid ${colors.black};
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  background: ${colors.black};
  color: ${colors.white};
  padding: 1rem 1.5rem;
  font-family: 'Oswald', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${colors.gray};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  border: 2px solid ${colors.lightGray};
  background: ${colors.white};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${colors.black};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  border: 2px solid ${colors.lightGray};
  background: ${colors.white};
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${colors.black};
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${colors.black};

  input {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
`;

const Button = styled.button`
  font-family: 'Oswald', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: ${p => p.$primary ? colors.red : colors.white};
  color: ${p => p.$primary ? colors.white : colors.black};
  padding: 1rem 2rem;
  border: 2px solid ${p => p.$primary ? colors.red : colors.black};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${colors.black};
    color: ${colors.white};
    border-color: ${colors.black};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Preview = styled.div`
  background: ${colors.background};
  border: 2px dashed ${colors.lightGray};
  padding: 1.5rem;
  margin-top: 1rem;
`;

const PreviewTitle = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${colors.gray};
  margin-bottom: 0.75rem;
`;

const PreviewBanner = styled.div`
  background: ${colors.red};
  color: ${colors.white};
  padding: 1rem 1.5rem;
  text-align: center;

  .title {
    font-family: 'Oswald', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  .badge {
    display: inline-block;
    background: ${colors.black};
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
    margin-left: 0.5rem;
    vertical-align: middle;
  }

  .text {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    opacity: 0.9;
  }
`;

const StatusIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${p => p.$active ? colors.green : colors.gray};

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${p => p.$active ? colors.green : colors.gray};
  }
`;

// ============================================
// MAIN COMPONENT
// ============================================
export default function SettingsPage() {
  const [promo, setPromo] = useState({
    active: false,
    title: '',
    text: '',
    badge: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'promo_banner')
        .single();

      if (data?.value) {
        setPromo(data.value);
      }
    } catch (err) {
      console.log('No promo settings found, using defaults');
    } finally {
      setIsLoading(false);
    }
  };

  const savePromo = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'promo_banner',
          value: promo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
      toast.success('Promo Banner gespeichert!');
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Speichern: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Layout><div style={{ padding: '2rem', color: colors.gray }}>Laden...</div></Layout>;
  }

  return (
    <Layout>
      <Header>
        <div>
          <Title>Einstellungen</Title>
          <Subtitle>Marketing Website Konfiguration</Subtitle>
        </div>
      </Header>

      {/* Promo Banner Section */}
      <Section>
        <SectionHeader>
          <span>Promo Banner</span>
          <StatusIndicator $active={promo.active}>
            {promo.active ? 'Aktiv' : 'Inaktiv'}
          </StatusIndicator>
        </SectionHeader>
        <SectionBody>
          <FormGroup>
            <CheckboxRow>
              <input
                type="checkbox"
                checked={promo.active}
                onChange={(e) => setPromo({ ...promo, active: e.target.checked })}
              />
              Promo Banner aktivieren
            </CheckboxRow>
          </FormGroup>

          <FormGroup>
            <Label>Titel</Label>
            <Input
              type="text"
              value={promo.title}
              onChange={(e) => setPromo({ ...promo, title: e.target.value })}
              placeholder="z.B. Frühbucher-Rabatt"
            />
          </FormGroup>

          <FormGroup>
            <Label>Text</Label>
            <TextArea
              value={promo.text}
              onChange={(e) => setPromo({ ...promo, text: e.target.value })}
              placeholder="z.B. Bucht jetzt und spart 10% auf alle Pakete!"
            />
          </FormGroup>

          <FormGroup>
            <Label>Badge (optional)</Label>
            <Input
              type="text"
              value={promo.badge}
              onChange={(e) => setPromo({ ...promo, badge: e.target.value })}
              placeholder="z.B. -10% oder Limitiert"
            />
          </FormGroup>

          {/* Preview */}
          {promo.title && (
            <Preview>
              <PreviewTitle>Vorschau (Editorial Theme)</PreviewTitle>
              <PreviewBanner>
                <div className="title">
                  {promo.title}
                  {promo.badge && <span className="badge">{promo.badge}</span>}
                </div>
                <p className="text">{promo.text}</p>
              </PreviewBanner>
            </Preview>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <Button $primary onClick={savePromo} disabled={isSaving}>
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </SectionBody>
      </Section>
    </Layout>
  );
}
