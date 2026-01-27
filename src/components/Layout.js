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
  width: 260px;
  background: #111;
  border-right: 1px solid #222;
  padding: 1.5rem;
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
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
  
  span { 
    color: #666; 
    font-weight: 400;
    font-size: 0.9rem;
  }
`;

const LogoSubtitle = styled.div`
  font-size: 0.7rem;
  color: #666;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #222;
`;

const NavSection = styled.div`
  margin-bottom: 1.5rem;
`;

const NavLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  color: ${p => p.$active ? '#fff' : '#888'};
  background: ${p => p.$active ? '#1a1a1a' : 'transparent'};
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    background: #1a1a1a;
    color: #fff;
  }
  
  .icon { font-size: 1.1rem; }
  .badge {
    margin-left: auto;
    background: ${p => p.$warning ? '#ff4444' : '#333'};
    color: ${p => p.$warning ? '#fff' : '#888'};
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
  border-top: 1px solid #222;
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid #333;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: #ff4444;
    color: #ff4444;
  }
`;

const Main = styled.main`
  flex: 1;
  margin-left: 260px;
  padding: 2rem;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 1rem;
  }
`;

const MobileHeader = styled.div`
  display: none;
  padding: 1rem;
  background: #111;
  border-bottom: 1px solid #222;
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
        <Logo>S&I <span>Wedding</span></Logo>
        <LogoSubtitle>SuperAdmin</LogoSubtitle>
        
        <NavSection>
          <NavLabel>Übersicht</NavLabel>
          <NavItem to="/" $active={isActive('/')}>
            <span className="icon">📊</span>
            Dashboard
          </NavItem>
        </NavSection>
        
        <NavSection>
          <NavLabel>Verwaltung</NavLabel>
          <NavItem to="/projects" $active={isActive('/projects')}>
            <span className="icon">💒</span>
            Projekte
            {stats.totalProjects > 0 && <span className="badge">{stats.totalProjects}</span>}
          </NavItem>
          <NavItem to="/requests" $active={isActive('/requests')} $warning={stats.newRequests > 0}>
            <span className="icon">📨</span>
            Anfragen
            {stats.newRequests > 0 && <span className="badge">{stats.newRequests}</span>}
          </NavItem>
        </NavSection>
        
        <NavSection>
          <NavLabel>Aktionen</NavLabel>
          <NavItem to="/projects/new" $active={isActive('/projects/new')}>
            <span className="icon">➕</span>
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
          <Logo style={{ marginBottom: 0 }}>S&I</Logo>
          <LogoutButton onClick={handleLogout} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            Logout
          </LogoutButton>
        </MobileHeader>
        {children}
      </Main>
    </Container>
  );
}
