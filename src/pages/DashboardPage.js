// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getProjects, syncAllProjectStatuses } from '../lib/supabase';
import { PACKAGES, PROJECT_STATUS, formatPrice } from '../lib/constants';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5', purple: '#8B5CF6', blue: '#3B82F6' };

// ============================================
// HOSTING HELPER FUNCTIONS
// ============================================

function getHostingDuration(pkg) {
  switch (pkg) {
    case 'starter': return 6;
    case 'standard': return 8;
    case 'premium': return 12;
    case 'individual': return 12;
    default: return 6;
  }
}

function calculateHostingDates(project) {
  const pkg = project.package || 'starter';
  const hostingMonths = getHostingDuration(pkg);
  const totalHostingDays = hostingMonths * 30;
  const today = new Date();

  // Explicit dates from DB have priority
  if (project.hosting_start_date && project.hosting_end_date) {
    const startDate = new Date(project.hosting_start_date);
    const endDate = new Date(project.hosting_end_date);
    const daysRemaining = Math.ceil((endDate - today) / (24 * 60 * 60 * 1000));
    const daysElapsed = Math.ceil((today - startDate) / (24 * 60 * 60 * 1000));

    return {
      startDate,
      endDate,
      hostingMonths,
      totalHostingDays,
      daysRemaining,
      daysElapsed,
      isExpired: daysRemaining < 0,
      isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 30,
      isWarning: daysRemaining > 30 && daysRemaining <= 60,
      hasStarted: today >= startDate,
    };
  }

  // No explicit dates - estimate based on status
  // For live/std/archive projects without dates, assume hosting started at created_at
  const isActive = ['live', 'std', 'archive'].includes(project.status);

  if (isActive) {
    // Use created_at as hosting start (best guess without explicit date)
    const startDate = new Date(project.created_at);
    const endDate = new Date(startDate.getTime() + (totalHostingDays * 24 * 60 * 60 * 1000));
    const daysRemaining = Math.ceil((endDate - today) / (24 * 60 * 60 * 1000));
    const daysElapsed = Math.ceil((today - startDate) / (24 * 60 * 60 * 1000));

    return {
      startDate,
      endDate,
      hostingMonths,
      totalHostingDays,
      daysRemaining: Math.min(daysRemaining, totalHostingDays), // Cap at total
      daysElapsed,
      isExpired: daysRemaining < 0,
      isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 30,
      isWarning: daysRemaining > 30 && daysRemaining <= 60,
      hasStarted: true,
    };
  }

  // Project not yet active - show total hosting duration instead
  return {
    startDate: null,
    endDate: null,
    hostingMonths,
    totalHostingDays,
    daysRemaining: totalHostingDays, // Show total available days
    daysElapsed: 0,
    isExpired: false,
    isExpiringSoon: false,
    isWarning: false,
    hasStarted: false,
  };
}

function hasSTD(project) {
  if (project.has_std !== undefined) return project.has_std;
  const pkg = PACKAGES[project.package];
  return pkg?.includesSaveTheDate || false;
}

function hasArchive(project) {
  if (project.has_archive !== undefined) return project.has_archive;
  const pkg = PACKAGES[project.package];
  return pkg?.includesArchive || false;
}

function getActionItems(projects) {
  const actions = [];
  const today = new Date();

  projects.forEach(project => {
    const hosting = calculateHostingDates(project);

    // Hosting expiring soon
    if (hosting.isExpiringSoon && project.status === 'live') {
      actions.push({
        type: 'hosting_expiring',
        urgency: 'high',
        project,
        message: `Hosting läuft in ${hosting.daysRemaining} Tagen ab`,
        action: 'Verlängerung anbieten oder Archiv aktivieren',
      });
    } else if (hosting.isWarning && project.status === 'live') {
      actions.push({
        type: 'hosting_warning',
        urgency: 'medium',
        project,
        message: `Hosting läuft in ${hosting.daysRemaining} Tagen ab`,
        action: 'Kunde informieren',
      });
    }

    // Ready for review
    if (project.status === 'ready_for_review') {
      actions.push({
        type: 'needs_review',
        urgency: 'high',
        project,
        message: 'Wartet auf Prüfung',
        action: 'Daten überprüfen und live schalten',
      });
    }

    // STD active but wedding approaching
    if (project.status === 'std' && project.wedding_date) {
      const weddingDate = new Date(project.wedding_date);
      const daysToWedding = Math.ceil((weddingDate - today) / (24 * 60 * 60 * 1000));
      if (daysToWedding <= 60 && daysToWedding > 0) {
        actions.push({
          type: 'std_to_live',
          urgency: daysToWedding <= 14 ? 'high' : 'medium',
          project,
          message: `Hochzeit in ${daysToWedding} Tagen`,
          action: 'Prüfen ob auf Live umgestellt werden soll',
        });
      }
    }

    // Wedding passed but still live (should be archive)
    if (project.status === 'live' && project.wedding_date) {
      const weddingDate = new Date(project.wedding_date);
      const daysSinceWedding = Math.ceil((today - weddingDate) / (24 * 60 * 60 * 1000));
      if (daysSinceWedding > 30 && hasArchive(project)) {
        actions.push({
          type: 'should_archive',
          urgency: 'low',
          project,
          message: `Hochzeit vor ${daysSinceWedding} Tagen`,
          action: 'Archiv-Seite aktivieren',
        });
      }
    }
  });

  // Sort by urgency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

const Header = styled.div`display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid ${colors.black}; flex-wrap: wrap; gap: 1rem;`;
const Title = styled.h1`font-family: 'Oswald', sans-serif; font-size: 3rem; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; color: ${colors.black}; line-height: 1;`;
const Subtitle = styled.p`font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.gray}; margin-top: 0.5rem;`;
const ButtonGroup = styled.div`display: flex; gap: 1rem; flex-wrap: wrap;`;
const NewButton = styled(Link)`font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: ${colors.red}; color: ${colors.white}; text-decoration: none; padding: 1rem 2rem; border: 2px solid ${colors.red}; transition: all 0.2s ease; &:hover { background: ${colors.black}; border-color: ${colors.black}; }`;
const SyncButton = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: ${colors.white}; color: ${colors.black}; padding: 1rem 2rem; border: 2px solid ${colors.black}; cursor: pointer; transition: all 0.2s ease; &:hover { background: ${colors.black}; color: ${colors.white}; } &:disabled { opacity: 0.5; cursor: not-allowed; }`;
const StatsGrid = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 3rem; @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 500px) { grid-template-columns: 1fr; }`;
const StatCard = styled.div`background: ${colors.white}; border: 2px solid ${colors.black}; padding: 1.5rem; .label { font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.gray}; margin-bottom: 0.5rem; } .value { font-family: 'Oswald', sans-serif; font-size: 2.5rem; font-weight: 600; color: ${colors.black}; }`;
const SectionTitle = styled.h2`font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${colors.black}; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; &::after { content: ''; flex: 1; height: 2px; background: ${colors.lightGray}; }`;
const ProjectsGrid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; @media (max-width: 1000px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 600px) { grid-template-columns: 1fr; }`;
const ProjectCard = styled(Link)`background: ${colors.white}; border: 2px solid ${colors.black}; text-decoration: none; transition: all 0.2s ease; display: flex; flex-direction: column; &:hover { transform: translateY(-4px); box-shadow: 8px 8px 0 ${colors.black}; }`;
const CardHeader = styled.div`background: ${colors.black}; color: ${colors.white}; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; .names { font-family: 'Oswald', sans-serif; font-size: 1.1rem; font-weight: 600; text-transform: uppercase; }`;
const StatusDot = styled.span`width: 10px; height: 10px; border-radius: 50%; background: ${p => p.$color || colors.gray};`;
const CardBody = styled.div`padding: 1.25rem;`;
const CardRow = styled.div`display: flex; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 0.85rem; margin-bottom: 0.5rem; &:last-child { margin-bottom: 0; } .label { color: ${colors.gray}; } .value { color: ${colors.black}; font-weight: 500; text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; }`;
const UrlValue = styled.span`font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: ${colors.red}; font-weight: 500;`;
const CardFooter = styled.div`padding: 1rem 1.25rem; border-top: 1px solid ${colors.lightGray}; display: flex; justify-content: space-between; align-items: center; .price { font-family: 'Oswald', sans-serif; font-size: 1.25rem; font-weight: 600; color: ${colors.red}; } .status { font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.35rem 0.75rem; background: ${p => p.$color ? `${p.$color}20` : colors.background}; color: ${p => p.$color || colors.gray}; }`;
const EmptyState = styled.div`text-align: center; padding: 4rem 2rem; background: ${colors.white}; border: 2px dashed ${colors.lightGray}; .icon { font-size: 3rem; margin-bottom: 1rem; } .title { font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 600; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.5rem; } .text { font-family: 'Inter', sans-serif; font-size: 0.9rem; color: ${colors.gray}; margin-bottom: 1.5rem; }`;
const SyncInfo = styled.div`background: ${colors.green}20; border: 1px solid ${colors.green}; padding: 1rem 1.5rem; margin-bottom: 2rem; border-radius: 4px; font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.black}; display: flex; align-items: center; gap: 0.75rem;`;

// Action Items Section
const ActionsSection = styled.div`margin-bottom: 3rem;`;
const ActionsList = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const ActionItem = styled(Link)`
  display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
  background: ${colors.white}; border: 2px solid ${p => p.$urgency === 'high' ? colors.red : p.$urgency === 'medium' ? colors.orange : colors.lightGray};
  text-decoration: none; transition: all 0.2s ease;
  &:hover { transform: translateX(4px); box-shadow: 4px 4px 0 ${p => p.$urgency === 'high' ? colors.red : p.$urgency === 'medium' ? colors.orange : colors.lightGray}; }
`;
const ActionIcon = styled.span`
  width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem;
  background: ${p => p.$urgency === 'high' ? `${colors.red}15` : p.$urgency === 'medium' ? `${colors.orange}15` : `${colors.gray}15`};
`;
const ActionContent = styled.div`flex: 1;`;
const ActionTitle = styled.div`font-family: 'Oswald', sans-serif; font-size: 0.95rem; font-weight: 600; color: ${colors.black}; text-transform: uppercase;`;
const ActionMeta = styled.div`font-family: 'Inter', sans-serif; font-size: 0.8rem; color: ${colors.gray}; margin-top: 0.25rem;`;
const ActionBadge = styled.span`
  font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  padding: 0.35rem 0.75rem; border-radius: 4px;
  background: ${p => p.$urgency === 'high' ? `${colors.red}15` : p.$urgency === 'medium' ? `${colors.orange}15` : `${colors.gray}15`};
  color: ${p => p.$urgency === 'high' ? colors.red : p.$urgency === 'medium' ? colors.orange : colors.gray};
`;

// Enhanced Card Elements
const HostingBar = styled.div`
  height: 4px; background: ${colors.lightGray}; border-radius: 2px; margin-top: 0.75rem; overflow: hidden;
`;
const HostingProgress = styled.div`
  height: 100%; border-radius: 2px; transition: width 0.3s ease;
  width: ${p => Math.max(0, Math.min(100, p.$percent))}%;
  background: ${p => p.$expired ? colors.red : p.$warning ? colors.orange : colors.green};
`;
const HostingInfo = styled.div`
  display: flex; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 0.7rem; margin-top: 0.35rem;
  .label { color: ${colors.gray}; }
  .value { color: ${p => p.$expired ? colors.red : p.$warning ? colors.orange : colors.black}; font-weight: 500; }
`;
const FeatureBadges = styled.div`display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;`;
const FeatureBadge = styled.span`
  font-family: 'Inter', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  padding: 0.25rem 0.5rem; border-radius: 3px;
  background: ${p => p.$active ? `${p.$color || colors.purple}15` : `${colors.gray}10`};
  color: ${p => p.$active ? (p.$color || colors.purple) : colors.gray};
  border: 1px solid ${p => p.$active ? `${p.$color || colors.purple}30` : 'transparent'};
`;

// Stats enhancement
const StatCardEnhanced = styled(StatCard)`
  position: relative;
  &::after {
    content: '${p => p.$trend || ''}';
    position: absolute; top: 0.75rem; right: 0.75rem;
    font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600;
    color: ${p => p.$trendUp ? colors.green : p.$trendDown ? colors.red : colors.gray};
  }
`;

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => { 
    loadProjectsAndSync(); 
  }, []);
  
  const loadProjectsAndSync = async () => {
    // Erst Projekte laden
    const { data } = await getProjects();
    setProjects(data || []);
    setIsLoading(false);
    
    // Dann automatisch Status syncen (im Hintergrund)
    const result = await syncAllProjectStatuses();
    if (result.success && result.results.updated > 0) {
      // Projekte neu laden wenn sich was geändert hat
      const { data: updatedData } = await getProjects();
      setProjects(updatedData || []);
      setSyncResult(result.results);
    }
  };
  
  const handleManualSync = async () => {
    setIsSyncing(true);
    const result = await syncAllProjectStatuses();
    
    if (result.success) {
      if (result.results.updated > 0) {
        toast.success(`${result.results.updated} Projekt(e) aktualisiert`);
        // Projekte neu laden
        const { data } = await getProjects();
        setProjects(data || []);
        setSyncResult(result.results);
      } else {
        toast.success('Alle Status sind aktuell');
      }
    } else {
      toast.error('Fehler beim Sync: ' + result.error);
    }
    
    setIsSyncing(false);
  };

  // Demo-Projekte ausfiltern - nur echte Kundenprojekte anzeigen
  const customerProjects = projects.filter(p => p.status !== 'demo');

  const stats = {
    total: customerProjects.length,
    live: customerProjects.filter(p => p.status === 'live').length,
    inProgress: customerProjects.filter(p => ['inquiry', 'in_progress', 'std'].includes(p.status)).length,
    revenue: customerProjects.reduce((sum, p) => sum + (p.total_price || 0), 0),
    withSTD: customerProjects.filter(p => hasSTD(p)).length,
    withArchive: customerProjects.filter(p => hasArchive(p)).length,
  };

  // Get action items that need attention
  const actionItems = getActionItems(customerProjects);

  const recentProjects = [...customerProjects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  if (isLoading) return <Layout><div style={{ padding: '2rem', color: colors.gray }}>Laden...</div></Layout>;

  return (
    <Layout>
      <Header>
        <div><Title>Dashboard</Title><Subtitle>Willkommen zurück!</Subtitle></div>
        <ButtonGroup>
          <SyncButton onClick={handleManualSync} disabled={isSyncing}>
            {isSyncing ? '⏳ Sync...' : '🔄 Status Sync'}
          </SyncButton>
          <NewButton to="/projects/new">+ Neues Projekt</NewButton>
        </ButtonGroup>
      </Header>
      
      {syncResult && syncResult.updated > 0 && (
        <SyncInfo>
          <span>✅</span>
          <span>
            <strong>{syncResult.updated} Status-Änderung(en):</strong>{' '}
            {syncResult.changes.map((c, i) => (
              <span key={i}>
                {c.names} ({c.from} → {c.to})
                {i < syncResult.changes.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        </SyncInfo>
      )}

      <StatsGrid>
        <StatCard><div className="label">Projekte</div><div className="value">{stats.total}</div></StatCard>
        <StatCard><div className="label">Live</div><div className="value" style={{ color: colors.green }}>{stats.live}</div></StatCard>
        <StatCard><div className="label">In Bearbeitung</div><div className="value" style={{ color: colors.orange }}>{stats.inProgress}</div></StatCard>
        <StatCard><div className="label">Umsatz</div><div className="value" style={{ color: colors.red }}>{formatPrice(stats.revenue)}</div></StatCard>
      </StatsGrid>

      {/* Action Items Section */}
      {actionItems.length > 0 && (
        <ActionsSection>
          <SectionTitle>Aktionen erforderlich ({actionItems.length})</SectionTitle>
          <ActionsList>
            {actionItems.slice(0, 5).map((item, index) => {
              const icons = {
                hosting_expiring: '⏰',
                hosting_warning: '📅',
                needs_review: '👁️',
                std_to_live: '🚀',
                should_archive: '📦',
              };
              return (
                <ActionItem key={index} to={`/projects/${item.project.id}`} $urgency={item.urgency}>
                  <ActionIcon $urgency={item.urgency}>{icons[item.type] || '❗'}</ActionIcon>
                  <ActionContent>
                    <ActionTitle>{item.project.couple_names || 'Unbenannt'}</ActionTitle>
                    <ActionMeta>{item.message} — {item.action}</ActionMeta>
                  </ActionContent>
                  <ActionBadge $urgency={item.urgency}>
                    {item.urgency === 'high' ? 'Dringend' : item.urgency === 'medium' ? 'Bald' : 'Info'}
                  </ActionBadge>
                </ActionItem>
              );
            })}
          </ActionsList>
        </ActionsSection>
      )}

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
            const displayUrl = project.custom_domain || (project.slug ? `siwedding.de/${project.slug}` : null);
            const hosting = calculateHostingDates(project);
            const hostingPercent = hosting.hostingMonths > 0
              ? Math.max(0, 100 - ((hosting.daysRemaining / (hosting.hostingMonths * 30)) * 100))
              : 0;
            const projectHasSTD = hasSTD(project);
            const projectHasArchive = hasArchive(project);

            return (
              <ProjectCard key={project.id} to={`/projects/${project.id}`}>
                <CardHeader><span className="names">{project.couple_names || 'Unbenannt'}</span><StatusDot $color={status?.color} /></CardHeader>
                <CardBody>
                  <CardRow><span className="label">Datum</span><span className="value">{project.wedding_date ? new Date(project.wedding_date).toLocaleDateString('de-DE') : '–'}</span></CardRow>
                  <CardRow><span className="label">Paket</span><span className="value">{pkg?.name || 'Starter'}</span></CardRow>
                  <CardRow><span className="label">Theme</span><span className="value" style={{ textTransform: 'capitalize' }}>{project.theme || 'botanical'}</span></CardRow>
                  {displayUrl && <CardRow><span className="label">URL</span><UrlValue>{displayUrl}</UrlValue></CardRow>}

                  {/* Hosting Progress Bar */}
                  {['live', 'std', 'archive'].includes(project.status) && (
                    <>
                      <HostingBar>
                        <HostingProgress
                          $percent={hostingPercent}
                          $expired={hosting.isExpired}
                          $warning={hosting.isExpiringSoon || hosting.isWarning}
                        />
                      </HostingBar>
                      <HostingInfo $expired={hosting.isExpired} $warning={hosting.isExpiringSoon}>
                        <span className="label">{hosting.hostingMonths} Mon. Hosting</span>
                        <span className="value">
                          {hosting.isExpired
                            ? 'Abgelaufen'
                            : hosting.daysRemaining <= 0
                              ? 'Heute'
                              : `${hosting.daysRemaining} Tage`}
                        </span>
                      </HostingInfo>
                    </>
                  )}

                  {/* Feature Badges */}
                  <FeatureBadges>
                    <FeatureBadge $active={projectHasSTD} $color={colors.purple}>
                      {projectHasSTD ? '✓ STD' : '– STD'}
                    </FeatureBadge>
                    <FeatureBadge $active={projectHasArchive} $color={colors.blue}>
                      {projectHasArchive ? '✓ Archiv' : '– Archiv'}
                    </FeatureBadge>
                  </FeatureBadges>
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
