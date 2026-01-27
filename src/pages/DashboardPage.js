// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { getDashboardStats, getAllProjects } from '../lib/supabase';
import { PACKAGES, PROJECT_STATUS } from '../lib/constants';

const Header = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 2rem;
    font-weight: 400;
    color: #1A1A1A;
    margin-bottom: 0.25rem;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
`;

const StatCard = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
  padding: 1.5rem;
  
  .label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 2rem;
    font-weight: 500;
    color: ${p => p.$color || '#1A1A1A'};
  }
`;

const Section = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E5E5E5;
  
  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.1rem;
    font-weight: 400;
  }
  
  a {
    font-size: 0.75rem;
    color: #666;
    
    &:hover { color: #1A1A1A; text-decoration: underline; }
  }
`;

const ProjectList = styled.div``;

const ProjectRow = styled(Link)`
  display: grid;
  grid-template-columns: 1fr 120px 100px 100px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #F5F5F5;
  align-items: center;
  transition: background 0.15s ease;
  
  &:last-child { border-bottom: none; }
  &:hover { background: #FAFAFA; }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr auto;
  }
`;

const ProjectInfo = styled.div`
  .name {
    font-weight: 500;
    color: #1A1A1A;
    margin-bottom: 0.15rem;
  }
  
  .slug {
    font-size: 0.75rem;
    color: #999;
    font-family: 'JetBrains Mono', monospace;
  }
`;

const PackageBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.6rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: #F5F5F5;
  color: #666;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.6rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: ${p => p.$color ? `${p.$color}15` : '#F5F5F5'};
  color: ${p => p.$color || '#666'};
`;

const Price = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #1A1A1A;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
  
  p { margin-bottom: 1rem; }
  
  a {
    color: #1A1A1A;
    text-decoration: underline;
    
    &:hover { text-decoration: none; }
  }
`;

const AlertBox = styled.div`
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .text {
    font-size: 0.9rem;
    color: #92400E;
  }
  
  a {
    font-size: 0.75rem;
    font-weight: 600;
    color: #92400E;
    text-decoration: underline;
  }
`;

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsRes, projectsRes] = await Promise.all([
      getDashboardStats(),
      getAllProjects(),
    ]);
    
    setStats(statsRes);
    setRecentProjects(projectsRes.data?.slice(0, 5) || []);
    setIsLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
  };

  if (isLoading) {
    return <Layout><div style={{ color: '#666', padding: '2rem' }}>Laden...</div></Layout>;
  }

  return (
    <Layout stats={stats}>
      <Header>
        <h1>Dashboard</h1>
        <p>Übersicht aller Hochzeitsprojekte</p>
      </Header>
      
      {stats.newRequests > 0 && (
        <AlertBox>
          <span className="text">⚡ {stats.newRequests} neue Anfrage{stats.newRequests > 1 ? 'n' : ''} wartet auf Bearbeitung</span>
          <Link to="/requests">Anfragen ansehen →</Link>
        </AlertBox>
      )}
      
      <StatsGrid>
        <StatCard>
          <div className="label">Projekte gesamt</div>
          <div className="value">{stats.totalProjects || 0}</div>
        </StatCard>
        <StatCard $color="#22c55e">
          <div className="label">Live</div>
          <div className="value">{stats.liveProjects || 0}</div>
        </StatCard>
        <StatCard $color="#eab308">
          <div className="label">Save the Date</div>
          <div className="value">{stats.stdProjects || 0}</div>
        </StatCard>
        <StatCard $color="#64748b">
          <div className="label">Archiv</div>
          <div className="value">{stats.archivProjects || 0}</div>
        </StatCard>
      </StatsGrid>
      
      <Section>
        <SectionHeader>
          <h2>Aktuelle Projekte</h2>
          <Link to="/projects">Alle anzeigen →</Link>
        </SectionHeader>
        
        {recentProjects.length > 0 ? (
          <ProjectList>
            {recentProjects.map(project => {
              const pkg = PACKAGES[project.package_type];
              const status = PROJECT_STATUS[project.status];
              return (
                <ProjectRow key={project.id} to={`/projects/${project.id}`}>
                  <ProjectInfo>
                    <div className="name">{project.couple_names || 'Unbenannt'}</div>
                    <div className="slug">/{project.slug}</div>
                  </ProjectInfo>
                  <PackageBadge>{pkg?.name || '–'}</PackageBadge>
                  <StatusBadge $color={status?.color}>{status?.label || project.status}</StatusBadge>
                  <Price>{project.total_price ? formatPrice(project.total_price) : '–'}</Price>
                </ProjectRow>
              );
            })}
          </ProjectList>
        ) : (
          <EmptyState>
            <p>Noch keine Projekte vorhanden.</p>
            <Link to="/projects/new">Erstes Projekt erstellen →</Link>
          </EmptyState>
        )}
      </Section>
    </Layout>
  );
}
