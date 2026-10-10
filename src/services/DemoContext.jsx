import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const DemoContext = createContext(null);

const DEMO_STEPS = [
  {
    id: 1,
    title: 'Incident Cluster at Grand Bazaar',
    description: 'Incidents cluster near the crowded Grand Bazaar market between 6:30 PM and 9:30 PM.',
    view: 'crime-map',
    mapCenter: [11.9348, 79.8302],
    mapZoom: 15,
    filters: { crimeTypes: ['Assault'], dateRange: null, timeRange: ['18:30', '21:30'] },
    highlight: { type: 'radius', center: [11.9348, 79.8302], radiusKm: 0.5 }
  },
  {
    id: 2,
    title: 'Weekend Evening Pattern',
    description: 'Assaults and thefts rise significantly on weekends near bus stops and market areas.',
    view: 'crime-map',
    mapCenter: [11.9348, 79.8302],
    mapZoom: 14,
    filters: { crimeTypes: ['Assault', 'Theft'], dateRange: null, timeRange: ['18:00', '22:00'] },
    highlight: { type: 'heatmap', layer: 'heatmap' }
  },
  {
    id: 3,
    title: 'Red Hotspot Zone Identified',
    description: 'Weighted scoring model identifies a Critical (Red) hotspot at Grand Bazaar due to recurrence, severity, and time concentration.',
    view: 'hotspots-risk',
    mapCenter: [11.9348, 79.8302],
    mapZoom: 14,
    highlight: { type: 'hotspot', ward: 'Ward 1 - Grand Bazaar', level: 'Critical' }
  },
  {
    id: 4,
    title: 'Weekend Evening Alert Triggered',
    description: 'System generates alert for sharp increase in incidents during weekend evenings at market areas.',
    view: 'dashboard',
    highlight: { type: 'alert', alertType: 'sharp_increase' }
  },
  {
    id: 5,
    title: 'Patrol Deployment Recommendation',
    description: 'Recommended deployment of 2 mobile patrol units to Grand Bazaar area for Friday-Saturday 6 PM - 10 PM.',
    view: 'patrol-planner',
    mapCenter: [11.9348, 79.8302],
    mapZoom: 14,
    highlight: { type: 'patrol', units: ['PU001', 'PU003'], area: 'Grand Bazaar' }
  },
  {
    id: 6,
    title: 'Bus Stop Monitoring Suggestion',
    description: 'Puducherry Central Bus Stand and Botanical Garden stops flagged for increased monitoring.',
    view: 'crime-map',
    mapCenter: [11.9398, 79.8312],
    mapZoom: 15,
    filters: { crimeTypes: ['Theft', 'Assault'], dateRange: null },
    highlight: { type: 'landmarks', landmarks: ['LM003', 'LM006'] }
  }
];

export function DemoProvider({ children }) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const startDemo = useCallback(() => {
    setActive(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  const nextStep = useCallback(() => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const exitDemo = useCallback(() => {
    setActive(false);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < DEMO_STEPS.length) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(stepIndex);
    }
  }, [currentStep]);

  const currentStepData = useMemo(() => DEMO_STEPS[currentStep], [currentStep]);
  const progress = useMemo(() => ((currentStep + 1) / DEMO_STEPS.length) * 100, [currentStep]);

  const value = useMemo(() => ({
    active,
    currentStep,
    currentStepData,
    totalSteps: DEMO_STEPS.length,
    progress,
    completedSteps,
    startDemo,
    nextStep,
    prevStep,
    exitDemo,
    goToStep,
    steps: DEMO_STEPS
  }), [active, currentStep, currentStepData, progress, completedSteps]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}