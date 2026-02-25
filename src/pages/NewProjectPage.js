// src/pages/NewProjectPage.js
// Editorial Design - Create New Project
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { createProject } from '../lib/supabase';
import { THEMES, PACKAGES, CORE_COMPONENTS, DEFAULT_COMPONENT_ORDER, formatPrice } from '../lib/constants';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const Header = styled.div`
  margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black};
`;

const Title = styled.h1`
  font-family: 'Oswald', sans-serif; font-size: 2.5rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: -0.02em; color: ${colors.black}; line-height: 1;
`;

const Subtitle = styled.p`
  font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.gray}; margin-top: 0.5rem;
`;

const Form = styled.form`max-width: 800px;`;

const Section = styled.section`
  background: ${colors.white}; border: 2px solid ${colors.black}; margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  background: ${colors.black}; color: ${colors.white}; padding: 1rem 1.25rem;
  display: flex; align-items: center; gap: 1rem;
`;

const SectionNumber = styled.span`
  font-family: 'Oswald', sans-serif; font-size: 0.875rem; font-weight: 600; color: ${colors.red};
`;

const SectionTitle = styled.h2`
  font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.05em;
`;

const SectionBody = styled.div`padding: 1.5rem;`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`&.full-width { grid-column: 1 / -1; }`;

const Label = styled.label`
  display: block; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%; padding: 0.875rem 1rem; background: ${colors.background};
  border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif;
  font-size: 0.95rem; color: ${colors.black}; transition: border-color 0.2s ease;
  &:focus { outline: none; border-color: ${colors.black}; background: ${colors.white}; }
`;

const Select = styled.select`
  width: 100%; padding: 0.875rem 1rem; background: ${colors.background};
  border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif;
  font-size: 0.95rem; cursor: pointer;
  &:focus { outline: none; border-color: ${colors.black}; background: ${colors.white}; }
`;

const PackageSelector = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
  @media (max-width: 800px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const PackageCard = styled.div`
  border: 2px solid ${p => p.$selected ? colors.red : colors.lightGray};
  background: ${p => p.$selected ? `${colors.red}10` : colors.background};
  padding: 1.25rem; cursor: pointer; transition: all 0.2s ease;
  &:hover { border-color: ${p => p.$selected ? colors.red : colors.black}; }
  .name { font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 600;
    text-transform: uppercase; margin-bottom: 0.25rem; }
  .price { font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 700; color: ${colors.red}; }
  .note { font-size: 0.7rem; color: ${colors.gray}; margin-top: 0.25rem; }
`;

const ThemeSelector = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
`;

const ThemeCard = styled.div`
  border: 2px solid ${p => p.$selected ? colors.red : colors.lightGray};
  background: ${p => p.$selected ? `${colors.red}10` : colors.background};
  padding: 1rem; cursor: pointer; transition: all 0.2s ease; text-align: center;
  &:hover { border-color: ${p => p.$selected ? colors.red : colors.black}; }
  .name { font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; }
  .desc { font-size: 0.7rem; color: ${colors.gray}; margin-top: 0.25rem; }
`;

const Actions = styled.div`
  display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;
`;

const Button = styled.button`
  padding: 1rem 2rem; font-family: 'Oswald', sans-serif; font-size: 0.85rem;
  font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
  transition: all 0.2s ease;
  ${p => p.$primary && `
    background: ${colors.red}; color: ${colors.white}; border: 2px solid ${colors.red};
    &:hover:not(:disabled) { background: ${colors.black}; border-color: ${colors.black}; }
  `}
  ${p => !p.$primary && `
    background: transparent; color: ${colors.black}; border: 2px solid ${colors.black};
    &:hover { background: ${colors.black}; color: ${colors.white}; }
  `}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = window.history.state?.usr || {};
  const fromRequest = location.fromRequest || null;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    partner1_name: '',
    partner2_name: '',
    wedding_date: fromRequest?.wedding_date || '',
    slug: '',
    theme: fromRequest?.interested_theme || 'botanical',
    package: fromRequest?.interested_package || 'starter',
    client_name: fromRequest?.name || '',
    client_email: fromRequest?.email || '',
    // Partner-System Felder
    partner_code_id: fromRequest?.partner_code_id || null,
    coupon_code: fromRequest?.coupon_code || null,
    contact_request_id: fromRequest?.id || null,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Auto-generate slug from partner names
    if (field === 'partner1_name' || field === 'partner2_name') {
      const p1 = field === 'partner1_name' ? value : formData.partner1_name;
      const p2 = field === 'partner2_name' ? value : formData.partner2_name;
      if (p1 && p2) {
        const slug = `${p1}-${p2}`.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partner1_name || !formData.partner2_name) {
      toast.error('Bitte beide Partnernamen eingeben');
      return;
    }

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
    const pkg = PACKAGES[formData.package];
    
    const projectData = {
      partner1_name: formData.partner1_name,
      partner2_name: formData.partner2_name,
      couple_names: `${formData.partner1_name} & ${formData.partner2_name}`,
      wedding_date: formData.wedding_date || null,
      slug: formData.slug || `${formData.partner1_name}-${formData.partner2_name}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      theme: formData.theme,
      package: formData.package,
      status: 'draft',
      client_name: formData.client_name || null,
      client_email: formData.client_email || null,
      admin_password: Math.random().toString(36).substring(2, 10),
      active_components: [...CORE_COMPONENTS],
      component_order: DEFAULT_COMPONENT_ORDER,
      total_price: pkg?.price || 0,
      addons: [],
      extra_components_count: 0,
      discount: 0,
      // Partner-System
      partner_code_id: formData.partner_code_id || null,
      coupon_code: formData.coupon_code || null,
      contact_request_id: formData.contact_request_id || null,
    };

    const { data, error } = await createProject(projectData);
    
    if (error) {
      toast.error('Fehler beim Erstellen');
      console.error(error);
    } else {
      toast.success('Projekt erstellt!');
      navigate(`/projects/${data.id}`);
    }
    setIsSaving(false);
  };

  return (
    <Layout>
      <Header>
        <Title>Neues Projekt</Title>
        <Subtitle>Erstelle eine neue Hochzeits-Website</Subtitle>
      </Header>

      <Form onSubmit={handleSubmit}>
        <Section>
          <SectionHeader>
            <SectionNumber>01</SectionNumber>
            <SectionTitle>Brautpaar</SectionTitle>
          </SectionHeader>
          <SectionBody>
            <FormGrid>
              <FormGroup>
                <Label>Partner 1 *</Label>
                <Input value={formData.partner1_name} onChange={e => handleChange('partner1_name', e.target.value)}
                  placeholder="Vorname" required />
              </FormGroup>
              <FormGroup>
                <Label>Partner 2 *</Label>
                <Input value={formData.partner2_name} onChange={e => handleChange('partner2_name', e.target.value)}
                  placeholder="Vorname" required />
              </FormGroup>
              <FormGroup>
                <Label>Hochzeitsdatum</Label>
                <Input type="date" value={formData.wedding_date} onChange={e => handleChange('wedding_date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </FormGroup>
              <FormGroup>
                <Label>URL-Slug</Label>
                <Input value={formData.slug} onChange={e => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="anna-max" />
              </FormGroup>
            </FormGrid>
          </SectionBody>
        </Section>

        <Section>
          <SectionHeader>
            <SectionNumber>02</SectionNumber>
            <SectionTitle>Kundenkontakt</SectionTitle>
          </SectionHeader>
          <SectionBody>
            <FormGrid>
              <FormGroup>
                <Label>Kundenname</Label>
                <Input value={formData.client_name} onChange={e => handleChange('client_name', e.target.value)}
                  placeholder="Max Mustermann" />
              </FormGroup>
              <FormGroup>
                <Label>E-Mail</Label>
                <Input type="email" value={formData.client_email} onChange={e => handleChange('client_email', e.target.value)}
                  placeholder="kunde@email.de" />
              </FormGroup>
            </FormGrid>
          </SectionBody>
        </Section>

        <Section>
          <SectionHeader>
            <SectionNumber>03</SectionNumber>
            <SectionTitle>Paket</SectionTitle>
          </SectionHeader>
          <SectionBody>
            <PackageSelector>
              {Object.values(PACKAGES).map(pkg => (
                <PackageCard key={pkg.id} $selected={formData.package === pkg.id}
                  onClick={() => handleChange('package', pkg.id)}>
                  <div className="name">{pkg.name}</div>
                  <div className="price">{pkg.price > 0 ? formatPrice(pkg.price) : 'Individuell'}</div>
                  <div className="note">{pkg.hosting}</div>
                </PackageCard>
              ))}
            </PackageSelector>
          </SectionBody>
        </Section>

        <Section>
          <SectionHeader>
            <SectionNumber>04</SectionNumber>
            <SectionTitle>Theme</SectionTitle>
          </SectionHeader>
          <SectionBody>
            <ThemeSelector>
              {Object.values(THEMES).map(theme => (
                <ThemeCard key={theme.id} $selected={formData.theme === theme.id}
                  onClick={() => handleChange('theme', theme.id)}>
                  <div className="name">{theme.name}</div>
                  <div className="desc">{theme.description}</div>
                </ThemeCard>
              ))}
            </ThemeSelector>
          </SectionBody>
        </Section>

        <Actions>
          <Button type="button" onClick={() => navigate('/projects')}>Abbrechen</Button>
          <Button type="submit" $primary disabled={isSaving}>
            {isSaving ? 'Erstellen...' : 'Projekt erstellen'}
          </Button>
        </Actions>
      </Form>
    </Layout>
  );
}
