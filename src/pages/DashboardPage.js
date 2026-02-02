// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { getProjects } from '../lib/supabase';
import { PACKAGES, PROJECT_STATUS, formatPrice } from '../lib/constants';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const Header = styled.div`display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black};`;
const Title = styled.h1`font-family: 'Oswald', sans-serif; font-size: 3rem; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; color: ${colors.black}; line-height: 1;`;
const Subtitle = styled.p`font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.gray}; margin-top: 0.5rem;`;
const NewButton = styled(Link)`font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: ${colors.red}; color: ${colors.white}; text-decoration: none; padding: 1rem 2rem; border: 2px solid ${colors.red}; transition: all 0.2s ease; &:hover { background: ${colors.black}; border-color: ${colors.black}; }`;
const StatsGrid = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 3rem; @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 500px) { grid-template-columns: 1fr; }`;
const StatCard = styled.div`background: ${colors.white}; border: 2px solid ${colors.black}; padding: 1.5rem; .label { font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.5rem; } .value { font-family: 'Oswald', sans-serif; font-size: 2.5rem; font-weight: 600; color: ${colors.black}; }`;
const SectionTitle = styled.h2`font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${colors.black}; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; &::after { content: ''; flex: 1; height: 2px; background: ${colors.lightGray}; }`;
const ProjectsGrid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; @media (max-width: 1000px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const ProjectCard = styled(Link)`background: ${colors.white}; border: 2px solid ${colors.black}; text-decoration: none; transition: all 0.2s ease; display: flex; flex-direction: column; &:hover { transform: translateY(-4px); box-shadow: 8px 8px 0 ${colors.black}; }`;
const CardHeader = styled.div`background: ${colors.black}; color: ${colors.white}; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; .names { font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 600; text-transform: uppercase; }`;
const StatusDot = styled.span`width: 10px; height: 10px; border-radius: 50%; background: ${p => p.$color || colors.gray};`;
const CardBody = styled.div`padding: 1.25rem;`;
const CardRow = styled.div`display: flex; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 0.85rem; margin-bottom: 0.5rem; &:last-child { margin-bottom: 0; } .label { color: ${colors.gray}; } .value { color: ${colors.black}; font-weight: 500; }`;
const CardFooter = styled.div`padding: 1rem 1.25rem; border-top: 1px solid ${colors.lightGray}; display: flex; justify-content: space-between; align-items: center; .price { font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600; color: ${colors.red}; } .status { font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.35rem 0.75rem; background: ${p => p.$color ? `${p.$color}20` : colors.background}; color: ${p => p.$color || colors.gray}; }`;
const EmptyState = styled.div`text-align: center; padding: 4rem 2rem; background: ${colors.white}; border: 2px dashed ${colors.lightGray}; .icon { font-size: 3rem; margin-bottom: 1rem; } .title { font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 600; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.5rem; } .text { font-family: 'Inter', sans-serif; font-size: 0.9rem; color: ${colors.gray}; margin-bottom: 1.5rem; }`;

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadProjects(); }, []);
  const loadProjects = async () => { const { data } = await getProjects(); setProjects(data || []); setIsLoading(false); };

  const stats = {
    total: projects.length,
    live: projects.filter(p => p.status === 'live').length,
    inProgress: projects.filter(p => ['inquiry', 'in_progress', 'std'].includes(p.status)).length,
    revenue: projects.reduce((sum, p) => sum + (p.total_price || 0), 0),
  };

  const recentProjects = [...projects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  if (isLoading) return <Layout><div style={{ padding: '2rem', color: colors.gray }}>Laden...</div></Layout>;

  return (
    <Layout>
      <Header>
        <div><Title>Dashboard</Title><Subtitle>Willkommen zurück!</Subtitle></div>
        <NewButton to="/projects/new">+ Neues Projekt</NewButton>
      </Header>

      <StatsGrid>
        <StatCard><div className="label">Projekte</div><div className="value">{stats.total}</div></StatCard>
        <StatCard><div className="label">Live</div><div className="value" style={{ color: colors.green }}>{stats.live}</div></StatCard>
        <StatCard><div className="label">In Bearbeitung</div><div className="value" style={{ color: colors.orange }}>{stats.inProgress}</div></StatCard>
        <StatCard><div className="label">Umsatz</div><div className="value" style={{ color: colors.red }}>{formatPrice(stats.revenue)}</div></StatCard>
      </StatsGrid>

      <SectionTitle>Neueste Projekte</SectionTitle>

      {recentProjects.length === 0 ? (
        <EmptyState>
          <div className="icon">💒</div>
          <div className="title">Noch keine Projekte</div>
          <div className="text">Erstelle dein erstes Projekt!</div>
          <NewButton to="/projects/new">+ Neues Projekt</NewButton>
        </EmptyState>
      ) : (
        <ProjectsGrid>
          {recentProjects.map(project => {
            const status = PROJECT_STATUS[project.status];
            const pkg = PACKAGES[project.package];
            return (
              <ProjectCard key={project.id} to={`/projects/${project.id}`}>
                <CardHeader><span className="names">{project.couple_names || 'Unbenannt'}</span><StatusDot $color={status?.color} /></CardHeader>
                <CardBody>
                  <CardRow><span className="label">Datum</span><span className="value">{project.wedding_date ? new Date(project.wedding_date).toLocaleDateString('de-DE') : '–'}</span></CardRow>
                  <CardRow><span className="label">Paket</span><span className="value">{pkg?.name || 'Starter'}</span></CardRow>
                  <CardRow><span className="label">Theme</span><span className="value" style={{ textTransform: 'capitalize' }}>{project.theme || 'botanical'}</span></CardRow>
                </CardBody>
                <CardFooter $color={status?.color}>
                  <span className="price">{formatPrice(project.total_price || pkg?.price || 0)}</span>
                  <span className="status">{status?.label || 'Entwurf'}</span>
                </CardFooter>
              </ProjectCard>
            );
          })}
        </ProjectsGrid>
      )}
    </Layout>
  );
}
