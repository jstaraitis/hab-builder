import type { BuildStep } from '../../engine/types';

interface BuildStepsProps {
  steps: BuildStep[];
  showHeader?: boolean;
}

export function BuildSteps({ steps, showHeader = true }: BuildStepsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {showHeader && (
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Build Steps</h3>
      )}
      
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`border-l-4 pl-4 py-3 ${
              step.important
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                {step.order}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">
                  {step.title}
                  {step.important && (
                    <span className="ml-2 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      Important
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
