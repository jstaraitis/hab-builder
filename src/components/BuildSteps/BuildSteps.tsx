import type { BuildStep } from '../../engine/types';

interface BuildStepsProps {
  steps: BuildStep[];
  showHeader?: boolean;
}

export function BuildSteps({ steps, showHeader = true }: BuildStepsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {showHeader && (
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Build Steps</h3>
      )}
      
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`border-l-4 pl-3 sm:pl-4 py-3 rounded-r-lg ${
              step.important
                ? 'border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                {step.order}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <h4 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                    {step.title}
                  </h4>
                  {step.important && (
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded whitespace-nowrap inline-block w-fit">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
