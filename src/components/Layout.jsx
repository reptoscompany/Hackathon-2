import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Layout as LayoutIcon,
  BarChart3,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Shield,
  FileText,
  Settings,
  Sparkles,
  HelpCircle,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { AlertsPanel } from './AlertsPanel';
import { GuidedDemo } from './GuidedDemo';
import { RoleSwitcher } from './RoleSwitcher';
import { useDemo } from '@/services/DemoContext';
import { useAlerts } from '@/services/AlertContext';

export const POLICE_LOGO_SRC = '/puducherry-police-logo.svg';

/** Puducherry Police crest (vector rendition of the issued patch). */
export function PoliceLogo({ className = 'w-8 h-8' }) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return (
      <div className={`${className} rounded-md bg-[var(--color-navy-900)] flex items-center justify-center flex-shrink-0`}>
        <LayoutIcon className="w-5 h-5 text-[var(--color-gold)]" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={POLICE_LOGO_SRC}
      alt="Puducherry Police crest"
      className={`${className} object-contain flex-shrink-0`}
      onError={() => setMissing(true)}
    />
  );
}

const NAV_ITEMS = [
  { path: '/overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutIcon, description: 'Problem, solution & capabilities' },
  { path: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: BarChart3, description: 'KPIs, trends & alerts' },
  { path: '/crime-map', label: 'Crime Map', shortLabel: 'Map', icon: MapPin, description: 'Interactive map with search' },
  { path: '/hotspots-risk', label: 'Hotspots & Risk', shortLabel: 'Hotspots', icon: AlertTriangle, description: 'Risk zones & predictions' },
  { path: '/trends-time', label: 'Trends & Time', shortLabel: 'Trends', icon: TrendingUp, description: 'Temporal analysis & patrol windows' },
  { path: '/patrol-planner', label: 'Patrol Planner', shortLabel: 'Patrol', icon: Shield, description: 'Units, routes & deployment' },
  { path: '/cases', label: 'Cases', shortLabel: 'Cases', icon: FileText, description: 'Searchable case management' },
  { path: '/ai-assistant', label: 'AI Assistance', shortLabel: 'AI', icon: Sparkles, description: 'Local AI model analysis & prediction' },
  { path: '/safety-score', label: 'Safety Score', shortLabel: 'Safety', icon: Shield, description: 'Environmental safety & vulnerability heatmap' },
  { path: '/system-ethics', label: 'System & Ethics', shortLabel: 'Ethics', icon: Settings, description: 'Architecture & principles' }
];

export function Header({ onMenuClick, onDemoClick }) {
  const { unreadCount, panelOpen, setPanelOpen } = useAlerts();
  const { active: demoActive } = useDemo();

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-[var(--color-surface)] border-b border-[var(--color-border)] z-[var(--z-sticky)] flex items-center justify-between gap-1.5 px-3 lg:px-4">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="sm" onClick={onMenuClick} aria-label="Open navigation menu" className="lg:hidden flex-shrink-0">
          <Menu className="w-5 h-5" aria-hidden="true" />
        </Button>
        <Link to="/overview" className="flex items-center gap-2 flex-shrink-0" aria-label="CRIMEMAP home">
          <PoliceLogo className="w-9 h-9" />
          <span className="hidden sm:block leading-none">
            <span className="block font-bold text-base text-[var(--color-navy-900)] tracking-wide">CRIMEMAP</span>
            <span className="hidden md:block text-[9px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] mt-0.5">MAP • ANALYSE • PLAN • PREVENT</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-0 border-l border-[var(--color-border)] pl-2 ml-1 whitespace-nowrap flex-shrink-0" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.description}
              className={({ isActive }) => `
                px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                ${isActive
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-navy-50)]'
                }
              `}
            >
              {item.shortLabel}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {demoActive && (
          <Badge variant="gold" dot className="hidden md:inline-flex">
            Guided Demo
          </Badge>
        )}
        <Badge variant="gray" size="sm" className="hidden xl:inline-flex">
          Prototype · Simulated Data
        </Badge>
        <div className="no-print hidden sm:block">
          <RoleSwitcher compact />
        </div>
        <div className="relative no-print">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelOpen(!panelOpen)}
            aria-label={unreadCount > 0 ? `${unreadCount} unread alerts — open alerts` : 'Open alerts'}
            aria-expanded={panelOpen}
            leftIcon={<Bell className="w-4 h-4" aria-hidden="true" />}
          >
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[var(--color-crime-assault)] text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {panelOpen && <AlertsPanel onClose={() => setPanelOpen(false)} />}
        </div>
        <Button
          variant={demoActive ? 'secondary' : 'primary'}
          size="sm"
          onClick={onDemoClick}
          leftIcon={demoActive ? <X className="w-4 h-4" aria-hidden="true" /> : <HelpCircle className="w-4 h-4" aria-hidden="true" />}
          className="no-print"
          aria-label={demoActive ? 'Exit guided demo' : 'Start guided demo'}
        >
          <span className="hidden sm:inline">{demoActive ? 'Exit Demo' : 'Guided Demo'}</span>
        </Button>
      </div>
    </header>
  );
}

export function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-fixed)] bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-[var(--z-fixed)] h-full w-72 max-w-[85vw] bg-[var(--color-surface)] border-r border-[var(--color-border)]
          transition-transform duration-300 ease-out lg:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="h-[var(--header-height)] flex items-center justify-between px-4 border-b border-[var(--color-border)]">
            <span className="flex items-center gap-2 min-w-0">
              <PoliceLogo className="w-9 h-9" />
              <span className="leading-none">
                <span className="block font-bold text-base text-[var(--color-navy-900)] tracking-wide">CRIMEMAP</span>
                <span className="block text-[8px] font-medium tracking-[0.18em] text-[var(--color-text-muted)] mt-0.5">MAP • ANALYSE • PLAN • PREVENT</span>
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close navigation">
              <X className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Main menu">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={item.description}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-navy-50)]'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-[var(--color-border)] space-y-3">
            <RoleSwitcher />
            <div className="text-xs text-[var(--color-text-muted)] space-y-0.5">
              <p>CRIMEMAP prototype · simulated data</p>
              <p>Team: [TEAM NAME] · [INSTITUTION]</p>
              <p>Hackathon: [HACKATHON NAME]</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { active: demoActive, startDemo, exitDemo } = useDemo();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col overflow-x-clip">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[var(--z-tooltip)] focus:bg-white focus:px-3 focus:py-2 focus:rounded">
        Skip to main content
      </a>
      {/* Faint Puducherry Police watermark blended behind every page */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none no-print" aria-hidden="true">
        <img
          src={POLICE_LOGO_SRC}
          alt=""
          className="w-[72vmin] max-w-[560px] object-contain opacity-[0.05] select-none"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onDemoClick={demoActive ? exitDemo : startDemo}
      />
      <div className="relative z-10 flex flex-1 pt-[var(--header-height)]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0" id="main-content" role="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <GuidedDemo />
    </div>
  );
}
