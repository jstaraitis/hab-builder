import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { BuildStep } from '../../engine/types';

interface BuildStepsProps {
  steps: BuildStep[];
  showHeader?: boolean;
  animalName?: string;
}

export function BuildSteps({ steps, showHeader = true, animalName = 'Enclosure' }: BuildStepsProps) {
  const [copied, setCopied] = useState(false);

  const formatStepsAsText = () => {
    const title = `${animalName} Build Steps\n`;
    const separator = '='.repeat(title.length) + '\n\n';
    
    const stepsText = steps.map((step) => {
      const importantTag = step.important ? ' [IMPORTANT]' : '';
      return `Step ${step.order}: ${step.title}${importantTag}\n${step.description}\n`;
    }).join('\n');

    return title + separator + stepsText;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatStepsAsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadAsText = () => {
    const text = formatStepsAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${animalName.toLowerCase().replace(/\s+/g, '-')}-build-steps.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Build Steps</h3>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span className="hidden min-[400px]:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadAsText}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              title="Download as text file"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden min-[400px]:inline">Export</span>
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`border-l-4 pl-2.5 sm:pl-3 lg:pl-4 pr-2 sm:pr-0 py-2.5 sm:py-3 rounded-r-lg ${
              step.important
                ? 'border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                {step.order}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <h4 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                    {step.title}
                  </h4>
                  {step.important && (
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded whitespace-nowrap inline-block w-fit">
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
