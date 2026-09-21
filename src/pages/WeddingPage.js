// src/pages/WeddingPage.js
// ZENTRALE WeddingPage für alle Themes
// Unterstützt component_order aus Supabase

import { lazy, Suspense } from "react"
import styled from "styled-components"
import { useWedding } from "../context/WeddingContext"

// ============================================
// THEME-SPECIFIC IMPORTS
// ============================================

// GlobalStyles per Theme
import BotanicalGlobalStyles from "../themes/botanical/GlobalStyles"
import ContemporaryGlobalStyles from "../themes/contemporary/GlobalStyles"
import EditorialGlobalStyles from "../themes/editorial/GlobalStyles"
import LuxeGlobalStyles from "../themes/luxe/GlobalStyles"
import NeonGlobalStyles from "../themes/neon/GlobalStyles"
import VideoGlobalStyles from "../themes/video/GlobalStyles"
import ClassicGlobalStyles from "../themes/classic/GlobalStyles"
import SummerGlobalStyles from "../themes/summer/GlobalStyles"


// Special Components
import BotanicalBackground from "../themes/botanical/BotanicalBackground"

// Video Theme special import
import VideoHorizontalScroll from "../themes/video/HorizontalScroll"

// Parallax Theme special import
import ParallaxWeddingApp from "../themes/parallax/WeddingApp"

// ============================================
// VARIANT IMPORTS
// ============================================
import SplitScreenHero from "../variants/hero/SplitScreenHero"

// Variants Registry - hier neue Varianten registrieren
const variants = {
  hero: {
    'split': SplitScreenHero,
  },
  // countdown: { 'round-clock': RoundClockCountdown, ... }
  // gallery: { 'masonry': MasonryGallery, ... }
}

// ============================================
// COMPONENT IMPORTS PER THEME
// ============================================

const themeComponents = {
  botanical: {
    Navigation: lazy(() => import("../themes/botanical/Navigation")),
    Hero: lazy(() => import("../themes/botanical/Hero")),
    Countdown: lazy(() => import("../themes/botanical/Countdown")),
    LoveStory: lazy(() => import("../themes/botanical/LoveStory")),
    Timeline: lazy(() => import("../themes/botanical/Timeline")),
    Locations: lazy(() => import("../themes/botanical/Locations")),
    Directions: lazy(() => import("../themes/botanical/Directions")),
    Accommodations: lazy(() => import("../themes/botanical/Accommodations")),
    RSVP: lazy(() => import("../themes/botanical/RSVP")),
    Gallery: lazy(() => import("../themes/botanical/Gallery")),
    Guestbook: lazy(() => import("../themes/botanical/Guestbook")),
    MusicWishes: lazy(() => import("../themes/botanical/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/botanical/PhotoUpload")),
    Gifts: lazy(() => import("../themes/botanical/Gifts")),
    Dresscode: lazy(() => import("../themes/botanical/Dresscode")),
    FAQ: lazy(() => import("../themes/botanical/FAQ")),
    WeddingABC: lazy(() => import("../themes/botanical/WeddingABC")),
    ContactWitnesses: lazy(
      () => import("../themes/botanical/ContactWitnesses"),
    ),
    Footer: lazy(() => import("../themes/botanical/Footer")),
  },
  editorial: {
    Navigation: lazy(() => import("../themes/editorial/Navigation")),
    Hero: lazy(() => import("../themes/editorial/Hero")),
    Countdown: lazy(() => import("../themes/editorial/Countdown")),
    LoveStory: lazy(() => import("../themes/editorial/LoveStory")),
    Timeline: lazy(() => import("../themes/editorial/Timeline")),
    Locations: lazy(() => import("../themes/editorial/Locations")),
    Directions: lazy(() => import("../themes/editorial/Directions")),
    Accommodations: lazy(() => import("../themes/editorial/Accommodations")),
    RSVP: lazy(() => import("../themes/editorial/RSVP")),
    Gallery: lazy(() => import("../themes/editorial/Gallery")),
    Guestbook: lazy(() => import("../themes/editorial/Guestbook")),
    MusicWishes: lazy(() => import("../themes/editorial/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/editorial/PhotoUpload")),
    Gifts: lazy(() => import("../themes/editorial/Gifts")),
    Dresscode: lazy(() => import("../themes/editorial/Dresscode")),
    FAQ: lazy(() => import("../themes/editorial/FAQ")),
    WeddingABC: lazy(() => import("../themes/editorial/WeddingABC")),
    ContactWitnesses: lazy(
      () => import("../themes/editorial/ContactWitnesses"),
    ),
    Footer: lazy(() => import("../themes/editorial/Footer")),
  },
  contemporary: {
    Navigation: lazy(() => import("../themes/contemporary/Navigation")),
    Hero: lazy(() => import("../themes/contemporary/Hero")),
    Countdown: lazy(() => import("../themes/contemporary/Countdown")),
    LoveStory: lazy(() => import("../themes/contemporary/LoveStory")),
    Timeline: lazy(() => import("../themes/contemporary/Timeline")),
    Locations: lazy(() => import("../themes/contemporary/Locations")),
    Directions: lazy(() => import("../themes/contemporary/Directions")),
    Accommodations: lazy(() => import("../themes/contemporary/Accommodations")),
    RSVP: lazy(() => import("../themes/contemporary/RSVP")),
    Gallery: lazy(() => import("../themes/contemporary/Gallery")),
    Guestbook: lazy(() => import("../themes/contemporary/Guestbook")),
    MusicWishes: lazy(() => import("../themes/contemporary/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/contemporary/PhotoUpload")),
    Gifts: lazy(() => import("../themes/contemporary/Gifts")),
    Dresscode: lazy(() => import("../themes/contemporary/Dresscode")),
    FAQ: lazy(() => import("../themes/contemporary/FAQ")),
    WeddingABC: lazy(() => import("../themes/contemporary/WeddingABC")),
    ContactWitnesses: lazy(
      () => import("../themes/contemporary/ContactWitnesses"),
    ),
    Footer: lazy(() => import("../themes/contemporary/Footer")),
  },
  luxe: {
    Navigation: lazy(() => import("../themes/luxe/Navigation")),
    Hero: lazy(() => import("../themes/luxe/Hero")),
    Countdown: lazy(() => import("../themes/luxe/Countdown")),
    LoveStory: lazy(() => import("../themes/luxe/LoveStory")),
    Timeline: lazy(() => import("../themes/luxe/Timeline")),
    Locations: lazy(() => import("../themes/luxe/Locations")),
    Directions: lazy(() => import("../themes/luxe/Directions")),
    Accommodations: lazy(() => import("../themes/luxe/Accommodations")),
    RSVP: lazy(() => import("../themes/luxe/RSVP")),
    Gallery: lazy(() => import("../themes/luxe/Gallery")),
    Guestbook: lazy(() => import("../themes/luxe/Guestbook")),
    MusicWishes: lazy(() => import("../themes/luxe/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/luxe/PhotoUpload")),
    Gifts: lazy(() => import("../themes/luxe/Gifts")),
    Dresscode: lazy(() => import("../themes/luxe/Dresscode")),
    FAQ: lazy(() => import("../themes/luxe/FAQ")),
    WeddingABC: lazy(() => import("../themes/luxe/WeddingABC")),
    ContactWitnesses: lazy(() => import("../themes/luxe/ContactWitnesses")),
    Footer: lazy(() => import("../themes/luxe/Footer")),
  },
  neon: {
    Navigation: lazy(() => import("../themes/neon/Navigation")),
    Hero: lazy(() => import("../themes/neon/Hero")),
    Countdown: lazy(() => import("../themes/neon/Countdown")),
    LoveStory: lazy(() => import("../themes/neon/LoveStory")),
    Timeline: lazy(() => import("../themes/neon/Timeline")),
    Locations: lazy(() => import("../themes/neon/Locations")),
    Directions: lazy(() => import("../themes/neon/Directions")),
    Accommodations: lazy(() => import("../themes/neon/Accommodations")),
    RSVP: lazy(() => import("../themes/neon/RSVP")),
    Gallery: lazy(() => import("../themes/neon/Gallery")),
    Guestbook: lazy(() => import("../themes/neon/Guestbook")),
    MusicWishes: lazy(() => import("../themes/neon/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/neon/PhotoUpload")),
    Gifts: lazy(() => import("../themes/neon/Gifts")),
    Dresscode: lazy(() => import("../themes/neon/Dresscode")),
    FAQ: lazy(() => import("../themes/neon/FAQ")),
    WeddingABC: lazy(() => import("../themes/neon/WeddingABC")),
    ContactWitnesses: lazy(() => import("../themes/neon/ContactWitnesses")),
    Footer: lazy(() => import("../themes/neon/Footer")),
  },
  video: {
    Navigation: lazy(() => import("../themes/video/Navigation")),
    Hero: lazy(() => import("../themes/video/Hero")),
    Countdown: lazy(() => import("../themes/video/Countdown")),
    LoveStory: lazy(() => import("../themes/video/LoveStory")),
    Timeline: lazy(() => import("../themes/video/Timeline")),
    Locations: lazy(() => import("../themes/video/Locations")),
    Directions: lazy(() => import("../themes/video/Directions")),
    Accommodations: lazy(() => import("../themes/video/Accommodations")),
    RSVP: lazy(() => import("../themes/video/RSVP")),
    Gallery: lazy(() => import("../themes/video/Gallery")),
    Guestbook: lazy(() => import("../themes/video/Guestbook")),
    MusicWishes: lazy(() => import("../themes/video/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/video/PhotoUpload")),
    Gifts: lazy(() => import("../themes/video/Gifts")),
    Dresscode: lazy(() => import("../themes/video/Dresscode")),
    FAQ: lazy(() => import("../themes/video/FAQ")),
    WeddingABC: lazy(() => import("../themes/video/WeddingABC")),
    ContactWitnesses: lazy(() => import("../themes/video/ContactWitnesses")),
    Footer: lazy(() => import("../themes/video/Footer")),
  },
  classic: {
    Navigation: lazy(() => import("../themes/classic/Navigation")),
    Hero: lazy(() => import("../themes/classic/Hero")),
    Countdown: lazy(() => import("../themes/classic/Countdown")),
    LoveStory: lazy(() => import("../themes/classic/LoveStory")),
    Timeline: lazy(() => import("../themes/classic/Timeline")),
    Locations: lazy(() => import("../themes/classic/Locations")),
    Directions: lazy(() => import("../themes/classic/Directions")),
    Accommodations: lazy(() => import("../themes/classic/Accommodations")),
    RSVP: lazy(() => import("../themes/classic/RSVP")),
    Gallery: lazy(() => import("../themes/classic/Gallery")),
    Guestbook: lazy(() => import("../themes/classic/Guestbook")),
    MusicWishes: lazy(() => import("../themes/classic/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/classic/PhotoUpload")),
    Gifts: lazy(() => import("../themes/classic/Gifts")),
    Dresscode: lazy(() => import("../themes/classic/Dresscode")),
    FAQ: lazy(() => import("../themes/classic/FAQ")),
    WeddingABC: lazy(() => import("../themes/classic/WeddingABC")),
    ContactWitnesses: lazy(() => import("../themes/classic/ContactWitnesses")),
    Footer: lazy(() => import("../themes/classic/Footer")),
  },
  summer: {
    Navigation: lazy(() => import("../themes/summer/Navigation")),
    Hero: lazy(() => import("../themes/summer/Hero")),
    Countdown: lazy(() => import("../themes/classic/Countdown")),
    LoveStory: lazy(() => import("../themes/summer/LoveStory")),
    Timeline: lazy(() => import("../themes/summer/Timeline")),
    Locations: lazy(() => import("../themes/summer/Locations")),
    Directions: lazy(() => import("../themes/classic/Directions")),
    Accommodations: lazy(() => import("../themes/classic/Accommodations")),
    RSVP: lazy(() => import("../themes/summer/RSVP")),
    Gallery: lazy(() => import("../themes/summer/Gallery")),
    Guestbook: lazy(() => import("../themes/classic/Guestbook")),
    MusicWishes: lazy(() => import("../themes/classic/MusicWishes")),
    PhotoUpload: lazy(() => import("../themes/summer/PhotoUpload")),
    Gifts: lazy(() => import("../themes/classic/Gifts")),
    Dresscode: lazy(() => import("../themes/summer/Dresscode")),
    FAQ: lazy(() => import("../themes/classic/FAQ")),
    WeddingABC: lazy(() => import("../themes/classic/WeddingABC")),
    ContactWitnesses: lazy(() => import("../themes/classic/ContactWitnesses")),
    Footer: lazy(() => import("../themes/summer/Footer")),
  },
}

// ============================================
// THEME CONFIGURATIONS
// ============================================

const themeConfig = {
  botanical: {
    GlobalStyles: BotanicalGlobalStyles,
    background: "#0a0a0a",
    hasSpecialBackground: true,
  },
  editorial: {
    GlobalStyles: EditorialGlobalStyles,
    background: "#ffffff",
    hasSpecialBackground: false,
  },
  contemporary: {
    GlobalStyles: ContemporaryGlobalStyles,
    background: "#faf8f5",
    hasSpecialBackground: false,
  },
  luxe: {
    GlobalStyles: LuxeGlobalStyles,
    background: "#0a0a0f",
    hasSpecialBackground: false,
  },
  neon: {
    GlobalStyles: NeonGlobalStyles,
    background: "#0a0a0f",
    hasSpecialBackground: false,
  },
  video: {
    GlobalStyles: VideoGlobalStyles,
    background: "#0a0a0a",
    hasSpecialBackground: false,
    isHorizontalScroll: true,
  },
  classic: {
    GlobalStyles: ClassicGlobalStyles,
    background: "#FFFFFF",
    hasSpecialBackground: false,
  },
  summer: {
    GlobalStyles: SummerGlobalStyles,
    background: "#FAF6F0",
    hasSpecialBackground: false,
  },
}

// ============================================
// DEFAULT COMPONENT ORDER
// ============================================

const DEFAULT_ORDER = [
  "hero",
  "countdown",
  "lovestory",
  "timeline",
  "locations",
  "directions",
  "accommodations",
  "dresscode",
  "rsvp",
  "gallery",
  "photoupload",
  "guestbook",
  "musicwishes",
  "gifts",
  "witnesses",
  "faq",
  "weddingabc",
]

// ============================================
// PAGE WRAPPER
// ============================================

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${(props) => props.$background || "#0a0a0a"};
`

// ============================================
// COMPONENT RENDERER (mit Varianten-Support)
// ============================================

function ComponentRenderer({ componentId, components, isComponentActive, componentConfig }) {
  const componentMap = {
    hero: { Component: components.Hero, alwaysShow: true },
    countdown: { Component: components.Countdown },
    lovestory: { Component: components.LoveStory },
    timeline: { Component: components.Timeline },
    locations: { Component: components.Locations },
    directions: { Component: components.Directions },
    accommodations: { Component: components.Accommodations },
    dresscode: { Component: components.Dresscode },
    rsvp: { Component: components.RSVP },
    gallery: { Component: components.Gallery },
    photoupload: { Component: components.PhotoUpload },
    guestbook: { Component: components.Guestbook },
    musicwishes: { Component: components.MusicWishes },
    gifts: { Component: components.Gifts },
    witnesses: { Component: components.ContactWitnesses },
    faq: { Component: components.FAQ },
    weddingabc: { Component: components.WeddingABC },
  }

  const config = componentMap[componentId]
  if (!config || !config.Component) return null

  const { alwaysShow } = config
  let Component = config.Component

  // Check for variant override
  const variantConfig = componentConfig?.[componentId]
  if (variantConfig?.variant && variantConfig.variant !== 'default') {
    const componentVariants = variants[componentId]
    if (componentVariants && componentVariants[variantConfig.variant]) {
      Component = componentVariants[variantConfig.variant]
    }
  }

  // Hero always shows, others check isComponentActive
  if (!alwaysShow && !isComponentActive(componentId)) return null

  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  )
}

// ============================================
// VIDEO THEME (Special horizontal scroll)
// ============================================

function VideoWeddingPage() {
  const { project, content, isLoading, isComponentActive } = useWedding()
  const components = themeComponents.video

  if (!project || isLoading) {
    return <div style={{ minHeight: '100vh', background: '#0a0a0a' }} />
  }

  const heroContent = content?.hero || {}
  const background = heroContent.background_media || null
  const backgroundMobile = heroContent.background_media_mobile || null

  // Component map: componentId → { Component, sectionId, label }
  const videoComponentMap = {
    hero: { Component: components.Hero, sectionId: "hero", label: "Start", alwaysShow: true },
    countdown: { Component: components.Countdown, sectionId: "countdown", label: "Countdown" },
    lovestory: { Component: components.LoveStory, sectionId: "story", label: "Geschichte" },
    timeline: { Component: components.Timeline, sectionId: "timeline", label: "Ablauf" },
    locations: { Component: components.Locations, sectionId: "locations", label: "Location" },
    directions: { Component: components.Directions, sectionId: "directions", label: "Anfahrt" },
    accommodations: { Component: components.Accommodations, sectionId: "accommodations", label: "Hotels" },
    dresscode: { Component: components.Dresscode, sectionId: "dresscode", label: "Dresscode" },
    rsvp: { Component: components.RSVP, sectionId: "rsvp", label: "RSVP" },
    gallery: { Component: components.Gallery, sectionId: "gallery", label: "Galerie" },
    photoupload: { Component: components.PhotoUpload, sectionId: "photos", label: "Fotos" },
    guestbook: { Component: components.Guestbook, sectionId: "guestbook", label: "Gästebuch" },
    musicwishes: { Component: components.MusicWishes, sectionId: "music", label: "Musik" },
    gifts: { Component: components.Gifts, sectionId: "gifts", label: "Geschenke" },
    witnesses: { Component: components.ContactWitnesses, sectionId: "witnesses", label: "Trauzeug:innen" },
    faq: { Component: components.FAQ, sectionId: "faq", label: "FAQ" },
    weddingabc: { Component: components.WeddingABC, sectionId: "abc", label: "ABC" },
  }

  // Build dynamic order from Supabase, filtered by active state
  const componentOrder = project?.component_order || DEFAULT_ORDER
  const activeEntries = componentOrder
    .filter(id => {
      const entry = videoComponentMap[id]
      if (!entry) return false
      return entry.alwaysShow || isComponentActive(id)
    })
    .map(id => videoComponentMap[id])

  // Always add footer at the end
  const sections = [
    ...activeEntries.map(e => ({ id: e.sectionId, label: e.label })),
    { id: "footer", label: "Ende" },
  ]

  return (
    <>
      <VideoGlobalStyles />
      <Suspense fallback={null}>
        <VideoHorizontalScroll
          sections={sections}
          background={background}
          backgroundMobile={backgroundMobile}
        >
          {activeEntries.map(entry => (
            <entry.Component key={entry.sectionId} />
          ))}
          <components.Footer />
        </VideoHorizontalScroll>
      </Suspense>
    </>
  )
}

// ============================================
// STANDARD WEDDING PAGE (All other themes)
// ============================================

function StandardWeddingPage() {
  const { project, isComponentActive, isLoading } = useWedding()

  const themeName = project?.theme || "botanical"
  const config = themeConfig[themeName] || themeConfig.botanical
  const components = themeComponents[themeName] || themeComponents.botanical
  const { GlobalStyles, background, hasSpecialBackground } = config
  const componentOrder = project?.component_order || DEFAULT_ORDER
  const componentConfig = project?.component_config || {}

  if (!project || isLoading) {
    return <div style={{ minHeight: '100vh', background: config.background || '#fff' }} />
  }

  return (
    <>
      <GlobalStyles />

      {hasSpecialBackground && themeName === "botanical" && (
        <BotanicalBackground />
      )}

      <PageWrapper $background={background}>
        <Suspense fallback={null}>
          <components.Navigation />
        </Suspense>

        <main
          style={
            hasSpecialBackground
              ? { position: "relative", zIndex: 10 }
              : undefined
          }
        >
          {componentOrder.map((componentId) => (
            <ComponentRenderer
              key={componentId}
              componentId={componentId}
              components={components}
              isComponentActive={isComponentActive}
              componentConfig={componentConfig}
            />
          ))}
        </main>

        <Suspense fallback={null}>
          <components.Footer />
        </Suspense>
      </PageWrapper>
    </>
  )
}

// ============================================
// MAIN EXPORT
// ============================================

function WeddingPage() {
  const { theme } = useWedding()

  // Video theme has completely different layout
  if (theme === "video") {
    return <VideoWeddingPage />
  }

  // Parallax theme is a full R3F experience
  if (theme === "parallax") {
    return <ParallaxWeddingApp />
  }

  return <StandardWeddingPage />
}

export default WeddingPage
