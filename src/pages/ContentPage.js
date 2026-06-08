// src/pages/ContentPage.js
// Zusammenführung von Instagram Post Generator und Reels Editor unter einem Menüpunkt
import React, { useState } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import InstagramPage from './InstagramPage';
import ReelsPage from './ReelsPage';
import PinterestPage from './PinterestPage';
import DailyPage from './DailyPage';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <Layout>
      <PageHeader>
        <h1>Content</h1>
        <p>Heute-Workflow, Instagram, Pinterest & Reels — analysieren, generieren, herunterladen</p>
      </PageHeader>

      <TabBar>
        <Tab $active={activeTab === 'daily'} onClick={() => setActiveTab('daily')}>
          <TabIcon>✨</TabIcon>
          Heute
        </Tab>
        <Tab $active={activeTab === 'instagram'} onClick={() => setActiveTab('instagram')}>
          <TabIcon>📸</TabIcon>
          Instagram Posts
        </Tab>
        <Tab $active={activeTab === 'pinterest'} onClick={() => setActiveTab('pinterest')}>
          <TabIcon>📌</TabIcon>
          Pinterest
        </Tab>
        <Tab $active={activeTab === 'reels'} onClick={() => setActiveTab('reels')}>
          <TabIcon>🎬</TabIcon>
          Reels / Videos
        </Tab>
      </TabBar>

      {activeTab === 'daily' && <DailyPage />}
      {activeTab === 'instagram' && <InstagramPage />}
      {activeTab === 'pinterest' && <PinterestPage />}
      {activeTab === 'reels' && <ReelsPage />}
    </Layout>
  );
}

// ============================================
// STYLED COMPONENTS
// ============================================
const PageHeader = styled.div`
  margin-bottom: 1.5rem;
  h1 {
    font-family: 'Oswald', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    text-transform: uppercase;
    color: ${colors.black};
    margin-bottom: 0.25rem;
  }
  p {
    font-family: 'Source Serif 4', serif;
    font-style: italic;
    color: ${colors.gray};
    font-size: 1rem;
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 2px solid ${colors.lightGray};
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: ${p => p.$active ? 600 : 400};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${p => p.$active ? colors.black : colors.gray};
  background: none;
  border: none;
  border-bottom: 2px solid ${p => p.$active ? colors.red : 'transparent'};
  padding: 0.75rem 1.5rem;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: ${colors.black};
  }
`;

const TabIcon = styled.span`
  font-size: 1rem;
`;
