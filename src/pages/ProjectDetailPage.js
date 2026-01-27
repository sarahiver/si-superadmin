// src/pages/ProjectDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getProjectById, updateProject, deleteProject, getDashboardStats } from '../lib/supabase';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.25rem;
  background: ${p => p.$danger ? '#ff4444' : p.$primary ? '#fff' : '#222'};
  color: ${p => p.$primary ? '#000' : '#fff'};
  border: 1px solid ${p => p.$danger ? '#ff4444' : p.$primary ? '#fff' : '#333'};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  
  &:disabled {
    opacity: 0.5;
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

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${p => {
    switch(p.$status) {
      case 'live': return '#22c55e22';
      case 'std': return '#eab30822';
      case 'archiv': return '#66666622';
      default: return '#33333322';
    }
  }};
  color: ${p => {
    switch(p.$status) {
      case 'live': return '#22c55e';
      case 'std': return '#eab308';
      case 'archiv': return '#666';
      default: return '#888';
    }
  }};
`;

const LinkBox = styled.div`
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  
  a {
    color: #fff;
    
    &:hover { text-decoration: underline; }
  }
  
  button {
    background: #222;
    border: none;
    color: #888;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    
    &:hover { color: #fff; }
  }
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

const COMPONENTS = [
  'hero', 'countdown', 'lovestory', 'timeline', 'locations', 'directions',
  'rsvp', 'dresscode', 'gifts', 'accommodations', 'witnesses', 'gallery',
  'musicwishes', 'guestbook', 'faq', 'weddingabc', 'photoupload'
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const [projectRes, statsRes] = await Promise.all([
      getProjectById(id),
      getDashboardStats(),
    ]);
    
    if (projectRes.data) {
      setProject(projectRes.data);
      setFormData(projectRes.data);
    }
    setStats(statsRes);
    setIsLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComponentToggle = (comp) => {
    const current = formData.active_components || [];
    const updated = current.includes(comp)
      ? current.filter(c => c !== comp)
      : [...current, comp];
    handleChange('active_components', updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProject(id, {
      couple_names: formData.couple_names,
      slug: formData.slug,
      wedding_date: formData.wedding_date,
      status: formData.status,
      custom_domain: formData.custom_domain || null,
      theme: formData.theme,
      active_components: formData.active_components,
      admin_password: formData.admin_password,
    });
    
    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Gespeichert! ✓');
      setProject(formData);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Projekt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    const { error } = await deleteProject(id);
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Projekt gelöscht');
      navigate('/projects');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopiert!');
  };

  if (isLoading) {
    return <Layout stats={stats}><div style={{ color: '#666' }}>Laden...</div></Layout>;
  }

  if (!project) {
    return <Layout stats={stats}><div>Projekt nicht gefunden</div></Layout>;
  }

  const baseUrl = formData.custom_domain || `siweddings.de/${formData.slug}`;

  return (
    <Layout stats={stats}>
      <BackLink to="/projects">← Zurück zu Projekte</BackLink>
      
      <Header>
        <div>
          <Title>{formData.couple_names || 'Unbenannt'}</Title>
          <StatusBadge $status={formData.status}>{formData.status || 'draft'}</StatusBadge>
        </div>
        <Actions>
          <Button $danger onClick={handleDelete}>Löschen</Button>
          <Button $primary onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        </Actions>
      </Header>
      
      <Grid>
        <Section>
          <SectionTitle>📋 Grunddaten</SectionTitle>
          
          <FormGroup>
            <Label>Paarname</Label>
            <Input
              value={formData.couple_names || ''}
              onChange={(e) => handleChange('couple_names', e.target.value)}
              placeholder="z.B. Sarah & Iver"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Slug (URL-Pfad)</Label>
            <Input
              value={formData.slug || ''}
              onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="z.B. sarah-iver"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Hochzeitsdatum</Label>
            <Input
              type="date"
              value={formData.wedding_date?.split('T')[0] || ''}
              onChange={(e) => handleChange('wedding_date', e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Theme</Label>
            <Select
              value={formData.theme || 'editorial'}
              onChange={(e) => handleChange('theme', e.target.value)}
            >
              <option value="editorial">Editorial</option>
              <option value="video">Video</option>
              <option value="botanical">Botanical</option>
              <option value="contemporary">Contemporary</option>
              <option value="luxe">Luxe</option>
            </Select>
          </FormGroup>
        </Section>
        
        <Section>
          <SectionTitle>🌐 Domain & Status</SectionTitle>
          
          <FormGroup>
            <Label>Status</Label>
            <Select
              value={formData.status || 'draft'}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="draft">Entwurf</option>
              <option value="std">Save the Date</option>
              <option value="live">Live</option>
              <option value="archiv">Archiv</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Custom Domain (optional)</Label>
            <Input
              value={formData.custom_domain || ''}
              onChange={(e) => handleChange('custom_domain', e.target.value.toLowerCase())}
              placeholder="z.B. sarah-iver.de"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Admin Passwort (Kunden-Dashboard)</Label>
            <Input
              value={formData.admin_password || ''}
              onChange={(e) => handleChange('admin_password', e.target.value)}
              placeholder="Passwort für /{slug}/admin"
            />
          </FormGroup>
        </Section>
        
        <Section style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>🔗 Links</SectionTitle>
          
          <FormGroup>
            <Label>Hochzeitsseite</Label>
            <LinkBox>
              <a href={`https://${baseUrl}`} target="_blank" rel="noopener noreferrer">
                {baseUrl}
              </a>
              <button onClick={() => copyToClipboard(`https://${baseUrl}`)}>Kopieren</button>
            </LinkBox>
          </FormGroup>
          
          <FormGroup>
            <Label>Kunden-Dashboard</Label>
            <LinkBox>
              <a href={`https://${baseUrl}/admin`} target="_blank" rel="noopener noreferrer">
                {baseUrl}/admin
              </a>
              <button onClick={() => copyToClipboard(`https://${baseUrl}/admin`)}>Kopieren</button>
            </LinkBox>
          </FormGroup>
        </Section>
        
        <Section style={{ gridColumn: '1 / -1' }}>
          <SectionTitle>🧩 Aktive Komponenten</SectionTitle>
          
          <ComponentsGrid>
            {COMPONENTS.map(comp => (
              <ComponentToggle 
                key={comp} 
                $active={formData.active_components?.includes(comp)}
              >
                <input
                  type="checkbox"
                  checked={formData.active_components?.includes(comp) || false}
                  onChange={() => handleComponentToggle(comp)}
                />
                {comp}
              </ComponentToggle>
            ))}
          </ComponentsGrid>
        </Section>
      </Grid>
    </Layout>
  );
}
