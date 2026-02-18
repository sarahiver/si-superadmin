// App.js - SI Wedding Themes
// Status-based rendering: draft/in_progress → Coming Soon, live/std/archive → Content
// Triple-click on Coming Soon logo shows admin preview login
// NEW: Password protection support

import React, { Suspense, lazy, useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { checkPasswordRequired } from './lib/supabase';

// Central WeddingPage (handles all themes)
import WeddingPage from './pages/WeddingPage';

// Demo All Page (Component Showcase)
import DemoAllPage from './pages/DemoAllPage';

// Shared Components
import ComingSoon from './components/shared/ComingSoon';
import PasswordGate from './components/shared/PasswordGate';

// Legal Pages
import { Impressum, Datenschutz } from './pages/LegalPages';

// GlobalStyles direkt importieren (nicht lazy) - verhindert Flash of unstyled content
import BotanicalGlobalStyles from './themes/botanical/GlobalStyles';
import LuxeGlobalStyles from './themes/luxe/GlobalStyles';
import NeonGlobalStyles from './themes/neon/GlobalStyles';
import ContemporaryGlobalStyles from './themes/contemporary/GlobalStyles';
import VideoGlobalStyles from './themes/video/GlobalStyles';
import EditorialGlobalStyles from './themes/editorial/GlobalStyles';
import ClassicGlobalStyles from './themes/classic/GlobalStyles';

const globalStylesMap = {
  botanical: BotanicalGlobalStyles,
  luxe: LuxeGlobalStyles,
  neon: NeonGlobalStyles,
  contemporary: ContemporaryGlobalStyles,
  video: VideoGlobalStyles,
  editorial: EditorialGlobalStyles,
  classic: ClassicGlobalStyles,
};

// Lazy load theme-specific pages (aber nicht GlobalStyles)
const themePages = {
  botanical: {
    AdminDashboard: lazy(() => import('./themes/botanical/AdminDashboard')),
    ArchivePage: lazy(() => import('./themes/botanical/ArchivePage')),
    SaveTheDate: lazy(() => import('./themes/botanical/SaveTheDate')),
  },
  luxe: {
    AdminDashboard: lazy(() => import('./themes/luxe/AdminDashboard')),
    ArchivePage: lazy(() => import('./themes/luxe/ArchivePage')),
    SaveTheDate: lazy(() => import('./themes/luxe/SaveTheDate')),
  },
  neon: {
    AdminDashboard: lazy(() => import('./themes/neon/AdminDashboard')),
    ArchivePage: lazy(() => import('./themes/neon/ArchivePage')),
    SaveTheDate: lazy(() => import('./themes/neon/SaveTheDate')),
  },
  contemporary: {
    AdminDashboard: lazy(() => import('./themes/contemporary/AdminDashboard')),
    ArchivePage: lazy(() => import('./themes/contemporary/ArchivePage')),
    SaveTheDate: lazy(() => import('./themes/contemporary/SaveTheDate')),
  },
  video: {
    AdminDashboard: lazy(() => import('./themes/video/AdminDashboard')),
    ArchivePage: lazy(() => import('./themes/video/ArchivePage')),
    SaveTheDate: lazy(() => import('./themes/video/SaveTheDate')),
  },
  editorial: {
    AdminDashboard: lazy(() => import('./themes/editorial/AdminDashboard')),
    ArchivePage: lazy(() => import('./themes/editorial/ArchivePage')),
    SaveTheDate: lazy(() => import('./themes/editorial/SaveTheDate')),
  },
  classic: {
    AdminDashboard: lazy(() => import('./themes/classic/AdminDashboard')),
    ArchivePage: lazy(() => import('./themes/classic/ArchivePage')),
    SaveTheDate: lazy(() => import('./themes/classic/SaveTheDate')),
  },
};

// Error Boundary — verhindert weißen Screen bei Crash
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('Wedding page crash:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '2rem' }}>
          <div>
            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>Etwas ist schiefgelaufen</p>
            <p style={{ color: '#888', marginBottom: '2rem' }}>Bitte lade die Seite neu.</p>
            <button onClick={() => window.location.reload()} style={{ background: '#fff', color: '#0a0a0a', border: 'none', padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Seite neu laden</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading component
const Loading = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    background: '#0a0a0a'
  }}>
    <div style={{ 
      width: 40, 
      height: 40, 
      border: '3px solid #0a0a0a', 
      borderTopColor: '#0a0a0a',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Preview Banner für Admin-Vorschau
function PreviewBanner({ status }) {
  const statusLabels = {
    draft: 'Entwurf',
    in_progress: 'In Bearbeitung',
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#F59E0B',
      color: '#000',
      padding: '0.5rem 1rem',
      fontSize: '0.8rem',
      fontWeight: 600,
      textAlign: 'center',
      zIndex: 9999,
      fontFamily: 'system-ui, sans-serif',
    }}>
      ⚠️ VORSCHAU ({statusLabels[status] || status}) – Nur für dich sichtbar
    </div>
  );
}

// Theme Router - handles status-based rendering AND password protection
function ThemeRouter() {
  const { project, isLoading, error, status, theme, projectId, slug, coupleNames, content } = useWedding();
  const [hasPreviewAccess, setHasPreviewAccess] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordChecked, setPasswordChecked] = useState(false);
  const [hasPasswordAccess, setHasPasswordAccess] = useState(false);
  
  // Check sessionStorage für Admin-Vorschau
  useEffect(() => {
    if (projectId) {
      const access = sessionStorage.getItem(`admin_preview_${projectId}`);
      setHasPreviewAccess(access === 'true');
    }
  }, [projectId]);
  
  // Check ob Passwortschutz aktiv ist
  useEffect(() => {
    async function checkPassword() {
      if (!slug) return;
      
      // Erst prüfen ob bereits Zugang gewährt wurde (Session)
      const storedAccess = sessionStorage.getItem(`pw_access_${slug}`);
      if (storedAccess === 'granted') {
        setHasPasswordAccess(true);
        setPasswordChecked(true);
        return;
      }
      
      // Passwortschutz-Status von Supabase abrufen
      const { required } = await checkPasswordRequired(slug);
      setPasswordRequired(required);
      setPasswordChecked(true);
    }
    
    checkPassword();
  }, [slug]);
  
  // Dynamische Meta-Tags für Social Sharing (WhatsApp, Instagram, etc.)
  useEffect(() => {
    if (!project) return;
    const names = coupleNames || 'S&I Wedding';
    document.title = names;

    const heroImage = content?.hero?.background_image || '';

    const updates = {
      'og:title': names,
      'og:description': `Hochzeit von ${names}`,
      'og:image': heroImage,
    };

    Object.entries(updates).forEach(([property, content]) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Description meta
    let desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', `Hochzeit von ${names}`);

    // Dynamisches Favicon: Emoji aus DB bevorzugen, sonst Initialen
    const faviconEmoji = project.favicon_emoji;
    const faviconContent = faviconEmoji || (() => {
      const parts = names.split(/\s*[&+und]\s*/i).map(s => s.trim());
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return names.slice(0, 2).toUpperCase();
    })();

    const isEmoji = faviconEmoji && faviconEmoji.length > 0;
    const svg = isEmoji
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="48">${faviconContent}</text>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="12" fill="#0a0a0a"/>
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="26" fill="#ffffff" letter-spacing="-1">${faviconContent}</text>
        </svg>`;

    const faviconUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('type', 'image/svg+xml');
    favicon.setAttribute('href', faviconUrl);

    return () => { };
  }, [project, coupleNames]);

  // WICHTIG: Warte bis project UND theme geladen sind
  // passwordChecked muss NICHT abgewartet werden wenn kein Passwort benötigt wird
  if (isLoading || !project) return <Loading />;
  
  // Nur blockieren wenn passwordChecked noch läuft UND ein Passwort tatsächlich benötigt wird
  if (!passwordChecked && passwordRequired) return <Loading />;
  
  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#fff'
      }}>
        <div>
          <h1 style={{ marginBottom: '1rem' }}>Projekt nicht gefunden</h1>
          <p style={{ color: '#666' }}>{error}</p>
        </div>
      </div>
    );
  }

  // Theme aus project direkt verwenden (nicht aus hook mit fallback)
  const themeName = project.theme || 'botanical';
  const pages = themePages[themeName] || themePages.botanical;
  const GlobalStyles = globalStylesMap[themeName] || globalStylesMap.botanical;
  
  const { 
    AdminDashboard, 
    ArchivePage, 
    SaveTheDate 
  } = pages;

  // Status-basierte Sichtbarkeit
  // Öffentlich: live, std, archive, demo (für Marketing-Website)
  // Nicht-öffentlich: draft, in_progress → Coming Soon (außer mit Admin-Vorschau)
  const publicStatuses = ['live', 'std', 'archive', 'archiv', 'save-the-date', 'demo'];
  const isPublic = publicStatuses.includes(status);

  // Render basierend auf Status UND Passwortschutz
  const renderMain = () => {
    // Nicht öffentlich und kein Admin-Zugang → Coming Soon
    if (!isPublic && !hasPreviewAccess) {
      return (
        <ComingSoon 
          onAdminAccess={() => {
            setHasPreviewAccess(true);
          }} 
        />
      );
    }
    
    // Passwortschutz: Wenn aktiv und noch kein Zugang
    if (passwordRequired && !hasPasswordAccess && !hasPreviewAccess) {
      // Noch nicht gecheckt → nichts rendern (kurze Pause)
      if (!passwordChecked) return null;
      return (
        <PasswordGate
          slug={slug}
          theme={themeName}
          coupleNames={coupleNames}
          onSuccess={() => setHasPasswordAccess(true)}
        />
      );
    }
    
    // Render je nach Status
    switch (status) {
      case 'std':
      case 'save-the-date':
        return <SaveTheDate />;
      case 'archiv':
      case 'archive':
        return <ArchivePage />;
      case 'draft':
      case 'in_progress':
        // Admin hat Zugang - zeige Vorschau mit Banner
        if (hasPreviewAccess) {
          return (
            <>
              <PreviewBanner status={status} />
              <div style={{ paddingTop: '36px' }}>
                <WeddingPage />
              </div>
            </>
          );
        }
        return <ComingSoon onAdminAccess={() => setHasPreviewAccess(true)} />;
      case 'live':
      default:
        return <WeddingPage />;
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <GlobalStyles />
      <Routes>
        <Route path="/" element={renderMain()} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/save-the-date" element={<SaveTheDate />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// Project wrapper - sets noindex for all customer wedding pages
function ProjectWrapper() {
  const { slug } = useParams();

  // Prevent Google from indexing individual wedding pages
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      // Cleanup on unmount
      if (meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <WeddingProvider slug={slug}>
        <ThemeRouter />
      </WeddingProvider>
    </ErrorBoundary>
  );
}

// Platzhalterseite für siwedding.de Root → Fullscreen Video + Link zu sarahiver.com
function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        .si-landing { position: fixed; inset: 0; overflow: hidden; background: #0a0a0a; display: flex; align-items: center; justify-content: center; }
        .si-landing-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) brightness(0.4); }
        .si-landing-content { position: relative; z-index: 10; text-align: center; padding: 2rem; }
        .si-landing-logo { font-family: 'Roboto', system-ui, sans-serif; font-size: clamp(3rem, 10vw, 5rem); font-weight: 700; color: #fff; letter-spacing: -0.06em; margin: 0 0 0.5rem 0; opacity: 0; animation: siFadeUp 1s ease forwards; animation-delay: 0.5s; }
        .si-landing-sub { font-family: 'Roboto', system-ui, sans-serif; font-size: clamp(0.7rem, 2vw, 0.85rem); color: rgba(255,255,255,0.5); letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 3rem 0; opacity: 0; animation: siFadeUp 1s ease forwards; animation-delay: 0.8s; }
        .si-landing-btn { display: inline-block; padding: 1rem 3rem; border: 1px solid rgba(255,255,255,0.25); color: #fff; text-decoration: none; font-family: 'Roboto', system-ui, sans-serif; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; transition: all 0.4s ease; opacity: 0; animation: siFadeUp 1s ease forwards; animation-delay: 1.1s; backdrop-filter: blur(4px); background: rgba(255,255,255,0.03); }
        .si-landing-btn:hover { background: #fff; color: #0a0a0a; border-color: #fff; }
        @keyframes siFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="si-landing">
        <video className="si-landing-video" autoPlay muted loop playsInline>
          <source src="https://res.cloudinary.com/si-weddings/video/upload/v1770287435/212698_small_cibloj.mp4" type="video/mp4" />
        </video>
        <div className="si-landing-content">
          <div className="si-landing-logo">S&I.</div>
          <p className="si-landing-sub">Premium Hochzeits-Websites</p>
          <a href="https://sarahiver.com" className="si-landing-btn">Mehr erfahren →</a>
        </div>
      </div>
    </>
  );
}

// Main App
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/demoall" element={<DemoAllPage />} />
        <Route path="/:slug/*" element={<ProjectWrapper />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
