import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { changelogEntries } from '../../data/changelog';

export function WhatsNewView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-accent to-teal-600 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">What&apos;s New</h1>
            <p className="text-white/80 mt-1">
              Brief updates on the latest Habitat Builder improvements.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {changelogEntries.map((entry) => (
          <section key={entry.version} className="bg-card border border-divider rounded-2xl p-5 transition-colors hover:border-accent/40">
            <header className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{entry.title}</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-emerald-300 whitespace-nowrap">
                v{entry.version}
              </span>
            </header>

            <p className="text-xs text-muted mb-3">{entry.date}</p>

            <ul className="space-y-2 text-sm text-muted">
              {entry.highlights.map((item) => (
                <li key={`${entry.version}-${item}`} className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span className="text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-divider text-white/90 hover:bg-card transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
