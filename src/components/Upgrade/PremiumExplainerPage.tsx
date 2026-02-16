import { Link } from 'react-router-dom';
import { Bell, LineChart, PawPrint, ShieldCheck, CheckCircle, Package, Calendar } from 'lucide-react';

export function PremiumExplainerPage() {
  const monthlyPrice = 2.99;
  const annualPrice = 23.0;
  const savings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Premium care tools that keep you on track
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your care, simplified: reminders when it matters, organized animal profiles, and clear progress over time.
          </p>
          <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
            $2.99/mo or $23/yr (save {savings}%)
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Built by a keeper to reduce stress and improve animal care consistency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Explore premium
            </Link>
            <Link
              to="/profile"
              className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What premium includes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Three focused tools that keep care consistent and visible.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Never miss a task</h3>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Reminders and schedules keep feeding, misting, and cleanings consistent.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <PawPrint className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">See health trends</h3>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Track weight and care history so changes are easy to spot.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Package className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Stay stocked</h3>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Inventory reminders help you avoid running out of essentials.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/40 p-2 text-emerald-700 dark:text-emerald-200">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Care Tasks & Inventory</h3>
              </div>
            </div>
            <ul className="mt-4 text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Daily, weekly, or custom care schedules with push notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Track UVB bulb replacement dates automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Track equipment maintenance alongside care tasks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Track completion history and reliability score</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Monitor substrate and supplement inventory levels</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Manage multiple enclosures in one dashboard</span>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
              Notifications work best when the app is installed as a PWA on mobile.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/40 p-2 text-emerald-700 dark:text-emerald-200">
                <PawPrint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Animal Profiles & Tracking</h3>
              </div>
            </div>
            <ul className="mt-4 text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Track names, gender, morph, and birthday for each animal</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Weight tracking with history charts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Care history timeline for each animal</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Store notes about health, temperament, and special needs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Centralized view of all animals across enclosures</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Flexible enclosure assignments (quarantine support)</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/40 p-2 text-emerald-700 dark:text-emerald-200">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Care Analytics & Insights</h3>
              </div>
            </div>
            <ul className="mt-4 text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Track current and longest care streaks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>90-day activity heatmap visualization</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Weekly and monthly care summaries</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Task type breakdown (feeding, misting, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Completion rate percentage tracking</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How it works</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">A simple flow that keeps care consistent, even with multiple enclosures.</p>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
            <figure className="rounded-2xl border-2 border-emerald-300/70 dark:border-emerald-600/70 bg-white dark:bg-gray-800 p-3 shadow-sm flex-shrink-0 w-[92%] sm:w-[75%] md:w-[55%] lg:w-[40%] snap-center">
              <img
                src="/premium/create_task.png"
                alt="Create a care reminder"
                className="aspect-[9/16] w-full rounded-xl bg-gray-50 dark:bg-gray-900/40 object-cover"
                loading="lazy"
              />
              <figcaption className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                1. Create a reminder
              </figcaption>
            </figure>
            <figure className="rounded-2xl border-2 border-blue-300/70 dark:border-blue-600/70 bg-white dark:bg-gray-800 p-3 shadow-sm flex-shrink-0 w-[92%] sm:w-[75%] md:w-[55%] lg:w-[40%] snap-center">
              <img
                src="/premium/care_tasks.png"
                alt="Care tasks list"
                className="aspect-[9/16] w-full rounded-xl bg-gray-50 dark:bg-gray-900/40 object-cover"
                loading="lazy"
              />
              <figcaption className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                2. See what is due
              </figcaption>
            </figure>
            <figure className="rounded-2xl border-2 border-amber-300/70 dark:border-amber-600/70 bg-white dark:bg-gray-800 p-3 shadow-sm flex-shrink-0 w-[92%] sm:w-[75%] md:w-[55%] lg:w-[40%] snap-center">
              <img
                src="/premium/inventory_tasks.png"
                alt="Inventory reminders"
                className="aspect-[9/16] w-full rounded-xl bg-gray-50 dark:bg-gray-900/40 object-cover"
                loading="lazy"
              />
              <figcaption className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                3. Stay ahead of supplies
              </figcaption>
            </figure>
            <figure className="rounded-2xl border-2 border-purple-300/70 dark:border-purple-600/70 bg-white dark:bg-gray-800 p-3 shadow-sm flex-shrink-0 w-[92%] sm:w-[75%] md:w-[55%] lg:w-[40%] snap-center">
              <img
                src="/premium/animal_profiles.png"
                alt="Animal profiles"
                className="aspect-[9/16] w-full rounded-xl bg-gray-50 dark:bg-gray-900/40 object-cover"
                loading="lazy"
              />
              <figcaption className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                4. Track each animal
              </figcaption>
            </figure>
            <figure className="rounded-2xl border-2 border-rose-300/70 dark:border-rose-600/70 bg-white dark:bg-gray-800 p-3 shadow-sm flex-shrink-0 w-[92%] sm:w-[75%] md:w-[55%] lg:w-[40%] snap-center">
              <img
                src="/premium/animal_weight.png"
                alt="Animal weight tracking"
                className="aspect-[9/16] w-full rounded-xl bg-gray-50 dark:bg-gray-900/40 object-cover"
                loading="lazy"
              />
              <figcaption className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                5. Watch health trends
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">Free vs Premium</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Free</h4>
              <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <li>Unlimited build plans and shopping lists</li>
                <li>Access to care guides and animal profiles</li>
                <li>Plan previews and layout guidance</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-900/20 p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Premium</h4>
              <ul className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li>Care calendar with reminders and logs</li>
                <li>Animal profiles, weight tracking, and insights</li>
                <li>Inventory tracking and maintenance alerts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Calendar className="w-4 h-4" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Routine examples</h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>Feeding schedule by age or species type</li>
              <li>Spot-clean and full-clean cycles</li>
              <li>Water changes or misting routines</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <PawPrint className="w-4 h-4" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">What gets tracked</h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>Care task history by animal</li>
              <li>Notes tied to feeding or behavior</li>
              <li>Simple timeline of changes</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Package className="w-4 h-4" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Inventory focus</h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>UVB bulb age and replacement windows</li>
              <li>Substrate and supplement usage tracking</li>
              <li>Consumables checklist for reorders</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-900/20 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/80 dark:bg-gray-900/40 p-3 text-emerald-700 dark:text-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Premium pricing</h3>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80">
                Choose monthly flexibility or annual savings. Both include full Premium access.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white/80 dark:bg-gray-900/30 p-4">
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Monthly</h4>
              <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ${monthlyPrice.toFixed(2)}
                <span className="text-sm font-semibold text-emerald-800/80 dark:text-emerald-200/80"> / month</span>
              </p>
              <p className="mt-2 text-xs text-emerald-800/70 dark:text-emerald-200/70">Billed monthly. Cancel anytime.</p>
            </div>
            <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-700/60 bg-white/80 dark:bg-gray-900/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Annual</h4>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                  Best value
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ${annualPrice.toFixed(2)}
                <span className="text-sm font-semibold text-emerald-800/80 dark:text-emerald-200/80"> / year</span>
              </p>
              <p className="mt-2 text-xs text-emerald-800/70 dark:text-emerald-200/70">
                Save {savings}% compared to monthly.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Upgrade to Premium
            </Link>
            <span className="text-xs text-emerald-800/70 dark:text-emerald-200/70">
              Cancel anytime.
            </span>
          </div>
          <p className="text-xs text-emerald-800/70 dark:text-emerald-200/70">
            No long-term commitment required. Your plan can be cancelled at any time.
          </p>
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready for premium care?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start now and keep your routine consistent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              See pricing
            </Link>
            <Link
              to="/blog"
              className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 underline"
            >
              Browse free care guides
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Frequently asked questions</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Do I need premium to use the plan builder?</h4>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                No. The build plan generator and care guides are free to use.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Can I cancel anytime?</h4>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Yes. Premium can be cancelled at any time.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">What happens if I stop premium?</h4>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                You can still access your plans, but premium reminders and analytics are disabled.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Is this tied to my animal data?</h4>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Yes. Premium uses your tracked animals and care tasks to personalize reminders and analytics.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Are premium features still evolving?</h4>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Yes. Premium features are continuously updated and expanded over time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/upgrade"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Continue to upgrade
          </Link>
          <Link
            to="/plan"
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 underline"
          >
            Back to your plan
          </Link>
        </div>
      </div>
    </div>
  );
}
