import { Link } from 'react-router-dom';
import {
  Target,
  MapPin,
  Zap,
  Shield,
  Brain,
  Users,
  FileText,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components';
import { Card, CardContent } from '@/components';
import { PoliceLogo } from '@/components/Layout';
import { useDemo } from '@/services/DemoContext';

export function Overview() {
  const { startDemo } = useDemo();

  const problemPoints = [
    'Crime data scattered across separate systems (FIR registers, CAD, RMS, manual logs)',
    'Analysis relies on tables and manual charts that hide geographic concentration',
    'Hotspots, temporal patterns, and incident linkages go undetected',
    'Resource deployment is reactive, not intelligence-led',
    'No unified view for station-house officers, district officers, and analysts'
  ];

  const solutionPoints = [
    'Single GIS-based platform combining interactive maps, analytics, and ML risk estimation',
    'Interactive crime map with clustering, heatmap, hotspot zones, and geospatial search',
    'Explainable weighted hotspot scoring (incident count, severity, recurrence, proximity, time concentration, density, history)',
    'Predictive risk view with Low/Medium/High per area and time window',
    'Patrol planner with simulated response times and deployment recommendations'
  ];

  const howItWorks = [
    { step: 1, title: 'Ingest & Clean', description: 'Unify FIR, CAD, RMS, and GIS layers into a single PostGIS store with standardized schemas and quality checks.' },
    { step: 2, title: 'Analyze & Visualize', description: 'Interactive maps, clustering, heatmaps, hotspot scoring, temporal trends, and geospatial search (e.g., "cases within 2 km of railway station in last 6 months").' },
    { step: 3, title: 'Decide & Act', description: 'Risk predictions, patrol recommendations, alerting for sharp increases/hotspot thresholds, and exportable reports for leadership.' }
  ];

  const capabilities = [
    { icon: MapPin, title: 'Interactive Crime Map', desc: 'Markers, clustering, heatmap, hotspot zones, police stations, patrol units, landmarks. Filters for date, type, area, status.' },
    { icon: Brain, title: 'Hotspot & Risk Scoring', desc: 'Weighted explainable score (Green/Yellow/Orange/Red). Adjustable factor weights. Predictive risk per area/time window.' },
    { icon: TrendingUp, title: 'Trends & Time Analysis', desc: 'Monthly/yearly comparison, hour-of-day, day-of-week, weekday vs weekend, festival markers, time-by-location heatmap, patrol windows.' },
    { icon: Shield, title: 'Patrol Planner', desc: 'Live unit status, nearby incidents, high-risk regions, simulated response times, recommended deployment, route simulation.' },
    { icon: FileText, title: 'Case Management', desc: 'Searchable table with PDF statuses (New → Closed). Role-based visibility (Analyst sees anonymized data). Simulated status changes.' },
    { icon: Settings, title: 'System & Ethics', desc: 'Architecture diagram, proposed stack (PostGIS, FastAPI/Node, JWT/OAuth2, Docker), encryption, RBAC, audit logs, victim protection, bias testing.' }
  ];

  const ethicalPrinciples = [
    'Encryption at rest and in transit; role-based access control with audit logs',
    'Victim protection: identity masked in UI, permission-gated sensitive fields',
    'Anonymized public data exports; data minimization in all views',
    'Bias testing on historical data; predictions are not proof, never label individuals',
    'No profiling by caste, religion, income, or background',
    'Record correction workflow; designed with Indian data-protection & policing regulations in mind'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero */}
      <section className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] text-sm font-medium">
          <Info className="w-4 h-4" aria-hidden="true" />
          <span>Prototype — Simulated Data</span>
        </div>
        <div className="flex justify-center">
          <PoliceLogo className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-[var(--color-navy-900)] tracking-tight break-words">
          CRIMEMAP
        </h1>
        <p className="text-xs sm:text-sm font-semibold tracking-[0.28em] text-[var(--color-gold-ink)]">
          MAP • ANALYSE • PLAN • PREVENT
        </p>
        <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
          Geospatial Crime Intelligence, Analytics & Decision-Support System
        </p>
        <p className="text-base text-[var(--color-text-muted)] max-w-2xl mx-auto">
          A GIS-based platform that combines interactive maps, analytics, and machine-learning risk estimation to help police see where, when, and what kind of crime is happening — and how to deploy resources.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
          <Button size="lg" onClick={startDemo} leftIcon={<Zap className="w-5 h-5" aria-hidden="true" />}>
            Start Guided Demo
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" size="lg">
              Explore Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">The Problem</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">Why existing approaches fall short</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {problemPoints.map((point, i) => (
            <Card key={i} className={`animate-slide-up h-full ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="flex gap-3 min-w-0">
                <AlertCircle className="w-5 h-5 text-[var(--color-crime-assault)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-[var(--color-text-secondary)] min-w-0 break-words">{point}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">The Solution</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">How CRIMEMAP addresses the gaps</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {solutionPoints.map((point, i) => (
            <Card key={i} className={`animate-slide-up h-full ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="flex gap-3 min-w-0">
                <CheckCircle className="w-5 h-5 text-[var(--color-crime-resolved)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-[var(--color-text-secondary)] min-w-0 break-words">{point}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">How It Works</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">Three steps from data to decision</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3 items-stretch pt-4">
          {howItWorks.map((step) => (
            <Card key={step.step} className="relative h-full overflow-visible">
              <div className="absolute -top-4 left-6 w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold text-lg">
                {step.step}
              </div>
              <CardContent className="pt-8 space-y-3">
                <h3 className="text-lg font-semibold text-[var(--color-navy-900)]">{step.title}</h3>
                <p className="text-[var(--color-text-secondary)]">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Capabilities */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Key Capabilities</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">Core features of the platform</p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
          {capabilities.map((cap, i) => (
            <Card key={i} className="group hover:shadow-md transition-shadow h-full">
              <CardContent className="flex gap-4 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                  <cap.icon className="w-6 h-6 text-[var(--color-accent)] group-hover:text-white" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--color-navy-900)]">{cap.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 break-words">{cap.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Ethical Principles */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-navy-900)]">Ethical Principles</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">Built-in safeguards for responsible use</p>
          </div>
        </div>
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ethicalPrinciples.map((principle, i) => (
              <div key={i} className="flex gap-3 min-w-0">
                <Shield className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-[var(--color-text-secondary)] min-w-0 break-words">{principle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Team & CTA */}
      <section className="border-t border-[var(--color-border)] pt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          <Card>
            <CardContent className="text-center py-4">
              <Users className="w-12 h-12 mx-auto text-[var(--color-accent)] mb-4" aria-hidden="true" />
              <h3 className="font-semibold text-[var(--color-navy-900)]">Team: [TEAM NAME]</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Institution: [INSTITUTION]</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <Settings className="w-12 h-12 mx-auto text-[var(--color-accent)] mb-4" aria-hidden="true" />
              <h3 className="font-semibold text-[var(--color-navy-900)]">Hackathon: [HACKATHON NAME]</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Date: [DATE]</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <Target className="w-12 h-12 mx-auto text-[var(--color-accent)] mb-4" aria-hidden="true" />
              <h3 className="font-semibold text-[var(--color-navy-900)]">Ready to Demo</h3>
              <Button onClick={startDemo} className="mt-4 w-full" leftIcon={<Zap className="w-4 h-4" aria-hidden="true" />}>
                Launch Guided Demo
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="border-t border-[var(--color-border)] pt-6 text-center text-sm text-[var(--color-text-muted)]">
        <p>CRIMEMAP is a hackathon prototype. All data is synthetic. No real persons, cases, or sensitive information.</p>
        <p className="mt-1">Not endorsed by any government agency. Designed with Indian data-protection and policing regulations in mind.</p>
      </footer>
    </div>
  );
}