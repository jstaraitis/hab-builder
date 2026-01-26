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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Build Steps</h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadAsText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              title="Download as text file"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
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
