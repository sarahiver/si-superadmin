// src/pages/ProjectsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { getAllProjects, getDashboardStats } from '../lib/supabase';
import { PACKAGES, PROJECT_STATUS } from '../lib/constants';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 2rem;
    font-weight: 400;
  }
`;

const NewButton = styled(Link)`
  padding: 0.75rem 1.5rem;
  background: #1A1A1A;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: background 0.2s;
  
  &:hover { background: #333; }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.65rem 1rem;
  background: #fff;
  border: 1px solid #E5E5E5;
  font-size: 0.85rem;
  width: 250px;
  
  &:focus {
    outline: none;
    border-color: #1A1A1A;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 0.25rem;
  background: #fff;
  border: 1px solid #E5E5E5;
  padding: 0.25rem;
`;

const FilterButton = styled.button`
  padding: 0.5rem 0.875rem;
  background: ${p => p.$active ? '#1A1A1A' : 'transparent'};
  color: ${p => p.$active ? '#fff' : '#666'};
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s;
  
  &:hover {
    background: ${p => p.$active ? '#1A1A1A' : '#F5F5F5'};
  }
`;

const Table = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 120px 100px 120px 80px;
  gap: 1rem;
  padding: 0.875rem 1.5rem;
  background: #FAFAFA;
  border-bottom: 1px solid #E5E5E5;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const TableRow = styled(Link)`
  display: grid;
  grid-template-columns: 1fr 120px 120px 100px 120px 80px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #F5F5F5;
  align-items: center;
  transition: background 0.15s;
  
  &:last-child { border-bottom: none; }
  &:hover { background: #FAFAFA; }
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr auto;
    
    > *:not(:first-child):not(:nth-child(4)) {
      display: none;
    }
  }
`;

const CoupleInfo = styled.div`
  .name {
    font-weight: 500;
    color: #1A1A1A;
    margin-bottom: 0.15rem;
  }
  
  .meta {
    font-size: 0.75rem;
    color: #999;
    
    code {
      font-family: 'JetBrains Mono', monospace;
      background: #F5F5F5;
      padding: 0.1rem 0.3rem;
      margin-right: 0.5rem;
    }
  }
`;

const PackageBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: ${p => p.$popular ? '#1A1A1A' : '#F5F5F5'};
  color: ${p => p.$popular ? '#fff' : '#666'};
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: ${p => p.$color ? `${p.$color}15` : '#F5F5F5'};
  color: ${p => p.$color || '#666'};
`;

const DateCell = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const PriceCell = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #1A1A1A;
`;

const ComponentCount = styled.div`
  font-size: 0.8rem;
  color: #666;
  
  span {
    font-weight: 600;
    color: #1A1A1A;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  
  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.25rem;
    font-weight: 400;
    color: #1A1A1A;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
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
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatPrice = (price) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  if (isLoading) {
    return <Layout stats={stats}><div style={{ color: '#666', padding: '2rem' }}>Laden...</div></Layout>;
  }

  return (
    <Layout stats={stats}>
      <Header>
        <h1>Projekte</h1>
        <NewButton to="/projects/new">+ Neues Projekt</NewButton>
      </Header>
      
      <Toolbar>
        <SearchInput
          placeholder="Suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Filters>
          <FilterButton $active={filter === 'all'} onClick={() => setFilter('all')}>
            Alle ({projects.length})
          </FilterButton>
          <FilterButton $active={filter === 'live'} onClick={() => setFilter('live')}>
            Live
          </FilterButton>
          <FilterButton $active={filter === 'std'} onClick={() => setFilter('std')}>
            STD
          </FilterButton>
          <FilterButton $active={filter === 'archiv'} onClick={() => setFilter('archiv')}>
            Archiv
          </FilterButton>
        </Filters>
      </Toolbar>
      
      {filteredProjects.length > 0 ? (
        <Table>
          <TableHeader>
            <div>Projekt</div>
            <div>Paket</div>
            <div>Hochzeit</div>
            <div>Status</div>
            <div>Preis</div>
            <div>Komp.</div>
          </TableHeader>
          
          {filteredProjects.map(project => {
            const pkg = PACKAGES[project.package_type];
            const status = PROJECT_STATUS[project.status];
            const componentCount = project.active_components?.length || 0;
            
            return (
              <TableRow key={project.id} to={`/projects/${project.id}`}>
                <CoupleInfo>
                  <div className="name">{project.couple_names || 'Unbenannt'}</div>
                  <div className="meta">
                    <code>siwedding.de/{project.slug}</code>
                    {project.custom_domain && <span>• {project.custom_domain}</span>}
                  </div>
                </CoupleInfo>
                <PackageBadge $popular={pkg?.popular}>{pkg?.name || '–'}</PackageBadge>
                <DateCell>{formatDate(project.wedding_date)}</DateCell>
                <StatusBadge $color={status?.color}>{status?.label || project.status || 'Entwurf'}</StatusBadge>
                <PriceCell>{formatPrice(project.total_price)}</PriceCell>
                <ComponentCount><span>{componentCount}</span> aktiv</ComponentCount>
              </TableRow>
            );
          })}
        </Table>
      ) : (
        <Table>
          <EmptyState>
            <h2>Keine Projekte gefunden</h2>
            <p>Erstelle dein erstes Projekt oder passe die Filter an.</p>
          </EmptyState>
        </Table>
      )}
    </Layout>
  );
}
