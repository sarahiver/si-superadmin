// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { getDashboardStats, getAllProjects } from '../lib/supabase';

const Header = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    font-size: 0.9rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 1.5rem;
  
  .value {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${p => p.$color || '#fff'};
    font-family: 'JetBrains Mono', monospace;
  }
  
  .label {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.25rem;
  }
`;

const Section = styled.div`
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h2 {
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  a {
    font-size: 0.8rem;
    color: #888;
    
    &:hover { color: #fff; }
  }
`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProjectRow = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #0a0a0a;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: #1a1a1a;
  }
  
  .info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .name {
    font-weight: 500;
  }
  
  .slug {
    font-size: 0.8rem;
    color: #666;
    font-family: 'JetBrains Mono', monospace;
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  
  a {
    color: #fff;
    text-decoration: underline;
    
    &:hover { text-decoration: none; }
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

  if (isLoading) {
    return <Layout><div style={{ color: '#666' }}>Laden...</div></Layout>;
  }

  return (
    <Layout stats={stats}>
      <Header>
        <h1>Dashboard</h1>
        <p>Übersicht aller Hochzeitsprojekte</p>
      </Header>
      
      <StatsGrid>
        <StatCard>
          <div className="value">{stats.totalProjects || 0}</div>
          <div className="label">Projekte gesamt</div>
        </StatCard>
        <StatCard $color="#22c55e">
          <div className="value">{stats.liveProjects || 0}</div>
          <div className="label">Live</div>
        </StatCard>
        <StatCard $color="#eab308">
          <div className="value">{stats.stdProjects || 0}</div>
          <div className="label">Save the Date</div>
        </StatCard>
        <StatCard $color="#ff4444">
          <div className="value">{stats.newRequests || 0}</div>
          <div className="label">Neue Anfragen</div>
        </StatCard>
      </StatsGrid>
      
      <Section>
        <SectionHeader>
          <h2>Neueste Projekte</h2>
          <Link to="/projects">Alle anzeigen →</Link>
        </SectionHeader>
        
        {recentProjects.length > 0 ? (
          <ProjectList>
            {recentProjects.map(project => (
              <ProjectRow key={project.id} to={`/projects/${project.id}`}>
                <div className="info">
                  <span className="name">{project.couple_names || 'Unbenannt'}</span>
                  <span className="slug">/{project.slug}</span>
                </div>
                <StatusBadge $status={project.status}>{project.status || 'draft'}</StatusBadge>
              </ProjectRow>
            ))}
          </ProjectList>
        ) : (
          <EmptyState>
            Noch keine Projekte. <Link to="/projects/new">Jetzt erstellen →</Link>
          </EmptyState>
        )}
      </Section>
      
      {stats.newRequests > 0 && (
        <Section style={{ borderColor: '#ff444444' }}>
          <SectionHeader>
            <h2>⚠️ {stats.newRequests} neue Anfragen</h2>
            <Link to="/requests">Alle anzeigen →</Link>
          </SectionHeader>
        </Section>
      )}
    </Layout>
  );
}
