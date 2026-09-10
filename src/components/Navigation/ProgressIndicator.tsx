import { LucideIcon } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; icon: LucideIcon }>;
}

export function ProgressIndicator({ currentStep, totalSteps, steps }: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;
  const isComplete = progress === 100;
  
  return (
    <div className="lg:hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border-b border-divider px-3 py-2.5 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-secondary">
          Step {currentStep} of {totalSteps}
        </span>
        <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full transition-all duration-300 ${ isComplete ? 'bg-gradient-to-r from-accent to-green-500 text-white animate-pulse scale-110' : 'bg-accent/15 text-accent' }`}>
          {Math.round(progress)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-card-elevated rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ease-out ${ isComplete ? 'bg-gradient-to-r from-accent via-green-400 to-accent animate-shimmer bg-[length:200%_100%]' : 'bg-gradient-to-r from-accent to-green-500' }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Current step label */}
      <div className={`flex items-center gap-2 mt-2 transition-all duration-300 ${ isComplete ? 'scale-105' : '' }`}>
        {steps[currentStep - 1]?.icon && (() => {
          const Icon = steps[currentStep - 1].icon;
          return <Icon className={`w-5 h-5 transition-all duration-300 ${ isComplete ? 'text-accent animate-bounce' : 'text-accent' }`} />;
        })()}
        <span className="text-base font-semibold text-white">
          {steps[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
}
