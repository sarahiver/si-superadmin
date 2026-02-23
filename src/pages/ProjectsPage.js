// src/pages/ProjectsPage.js
// Editorial Design - Projects List
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { getProjects } from '../lib/supabase';
import { PACKAGES, PROJECT_STATUS, THEMES, formatPrice } from '../lib/constants';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black};
  flex-wrap: wrap; gap: 1rem;
`;

const Title = styled.h1`
  font-family: 'Oswald', sans-serif; font-size: 2.5rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: -0.02em; color: ${colors.black}; line-height: 1;
`;

const HeaderRight = styled.div`display: flex; gap: 1rem; align-items: center;`;

const NewButton = styled(Link)`
  font-family: 'Oswald', sans-serif; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em;
  text-transform: uppercase; background: ${colors.red}; color: ${colors.white}; text-decoration: none;
  padding: 0.875rem 1.5rem; border: 2px solid ${colors.red}; transition: all 0.2s ease;
  &:hover { background: ${colors.black}; border-color: ${colors.black}; }
`;

const FilterBar = styled.div`
  display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;
`;

const FilterButton = styled.button`
  font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 0.625rem 1rem; cursor: pointer; transition: all 0.2s ease;
  background: ${p => p.$active ? colors.black : colors.white};
  color: ${p => p.$active ? colors.white : colors.black};
  border: 2px solid ${colors.black};
  &:hover { background: ${p => p.$active ? colors.black : colors.background}; }
`;

const SearchInput = styled.input`
  font-family: 'Inter', sans-serif; font-size: 0.9rem; padding: 0.625rem 1rem;
  border: 2px solid ${colors.lightGray}; background: ${colors.white}; min-width: 250px;
  &:focus { outline: none; border-color: ${colors.black}; }
  &::placeholder { color: ${colors.gray}; }
`;

const Table = styled.div`border: 2px solid ${colors.black}; background: ${colors.white};`;

const TableHeader = styled.div`
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 100px;
  background: ${colors.black}; color: ${colors.white}; padding: 1rem 1.25rem;
  font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  @media (max-width: 900px) { display: none; }
`;

const TableRow = styled(Link)`
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 100px;
  padding: 1rem 1.25rem; border-bottom: 1px solid ${colors.lightGray};
  text-decoration: none; color: ${colors.black}; transition: all 0.15s ease;
  &:last-child { border-bottom: none; }
  &:hover { background: ${colors.background}; }
  
  @media (max-width: 900px) {
    display: flex; flex-direction: column; gap: 0.5rem;
    &::before { content: attr(data-couple); font-family: 'Oswald', sans-serif; font-size: 1.1rem;
      font-weight: 600; text-transform: uppercase; }
  }
`;

const Cell = styled.div`
  font-family: 'Inter', sans-serif; font-size: 0.9rem; display: flex; align-items: center;
  &.couple { font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 600; text-transform: uppercase; }
  &.price { font-weight: 600; color: ${colors.red}; }
  
  @media (max-width: 900px) {
    &.couple { display: none; }
    &::before { content: attr(data-label); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em;
      text-transform: uppercase; color: ${colors.gray}; margin-right: 0.5rem; min-width: 80px; }
  }
`;

const StatusBadge = styled.span`
  font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 0.3rem 0.6rem;
  background: ${p => p.$color ? `${p.$color}20` : colors.background};
  color: ${p => p.$color || colors.gray};
  ${p => p.$highlight && `
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 0 2px ${p.$color}40;
  `}
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const ActionButton = styled.span`
  font-family: 'Oswald', sans-serif; font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em;
  text-transform: uppercase; color: ${colors.red};
`;

const EmptyState = styled.div`
  text-align: center; padding: 4rem 2rem;
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  .title { font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600;
    text-transform: uppercase; margin-bottom: 0.5rem; }
  .text { font-family: 'Inter', sans-serif; font-size: 0.9rem; color: ${colors.gray}; }
`;

const Pagination = styled.div`
  display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem;
`;

const PageButton = styled.button`
  font-family: 'Inter', sans-serif; font-size: 0.85rem; padding: 0.5rem 1rem;
  background: ${p => p.$active ? colors.black : colors.white};
  color: ${p => p.$active ? colors.white : colors.black};
  border: 2px solid ${colors.black}; cursor: pointer;
  &:hover { background: ${p => p.$active ? colors.black : colors.background}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    const { data } = await getProjects();
    setProjects(data || []);
    setIsLoading(false);
  };

  // "all" zeigt alle AUSSER Demo-Projekte
  // "demo" zeigt nur Demo-Projekte
  const filteredProjects = projects
    .filter(p => {
      if (filter === 'all') return p.status !== 'demo';
      if (filter === 'demo') return p.status === 'demo';
      return p.status === filter;
    })
    .filter(p => !search || 
      (p.couple_names || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.slug || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const totalPages = Math.ceil(filteredProjects.length / perPage);
  const paginatedProjects = filteredProjects.slice((page - 1) * perPage, page * perPage);

  // Zähle alle außer Demo für "Alle"
  const nonDemoProjects = projects.filter(p => p.status !== 'demo');
  const statusCounts = {
    all: nonDemoProjects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    inquiry: projects.filter(p => p.status === 'inquiry').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    ready_for_review: projects.filter(p => p.status === 'ready_for_review').length,
    std: projects.filter(p => p.status === 'std').length,
    live: projects.filter(p => p.status === 'live').length,
    archive: projects.filter(p => p.status === 'archive').length,
    demo: projects.filter(p => p.status === 'demo').length,
  };

  if (isLoading) return <Layout><div style={{ padding: '2rem', color: colors.gray }}>Laden...</div></Layout>;

  return (
    <Layout>
      <Header>
        <Title>Projekte</Title>
        <HeaderRight>
          <SearchInput placeholder="Suchen..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <NewButton to="/projects/new">+ Neues Projekt</NewButton>
        </HeaderRight>
      </Header>

      <FilterBar>
        <FilterButton $active={filter === 'all'} onClick={() => { setFilter('all'); setPage(1); }}>
          Alle ({statusCounts.all})
        </FilterButton>
        {Object.entries(PROJECT_STATUS).map(([key, val]) => (
          <FilterButton key={key} $active={filter === key} onClick={() => { setFilter(key); setPage(1); }}>
            {val.label} ({statusCounts[key] || 0})
          </FilterButton>
        ))}
      </FilterBar>

      <Table>
        <TableHeader>
          <div>Paar</div>
          <div>Datum</div>
          <div>Paket</div>
          <div>Theme</div>
          <div>Status</div>
          <div>Preis</div>
          <div></div>
        </TableHeader>

        {paginatedProjects.length === 0 ? (
          <EmptyState>
            <div className="icon">🔍</div>
            <div className="title">Keine Projekte gefunden</div>
            <div className="text">{search ? 'Versuche eine andere Suche' : 'Erstelle dein erstes Projekt!'}</div>
          </EmptyState>
        ) : (
          paginatedProjects.map(project => {
            const status = PROJECT_STATUS[project.status];
            const pkg = PACKAGES[project.package];
            const theme = THEMES[project.theme];
            return (
              <TableRow key={project.id} to={`/projects/${project.id}`} data-couple={project.couple_names || 'Unbenannt'}>
                <Cell className="couple">{project.couple_names || 'Unbenannt'}</Cell>
                <Cell data-label="Datum">{project.wedding_date ? new Date(project.wedding_date).toLocaleDateString('de-DE') : '–'}</Cell>
                <Cell data-label="Paket">{pkg?.name || 'Starter'}</Cell>
                <Cell data-label="Theme">{theme?.name || project.theme || '–'}</Cell>
                <Cell data-label="Status">
                  <StatusBadge $color={status?.color} $highlight={project.status === 'ready_for_review'}>
                    {project.status === 'ready_for_review' && '🔔 '}
                    {status?.label || 'Entwurf'}
                  </StatusBadge>
                </Cell>
                <Cell className="price" data-label="Preis">{formatPrice(project.total_price || pkg?.price || 0)}</Cell>
                <Cell><ActionButton>Öffnen →</ActionButton></Cell>
              </TableRow>
            );
          })
        )}
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PageButton onClick={() => setPage(p => p - 1)} disabled={page === 1}>←</PageButton>
          {[...Array(totalPages)].map((_, i) => (
            <PageButton key={i} $active={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PageButton>
          ))}
          <PageButton onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>→</PageButton>
        </Pagination>
      )}
    </Layout>
  );
}
