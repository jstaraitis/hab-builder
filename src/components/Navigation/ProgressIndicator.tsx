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
    <div className="lg:hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 sticky top-0 z-40 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Step {currentStep} of {totalSteps}
        </span>
        <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full transition-all duration-300 ${
          isComplete 
            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/50 animate-pulse scale-110' 
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
        }`}>
          {Math.round(progress)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ease-out shadow-sm ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-shimmer bg-[length:200%_100%]'
              : 'bg-gradient-to-r from-emerald-500 to-green-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Current step label */}
      <div className={`flex items-center gap-2 mt-2 transition-all duration-300 ${
        isComplete ? 'scale-105' : ''
      }`}>
        {steps[currentStep - 1]?.icon && (() => {
          const Icon = steps[currentStep - 1].icon;
          return <Icon className={`w-5 h-5 transition-all duration-300 ${
            isComplete 
              ? 'text-emerald-600 dark:text-emerald-400 animate-bounce' 
              : 'text-emerald-600 dark:text-emerald-400'
          }`} />;
        })()}
        <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
          {steps[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
}
