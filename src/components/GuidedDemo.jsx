import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, X } from 'lucide-react';
import { Button } from './Button';
import { useDemo } from '@/services/DemoContext';

const ROUTES = {
  'crime-map': '/crime-map',
  'hotspots-risk': '/hotspots-risk',
  dashboard: '/dashboard',
  'patrol-planner': '/patrol-planner'
};

export function GuidedDemo() {
  const { active, currentStep, currentStepData, totalSteps, progress, nextStep, prevStep, exitDemo, goToStep } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!active || !currentStepData) return;
    const target = ROUTES[currentStepData.view];
    if (target && location.pathname !== target) navigate(target);
  }, [active, currentStep, currentStepData, location.pathname, navigate]);

  if (!active || !currentStepData) return null;

  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[var(--z-modal)] w-[min(44rem,calc(100vw-2rem))] max-h-[50vh] overflow-auto no-print"
      role="dialog"
      aria-live="polite"
      aria-label={`Guided demo step ${currentStep + 1} of ${totalSteps}`}
    >
      <div className="bg-[var(--color-navy-900)] text-white rounded-xl shadow-xl border border-white/10 overflow-hidden">
        <div className="h-1 bg-white/15" aria-hidden="true">
          <div className="h-full bg-[var(--color-gold)] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                Guided Demo · Step {currentStep + 1} of {totalSteps} · Puducherry market scenario
              </p>
              <h2 className="mt-1 text-base sm:text-lg font-semibold">{currentStepData.title}</h2>
              <p className="mt-1 text-sm text-white/75">{currentStepData.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={exitDemo} aria-label="Exit guided demo" className="text-white/80 hover:text-white hover:bg-white/10 flex-shrink-0">
              <X className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Demo steps">
            {Array.from({ length: totalSteps }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === currentStep}
                aria-label={`Go to step ${i + 1}`}
                onClick={() => goToStep(i)}
                className={`h-2 rounded-full transition-all ${i === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
              className="text-white hover:bg-white/10 disabled:opacity-40"
            >
              Back
            </Button>
            <p className="hidden sm:flex items-center gap-1.5 text-xs text-white/60">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              Map centers on the relevant area automatically
            </p>
            {isLast ? (
              <Button variant="secondary" size="sm" onClick={exitDemo}>
                Finish & explore freely
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={nextStep}
                rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
              >
                Next step
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
