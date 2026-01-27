// src/components/Layout.js
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../App';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  width: 240px;
  background: #fff;
  border-right: 1px solid #E5E5E5;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Logo = styled.div`
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.5rem;
  color: #1A1A1A;
  margin-bottom: 0.25rem;
`;

const LogoSubtitle = styled.div`
  font-size: 0.65rem;
  font-weight: 500;
  color: #999;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #E5E5E5;
`;

const NavSection = styled.div`
  margin-bottom: 1.5rem;
`;

const NavLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  color: ${p => p.$active ? '#1A1A1A' : '#666'};
  background: ${p => p.$active ? '#F5F5F5' : 'transparent'};
  font-size: 0.85rem;
  font-weight: ${p => p.$active ? '500' : '400'};
  margin-bottom: 0.25rem;
  transition: all 0.15s ease;
  
  &:hover {
    background: #F5F5F5;
    color: #1A1A1A;
  }
  
  .icon { 
    font-size: 1rem;
    width: 20px;
    text-align: center;
  }
  
  .badge {
    margin-left: auto;
    background: ${p => p.$warning ? '#FEE2E2' : '#F5F5F5'};
    color: ${p => p.$warning ? '#DC2626' : '#666'};
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const UserSection = styled.div`
  padding-top: 1rem;
  border-top: 1px solid #E5E5E5;
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: transparent;
  border: 1px solid #E5E5E5;
  color: #666;
  border-radius: 6px;
  font-size: 0.8rem;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: #1A1A1A;
    color: #1A1A1A;
  }
`;

const Main = styled.main`
  flex: 1;
  margin-left: 240px;
  padding: 2rem 3rem;
  max-width: 1400px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 1rem;
  }
`;

const MobileHeader = styled.div`
  display: none;
  padding: 1rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #E5E5E5;
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

export default function Layout({ children, stats = {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Container>
      <Sidebar>
        <Logo>S & I Wedding</Logo>
        <LogoSubtitle>SuperAdmin</LogoSubtitle>
        
        <NavSection>
          <NavLabel>Übersicht</NavLabel>
          <NavItem to="/" $active={isActive('/')}>
            <span className="icon">◫</span>
            Dashboard
          </NavItem>
        </NavSection>
        
        <NavSection>
          <NavLabel>Verwaltung</NavLabel>
          <NavItem to="/projects" $active={isActive('/projects') && !location.pathname.includes('/new')}>
            <span className="icon">◈</span>
            Projekte
            {stats.totalProjects > 0 && <span className="badge">{stats.totalProjects}</span>}
          </NavItem>
          <NavItem to="/requests" $active={isActive('/requests')} $warning={stats.newRequests > 0}>
            <span className="icon">◉</span>
            Anfragen
            {stats.newRequests > 0 && <span className="badge">{stats.newRequests}</span>}
          </NavItem>
        </NavSection>
        
        <NavSection>
          <NavLabel>Aktionen</NavLabel>
          <NavItem to="/projects/new" $active={location.pathname === '/projects/new'}>
            <span className="icon">+</span>
            Neues Projekt
          </NavItem>
        </NavSection>
        
        <Spacer />
        
        <UserSection>
          <LogoutButton onClick={handleLogout}>
            Abmelden
          </LogoutButton>
        </UserSection>
      </Sidebar>
      
      <Main>
        <MobileHeader>
          <Logo style={{ marginBottom: 0, fontSize: '1.25rem' }}>S & I</Logo>
          <LogoutButton onClick={handleLogout} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            Logout
          </LogoutButton>
        </MobileHeader>
        {children}
      </Main>
    </Container>
  );
}
