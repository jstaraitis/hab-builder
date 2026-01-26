import { LucideIcon } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; icon: LucideIcon }>;
}

export function ProgressIndicator({ currentStep, totalSteps, steps }: ProgressIndicatorProps) {
  return (
    <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-base font-semibold text-gray-600 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-base text-gray-500 dark:text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      
      {/* Current step label */}
      <div className="flex items-center gap-2 mt-3">
        {steps[currentStep - 1]?.icon && (() => {
          const Icon = steps[currentStep - 1].icon;
          return <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
        })()}
        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {steps[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
}
