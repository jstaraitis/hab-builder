import { Link } from 'react-router-dom';
import { SEO } from '../SEO/SEO';
import { Squirrel, Ruler, Sparkles, CheckCircle2, AlertTriangle, MessageCircle, ArrowRight, Calculator, HelpCircle } from 'lucide-react';

interface AboutProps {
  readonly onOpenFeedback: () => void;
}

export function About({ onOpenFeedback }: AboutProps) {
  return (
    <>
      <SEO
        title="About Habitat Builder"
        description="Learn about Habitat Builder's mission to help reptile and amphibian keepers design proper enclosures with accurate care parameters and equipment recommendations."
        keywords={['about habitat builder', 'reptile enclosure tool', 'vivarium planning', 'reptile care guide']}
      />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Hero */}
        <div className="bg-gradient-to-r from-accent to-teal-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">About Habitat Builder</h1>
          <p className="text-base md:text-lg text-white/80">
            A beginner-friendly way to build a safe, species-correct enclosure with confidence.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-card border border-divider rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Our Mission</h2>
          <p className="text-muted leading-relaxed mb-3">
            Getting a first reptile or amphibian should feel exciting, not overwhelming. We built Habitat Builder
            to turn real care requirements into a clear, step-by-step plan so you can feel confident from day one.
          </p>
          <p className="text-muted leading-relaxed">
            The tool is <strong className="text-accent">free to use</strong> for the core planner. Premium features
            like the Care Calendar, animal tracking, and inventory management are available with a{' '}
            <Link to="/premium" className="text-accent underline">Premium subscription</Link>.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-card border border-divider rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-5">How It Works</h2>
          <div className="space-y-5">
            {[
              { icon: Squirrel, title: 'Select Your Animal', desc: 'Choose from popular species with verified care requirements. Not sure what fits your space? Use the Find Your Animal tool.' },
              { icon: Ruler, title: 'Enter Your Dimensions', desc: 'Input your enclosure size and get it validated against species minimums, enclosure type, and your setup preferences.' },
              { icon: Sparkles, title: 'Get Your Custom Plan', desc: 'Receive a complete shopping list, layout diagram, care targets, substrate guide, and step-by-step build instructions.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-card border border-divider rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Where Our Data Comes From</h2>
          <ul className="space-y-3 mb-5">
            {[
              { label: 'Equipment manufacturers', detail: 'UVB output, wattage, and coverage specs' },
              { label: 'Community expertise', detail: 'Input from experienced keepers and hobbyists' },
              { label: 'Scientific literature', detail: 'Thermal biology and natural habitat research' },
            ].map(({ label, detail }) => (
              <li key={label} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-muted text-sm"><strong className="text-white">{label}</strong> -- {detail}</span>
              </li>
            ))}
          </ul>
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
            <Calculator className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-white/80 leading-relaxed">
              Equipment recommendations are <strong className="text-white">math-based, not AI guesses</strong> -- we
              use formulas for enclosure volume, temperature delta, and UVB coverage to calculate sizing.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-300">A Quick Note</h2>
          </div>
          <ul className="space-y-2 text-sm text-amber-200/80">
            <li>We are not vets -- if your animal seems unwell, consult a reptile-specialist vet</li>
            <li>Every animal is different; age, health, and environment all affect what you will need</li>
            <li>Use this as a solid starting point and keep learning as you go</li>
          </ul>
        </div>

        {/* CTA row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card border border-divider rounded-2xl p-5 flex flex-col gap-3">
            <HelpCircle className="w-6 h-6 text-accent" />
            <h3 className="font-semibold text-white">Have a question?</h3>
            <p className="text-muted text-sm flex-1">Check the FAQ for answers to common questions about the tool and reptile care.</p>
            <Link to="/faq" className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline">
              View FAQ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-card border border-divider rounded-2xl p-5 flex flex-col gap-3">
            <MessageCircle className="w-6 h-6 text-accent" />
            <h3 className="font-semibold text-white">Got feedback?</h3>
            <p className="text-muted text-sm flex-1">We read every message. Ideas, bug reports, and species requests are all welcome.</p>
            <button
              onClick={onOpenFeedback}
              className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline text-left"
            >
              Send Feedback <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-muted text-sm pb-6">
          <Link to="/whats-new" className="text-accent hover:underline">View what's new</Link>
          {' -- '}
          <Link to="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>
        </div>

      </div>
    </>
  );
}