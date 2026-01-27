// src/pages/ProjectsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { getAllProjects, getDashboardStats } from '../lib/supabase';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
  }
`;

const NewButton = styled(Link)`
  padding: 0.75rem 1.5rem;
  background: #fff;
  color: #000;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    background: #eee;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${p => p.$active ? '#fff' : '#111'};
  color: ${p => p.$active ? '#000' : '#888'};
  border: 1px solid ${p => p.$active ? '#fff' : '#333'};
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #fff;
    color: ${p => p.$active ? '#000' : '#fff'};
  }
  
  span {
    margin-left: 0.5rem;
    opacity: 0.6;
  }
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  width: 100%;
  max-width: 300px;
  margin-bottom: 1.5rem;
  
  &:focus {
    outline: none;
    border-color: #555;
  }
  
  &::placeholder {
    color: #555;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
`;

const ProjectCard = styled(Link)`
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: #444;
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CoupleNames = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #888;
  
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .icon { font-size: 1rem; }
  
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: #666;
    background: #0a0a0a;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  
  h2 {
    font-size: 1.2rem;
    color: #888;
    margin-bottom: 0.5rem;
  }
`;

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [projectsRes, statsRes] = await Promise.all([
      getAllProjects(),
      getDashboardStats(),
    ]);
    setProjects(projectsRes.data || []);
    setStats(statsRes);
    setIsLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.couple_names?.toLowerCase().includes(s) ||
        p.slug?.toLowerCase().includes(s) ||
        p.custom_domain?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  if (isLoading) {
    return <Layout stats={stats}><div style={{ color: '#666' }}>Laden...</div></Layout>;
  }

  return (
    <Layout stats={stats}>
      <Header>
        <h1>Projekte ({projects.length})</h1>
        <NewButton to="/projects/new">+ Neues Projekt</NewButton>
      </Header>
      
      <SearchInput
        placeholder="Suchen nach Namen, Slug, Domain..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      <Filters>
        <FilterButton $active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle <span>{projects.length}</span>
        </FilterButton>
        <FilterButton $active={filter === 'live'} onClick={() => setFilter('live')}>
          Live <span>{stats.liveProjects || 0}</span>
        </FilterButton>
        <FilterButton $active={filter === 'std'} onClick={() => setFilter('std')}>
          Save the Date <span>{stats.stdProjects || 0}</span>
        </FilterButton>
        <FilterButton $active={filter === 'archiv'} onClick={() => setFilter('archiv')}>
          Archiv <span>{stats.archivProjects || 0}</span>
        </FilterButton>
      </Filters>
      
      {filteredProjects.length > 0 ? (
        <Grid>
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} to={`/projects/${project.id}`}>
              <CardHeader>
                <CoupleNames>{project.couple_names || 'Unbenannt'}</CoupleNames>
                <StatusBadge $status={project.status}>{project.status || 'draft'}</StatusBadge>
              </CardHeader>
              <CardInfo>
                <div className="row">
                  <span className="icon">🔗</span>
                  <code>/{project.slug}</code>
                </div>
                {project.custom_domain && (
                  <div className="row">
                    <span className="icon">🌐</span>
                    <span>{project.custom_domain}</span>
                  </div>
                )}
                <div className="row">
                  <span className="icon">📅</span>
                  <span>Hochzeit: {formatDate(project.wedding_date)}</span>
                </div>
              </CardInfo>
            </ProjectCard>
          ))}
        </Grid>
      ) : (
        <EmptyState>
          <h2>Keine Projekte gefunden</h2>
          <p>Erstelle dein erstes Projekt oder passe die Filter an.</p>
        </EmptyState>
      )}
    </Layout>
  );
}
