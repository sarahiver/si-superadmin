// src/components/Layout.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../App';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const Container = styled.div`min-height: 100vh; background: ${colors.background};`;
const Nav = styled.nav`background: ${colors.black}; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; @media (max-width: 768px) { padding: 0 1.25rem; }`;
const Logo = styled(Link)`font-family: 'Oswald', sans-serif; font-size: 1.5rem; font-weight: 700; color: ${colors.white}; text-decoration: none; letter-spacing: -0.05em; padding: 1rem 0;`;
const NavLinks = styled.div`display: flex; gap: 0;`;
const NavLink = styled(Link)`font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: ${p => p.$active ? colors.white : colors.gray}; text-decoration: none; padding: 1.25rem 1.5rem; position: relative; transition: color 0.2s ease; &:hover { color: ${colors.white}; } &::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: ${p => p.$active ? colors.red : 'transparent'}; } &:hover::after { background: ${p => p.$active ? colors.red : colors.gray}; }`;
const NavRight = styled.div`display: flex; align-items: center; gap: 1.5rem;`;
const LogoutButton = styled.button`font-family: 'Oswald', sans-serif; font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.gray}; background: transparent; border: 1px solid ${colors.gray}; padding: 0.5rem 1rem; cursor: pointer; transition: all 0.2s ease; &:hover { color: ${colors.white}; border-color: ${colors.white}; }`;
const Main = styled.main`padding: 2rem; max-width: 1400px; margin: 0 auto; @media (max-width: 768px) { padding: 1.25rem; }`;
const MobileMenuButton = styled.button`display: none; background: none; border: none; color: ${colors.white}; font-size: 1.5rem; cursor: pointer; padding: 0.5rem; z-index: 210; position: relative; @media (max-width: 768px) { display: block; }`;
const MobileMenu = styled.div`display: none; @media (max-width: 768px) { display: ${p => p.$open ? 'flex' : 'none'}; flex-direction: column; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: ${colors.black}; padding: 5rem 2rem 2rem; z-index: 200; overflow-y: auto; -webkit-overflow-scrolling: touch; }`;
const DesktopNav = styled.div`display: flex; align-items: center; gap: 2rem; @media (max-width: 768px) { display: none; }`;

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/projects', label: 'Projekte' },
    { path: '/projects/new', label: 'Neu' },
    { path: '/partners', label: 'Kooperationen' },
    { path: '/content', label: 'Content' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/requests', label: 'Anfragen' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <Container>
      <Nav>
        <Logo to="/">S&I.</Logo>
        <DesktopNav>
          <NavLinks>{navItems.map(item => (<NavLink key={item.path} to={item.path} $active={location.pathname === item.path || (item.path === '/partners' && location.pathname.startsWith('/partners')) || (item.path === '/content' && ['/content', '/instagram', '/reels'].includes(location.pathname))}>{item.label}</NavLink>))}</NavLinks>
          <NavRight><LogoutButton onClick={handleLogout}>Logout</LogoutButton></NavRight>
        </DesktopNav>
        <MobileMenuButton onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? '✕' : '☰'}</MobileMenuButton>
      </Nav>
      <MobileMenu $open={mobileOpen}>
        {navItems.map(item => (<NavLink key={item.path} to={item.path} $active={location.pathname === item.path} onClick={() => setMobileOpen(false)} style={{ padding: '1rem 2rem' }}>{item.label}</NavLink>))}
        <LogoutButton onClick={handleLogout} style={{ margin: '1rem 2rem' }}>Logout</LogoutButton>
      </MobileMenu>
      <Main>{children}</Main>
    </Container>
  );
}
