import { Link } from 'react-router-dom';
import { Lock, Sparkles, Calendar, TrendingUp, Package } from 'lucide-react';

export function PremiumPaywall() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
        {/* Lock Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
          <Lock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Premium Feature
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Upgrade to Premium to unlock care tracking, health monitoring, and smart reminders
        </p>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Care Calendar</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Never miss feeding or cleaning</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Health Analytics</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Track weight and feeding trends</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Inventory Manager</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Track supplies & reorder alerts</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Unlimited Animals</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Manage your entire collection</div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            $2.99<span className="text-xl text-gray-500 dark:text-gray-400 font-normal">/month</span>
          </div>
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            or $23.00/year (save 36%)
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/upgrade"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Upgrade Now
          </Link>
          <Link
            to="/"
            className="px-8 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </div>
  );
}
