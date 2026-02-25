import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { changelogEntries } from '../../data/changelog';

export function WhatsNewView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">What&apos;s New</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Brief updates on the latest Habitat Builder improvements.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {changelogEntries.map((entry) => (
          <section key={entry.version} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <header className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{entry.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                v{entry.version} • {entry.date}
              </p>
            </header>

            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
              {entry.highlights.map((item) => (
                <li key={`${entry.version}-${item}`} className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
