import { Link } from 'react-router-dom';
import { Lock, Sparkles, Calendar, TrendingUp, Package } from 'lucide-react';

export function PremiumPaywall() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-card rounded-2xl border border-divider shadow-xl p-6 sm:p-8">
        {/* Lock Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/15 rounded-xl mb-6">
          <Lock className="w-7 h-7 text-accent" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Upgrade to Premium
        </h2>
        <p className="text-base text-muted mb-6">
          Unlock unlimited animals, enclosures, and care tasks—plus health tracking and smart reminders.
        </p>

        {/* Free Plan Info */}
        <div className="bg-card-elevated border border-divider rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Your free plan includes:</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-3 py-1 bg-card border border-divider rounded-full text-sm text-white">1 enclosure</span>
            <span className="inline-block px-3 py-1 bg-card border border-divider rounded-full text-sm text-white">1 animal</span>
            <span className="inline-block px-3 py-1 bg-card border border-divider rounded-full text-sm text-white">Unlimited care tasks</span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <div className="flex gap-3 p-3 bg-card-elevated border border-divider rounded-xl">
            <Calendar className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <div className="font-semibold text-white text-sm">Expanded Care Calendar</div>
              <div className="text-xs text-muted mt-0.5">Never miss feeding or cleaning</div>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-card-elevated border border-divider rounded-xl">
            <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <div className="font-semibold text-white text-sm">Health Alerts and Task Analytics</div>
              <div className="text-xs text-muted mt-0.5">Smart health monitoring</div>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-card-elevated border border-divider rounded-xl">
            <Package className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <div className="font-semibold text-white text-sm">Inventory Manager</div>
              <div className="text-xs text-muted mt-0.5">Track supplies & reorder alerts</div>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-card-elevated border border-divider rounded-xl">
            <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <div className="font-semibold text-white text-sm">Unlimited Animals</div>
              <div className="text-xs text-muted mt-0.5">Manage your entire collection</div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card-elevated border border-divider rounded-xl p-5 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">
              $2.99<span className="text-lg text-muted font-normal">/month</span>
            </div>
            <div className="text-sm text-accent font-medium">
              or $23.00/year (save 36%)
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 mb-4">
          <Link
            to="/upgrade"
            className="w-full px-4 py-3 bg-accent text-on-accent font-bold rounded-xl hover:bg-accent/90 transition-colors inline-flex items-center justify-center"
          >
            Upgrade Now
          </Link>
          <Link
            to="/"
            className="w-full px-4 py-3 bg-card border border-divider text-white font-semibold rounded-xl hover:border-accent/50 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-muted text-center">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </div>
  );
}
