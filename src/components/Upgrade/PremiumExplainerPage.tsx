import { Link } from 'react-router-dom';
import { Bell, LineChart, PawPrint, ShieldCheck, CheckCircle, Package, Calendar } from 'lucide-react';
import { TRIAL_DAYS } from '../../constants/billing';

export function PremiumExplainerPage() {
  const monthlyPrice = 2.99;
  const annualPrice = 23.0;
  const savings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  // The page background was a light-mode gradient with a dark override. In a
  // dark-only app the light half never applied, so it was really just
  // `bg-gray-900` with extra steps.
  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Know your setup is right, not just recorded
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Most apps record what you did. Habitat Builder checks it against what your species actually needs — and tells you what to fix first.
          </p>
          <div className="text-sm text-accent font-semibold">
            $2.99/mo or $23/yr (save {savings}%)
          </div>
          <p className="text-xs text-muted">
            Built by a keeper to reduce stress and improve animal care consistency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-dim"
            >
              Explore premium
            </Link>
            <Link
              to="/profile"
              className="text-sm font-semibold text-accent underline"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">What premium includes</h2>
          <p className="text-sm text-muted">The tools you cannot get from a logbook.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-accent/30 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-white">Is my setup right?</h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              Habitat Score and Setup Check grade your enclosure against your species’ Ferguson zone and care targets, then name the fix worth doing first.
            </p>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <PawPrint className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-white">What do I tell the vet?</h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              A printable health report with weight, feeding, shedding and stool history — and the patterns worth raising already picked out.
            </p>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Package className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-white">Is my animal on track?</h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              Growth percentiles built from other keepers’ animals of the same species and age — a reference chart exotics medicine has never had.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-accent/30 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-accent/15 p-2 text-accent">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Care Tasks & Inventory</h3>
              </div>
            </div>
            <ul className="mt-4 text-xs text-muted space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Daily, weekly, or custom care schedules with push notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Track UVB bulb replacement dates automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Track equipment maintenance alongside care tasks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Track completion history and reliability score</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Monitor substrate and supplement inventory levels</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Manage multiple enclosures in one dashboard</span>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-muted">
              Notifications work best with the native iOS app (App Store) or when the web app is installed as a PWA on mobile.
            </p>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-accent/15 p-2 text-accent">
                <PawPrint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Animal Profiles & Tracking</h3>
              </div>
            </div>
            <ul className="mt-4 text-xs text-muted space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Track names, gender, morph, and birthday for each animal</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Weight tracking with history charts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Care history timeline for each animal</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Store notes about health, temperament, and special needs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Centralized view of all animals across enclosures</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Flexible enclosure assignments (quarantine support)</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-accent/15 p-2 text-accent">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Care Analytics & Insights</h3>
              </div>
            </div>
            <ul className="mt-4 text-xs text-muted space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Track current and longest care streaks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>90-day activity heatmap visualization</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Weekly and monthly care summaries</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Task type breakdown (feeding, misting, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Completion rate percentage tracking</span>
              </li>
            </ul>
          </div>
        </div>


        <div className="rounded-2xl border border-divider bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white text-center">Free vs Premium</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-divider p-4">
              <h4 className="text-sm font-semibold text-white">Free</h4>
              <ul className="mt-3 space-y-2 text-xs text-muted">
                <li>Unlimited build plans and shopping lists</li>
                <li>Access to care guides and animal profiles</li>
                {/* "Plan previews and layout guidance" described the enclosure
                    designer, which no longer exists. */}
                <li>Species care targets and setup guidance</li>
                <li className="pt-1 border-t border-divider">1 enclosure, 1 animal, unlimited care tasks</li>
              </ul>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
              <h4 className="text-sm font-semibold text-white">Premium</h4>
              <ul className="mt-3 space-y-2 text-xs text-secondary">
                <li>Setup Check &amp; Habitat Score — graded against your species</li>
                <li>Vet-ready health report you can print or share</li>
                <li>Growth percentiles against other keepers&apos; animals</li>
                <li>&ldquo;What changed?&rdquo; retrospective when something goes wrong</li>
                <li>Nutrition analysis read against your UVB provision</li>
                <li>Pet-sitter care sheet for when you travel</li>
                <li className="pt-1 border-t border-accent/20">
                  Plus unlimited animals, push reminders, inventory and collection import
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-divider bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Calendar className="w-4 h-4" />
              <h4 className="text-sm font-semibold text-white">Routine examples</h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>Feeding schedule by age or species type</li>
              <li>Spot-clean and full-clean cycles</li>
              <li>Water changes or misting routines</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-divider bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <PawPrint className="w-4 h-4" />
              <h4 className="text-sm font-semibold text-white">What gets tracked</h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>Care task history by animal</li>
              <li>Notes tied to feeding or behavior</li>
              <li>Simple timeline of changes</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-divider bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Package className="w-4 h-4" />
              <h4 className="text-sm font-semibold text-white">Inventory focus</h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>UVB bulb age and replacement windows</li>
              <li>Substrate and supplement usage tracking</li>
              <li>Consumables checklist for reorders</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-card-elevated p-3 text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent">Premium pricing</h3>
              <p className="text-sm text-accent/80">
                Choose monthly flexibility or annual savings. Both include full Premium access.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/30 bg-card-elevated p-4">
              <h4 className="text-sm font-semibold text-accent">Monthly</h4>
              <p className="mt-2 text-2xl font-bold text-accent">
                ${monthlyPrice.toFixed(2)}
                <span className="text-sm font-semibold text-accent/80"> / month</span>
              </p>
              <p className="mt-2 text-xs text-accent/80">Billed monthly. Cancel anytime.</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-card-elevated p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-accent">Annual</h4>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Best value
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-accent">
                ${annualPrice.toFixed(2)}
                <span className="text-sm font-semibold text-accent/80"> / year</span>
              </p>
              <p className="mt-2 text-xs text-accent/80">
                Save {savings}% compared to monthly.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dim"
            >
              Upgrade to Premium
            </Link>
            <span className="text-xs text-accent/80">
              Cancel anytime.
            </span>
          </div>
          <p className="text-xs text-accent/80">
            No long-term commitment required. Your plan can be cancelled at any time.
          </p>
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white">Ready for premium care?</h2>
          <p className="text-sm text-muted">
            Start now and keep your routine consistent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-dim"
            >
              See pricing
            </Link>
            <Link
              to="/blog"
              className="text-sm font-semibold text-accent underline"
            >
              Browse free care guides
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-divider bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white">Frequently asked questions</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-white">Do I need premium to use the plan builder?</h4>
              <p className="mt-1 text-xs text-muted">
                No. The build plan generator, shopping lists and care guides are free, and always will be.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Is there a free trial?</h4>
              <p className="mt-1 text-xs text-muted">
                Yes — {TRIAL_DAYS} days, and you are not charged if you cancel before it ends. One trial per account.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Can I cancel anytime?</h4>
              <p className="mt-1 text-xs text-muted">
                Yes, from your profile. Premium stays active until the end of the period you have already paid for.
              </p>
            </div>
            {/* The real anxiety behind "what if I stop paying" is whether the
                records disappear. The old answer talked about reminders and
                analytics, which is not what anyone is actually asking. */}
            <div>
              <h4 className="text-sm font-semibold text-white">What happens to my records if I stop?</h4>
              <p className="mt-1 text-xs text-muted">
                Nothing is deleted. Your animals, weights and care history stay in your account — you keep
                access to one enclosure and one animal, and premium features switch off. Resubscribe and
                everything is where you left it.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Can I bring my collection from another app?</h4>
              <p className="mt-1 text-xs text-muted">
                Yes. Import a CSV from a spreadsheet or any other husbandry app&apos;s export — you confirm
                which column is which, so no particular format is required.
              </p>
            </div>
            {/* Cohort contribution defaults to on, so this is the place a
                prospective subscriber should learn about it — not after paying. */}
            <div>
              <h4 className="text-sm font-semibold text-white">Is my data shared with anyone?</h4>
              <p className="mt-1 text-xs text-muted">
                Your records are private. Weights contribute anonymously to species growth benchmarks —
                species, sex, age and weight only, never your account, your name or your animals&apos;
                names. You can turn that off in your profile, which also deletes what you have already
                contributed.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Is the health report veterinary advice?</h4>
              <p className="mt-1 text-xs text-muted">
                No. It organises the records you entered and flags patterns worth raising, so a vet can
                see the history at a glance. It does not diagnose, and it is not a substitute for
                seeing one.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">How accurate is the Setup Check?</h4>
              <p className="mt-1 text-xs text-muted">
                It uses Ferguson zones and general husbandry guidance to catch setups that are clearly
                wrong — the wrong bulb for a species, UVB out of range, a probe in the wrong place. For
                exact UVB figures, check your lamp&apos;s manufacturer chart or use a UV meter.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/upgrade"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-dim"
          >
            Continue to upgrade
          </Link>
          <Link
            to="/plan"
            className="text-sm font-semibold text-accent underline"
          >
            Back to your plan
          </Link>
        </div>
      </div>
    </div>
  );
}
