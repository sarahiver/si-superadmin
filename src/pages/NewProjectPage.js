// src/pages/NewProjectPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { createProject } from '../lib/supabase';

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  display: inline-block;
  
  &:hover { color: #fff; }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
`;

const Form = styled.form`
  max-width: 600px;
`;

const Section = styled.div`
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
  
  &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #555;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #555;
  }
`;

const Hint = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.5rem;
`;

const ComponentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
`;

const ComponentToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${p => p.$active ? '#22c55e22' : '#0a0a0a'};
  border: 1px solid ${p => p.$active ? '#22c55e44' : '#333'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${p => p.$active ? '#22c55e' : '#555'};
  }
  
  input {
    accent-color: #22c55e;
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #eee;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DEFAULT_COMPONENTS = [
  'hero', 'countdown', 'lovestory', 'timeline', 'locations', 
  'rsvp', 'dresscode', 'gallery', 'faq'
];

const ALL_COMPONENTS = [
  'hero', 'countdown', 'lovestory', 'timeline', 'locations', 'directions',
  'rsvp', 'dresscode', 'gifts', 'accommodations', 'witnesses', 'gallery',
  'musicwishes', 'guestbook', 'faq', 'weddingabc', 'photoupload'
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    couple_names: '',
    slug: '',
    wedding_date: '',
    theme: 'editorial',
    status: 'draft',
    admin_password: '',
    active_components: DEFAULT_COMPONENTS,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from couple names
    if (field === 'couple_names') {
      const slug = value
        .toLowerCase()
        .replace(/\s*&\s*/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleComponentToggle = (comp) => {
    const current = formData.active_components || [];
    const updated = current.includes(comp)
      ? current.filter(c => c !== comp)
      : [...current, comp];
    handleChange('active_components', updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.couple_names || !formData.slug) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }
    
    setIsSubmitting(true);
    
    const { data, error } = await createProject({
      couple_names: formData.couple_names,
      slug: formData.slug,
      wedding_date: formData.wedding_date || null,
      theme: formData.theme,
      status: formData.status,
      admin_password: formData.admin_password || 'wedding2026',
      active_components: formData.active_components,
    });
    
    if (error) {
      toast.error('Fehler: ' + error.message);
      setIsSubmitting(false);
    } else {
      toast.success('Projekt erstellt! 🎉');
      navigate(`/projects/${data.id}`);
    }
  };

  return (
    <Layout>
      <Header>
        <BackLink to="/projects">← Zurück zu Projekte</BackLink>
        <Title>Neues Projekt</Title>
      </Header>
      
      <Form onSubmit={handleSubmit}>
        <Section>
          <SectionTitle>📋 Grunddaten</SectionTitle>
          
          <FormGroup>
            <Label>Paarname *</Label>
            <Input
              value={formData.couple_names}
              onChange={(e) => handleChange('couple_names', e.target.value)}
              placeholder="z.B. Sarah & Iver"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Slug (URL-Pfad) *</Label>
            <Input
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="z.B. sarah-iver"
              required
            />
            <Hint>URL: siweddings.de/{formData.slug || 'slug'}</Hint>
          </FormGroup>
          
          <FormGroup>
            <Label>Hochzeitsdatum</Label>
            <Input
              type="date"
              value={formData.wedding_date}
              onChange={(e) => handleChange('wedding_date', e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Theme</Label>
            <Select
              value={formData.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
            >
              <option value="editorial">Editorial (Schwarz/Weiß)</option>
              <option value="video">Video (Cinematisch)</option>
              <option value="botanical">Botanical (Grüntöne)</option>
              <option value="contemporary">Contemporary (Modern)</option>
              <option value="luxe">Luxe (Gold)</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Admin Passwort (Kunden-Dashboard)</Label>
            <Input
              value={formData.admin_password}
              onChange={(e) => handleChange('admin_password', e.target.value)}
              placeholder="Passwort für /admin"
            />
            <Hint>Wird dem Kunden mitgeteilt für sein Dashboard</Hint>
          </FormGroup>
        </Section>
        
        <Section>
          <SectionTitle>🧩 Komponenten</SectionTitle>
          
          <ComponentsGrid>
            {ALL_COMPONENTS.map(comp => (
              <ComponentToggle 
                key={comp} 
                $active={formData.active_components.includes(comp)}
              >
                <input
                  type="checkbox"
                  checked={formData.active_components.includes(comp)}
                  onChange={() => handleComponentToggle(comp)}
                />
                {comp}
              </ComponentToggle>
            ))}
          </ComponentsGrid>
        </Section>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wird erstellt...' : 'Projekt erstellen'}
        </Button>
      </Form>
    </Layout>
  );
}
