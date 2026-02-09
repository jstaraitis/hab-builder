import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Calendar, TrendingUp, Package, Bell, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { stripeService } from '../../services/stripeService';
import { supabase } from '../../lib/supabase';

// Stripe Price IDs - from environment variables
const PRICE_IDS = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY,
  annual: import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL,
};

export function UpgradePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/profile'); // Redirect to login
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user's JWT token for secure authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Unable to authenticate. Please try logging in again.');
      }

      await stripeService.redirectToCheckout({
        priceId: PRICE_IDS[billingCycle],
        userId: user.id,
        userEmail: user.email || '',
        userToken: session.access_token,
      });
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const monthlyPrice = 5.00;
  const annualPrice = 39.00; // ~$3.25/month
  const savings = ((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Upgrade to Premium
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Never Miss a Care Task Again
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock powerful care tracking tools to keep your animals healthy and thriving
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
              billingCycle === 'annual'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save {savings}%
            </span>
          </button>
        </div>

        {/* Pricing Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-emerald-500 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              ${billingCycle === 'monthly' ? monthlyPrice.toFixed(2) : annualPrice.toFixed(2)}
              <span className="text-2xl text-gray-500 dark:text-gray-400 font-normal">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            {billingCycle === 'annual' && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Just $3.25/month when billed annually
              </p>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-8">
            <FeatureItem
              icon={<Calendar className="w-5 h-5" />}
              title="Care Calendar & Reminders"
              description="Never forget feeding, misting, or cleaning with smart scheduling"
            />
            <FeatureItem
              icon={<TrendingUp className="w-5 h-5" />}
              title="Health & Feeding Analytics"
              description="Track weight, feeding patterns, and consumption trends over time"
            />
            <FeatureItem
              icon={<Package className="w-5 h-5" />}
              title="Inventory Management"
              description="Track supplies, set reorder alerts, and monitor expiration dates"
            />
            <FeatureItem
              icon={<Bell className="w-5 h-5" />}
              title="Push Notifications"
              description="Get timely reminders on your phone or desktop (PWA)"
            />
            <FeatureItem
              icon={<Turtle className="w-5 h-5" />}
              title="Unlimited Animals"
              description="Manage multiple enclosures and animals in one place"
            />
            <FeatureItem
              icon={<Zap className="w-5 h-5" />}
              title="Advanced Features"
              description="Weight tracking, photo journals (coming soon!), vet records, and more"
            />
          </div>

          {/* CTA Button */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Upgrade Now
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            Cancel anytime. No questions asked.
          </p>
        </div>

        {/* FAQ / Additional Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Why go Premium?
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
            <p>
              <strong>Free plan:</strong> Generate unlimited build plans, browse care guides, use the designer (no save/export)
            </p>
            <p>
              <strong>Premium plan:</strong> Everything above PLUS care tracking, health monitoring, smart reminders, and unlimited cloud-synced animals
            </p>
            <p>
              Premium helps us keep the lights on while providing world-class care tools. 100% of proceeds go toward improving the app and adding new species.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 dark:text-white">{title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
      </div>
      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
    </div>
  );
}

// Import missing icon
function Turtle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 12h3M17 12h3M12 4v3M12 17v3" />
    </svg>
  );
}
