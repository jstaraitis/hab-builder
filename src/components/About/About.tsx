import { Link } from 'react-router-dom';
import { SEO } from '../SEO/SEO';

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
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">About Habitat Builder</h1>
          <p className="text-xl text-emerald-50">
            Helping reptile and amphibian keepers design proper enclosures, one habitat at a time.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Setting up a reptile or amphibian enclosure can be overwhelming. Beginners face conflicting advice, 
            confusing equipment options, and the fear of making costly mistakes that could harm their new pet.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            <strong className="text-gray-900 dark:text-white">Habitat Builder</strong> was created to solve this problem. 
            We provide species-specific, science-backed enclosure plans that take the guesswork out of habitat setup.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Our goal is simple: <strong className="text-emerald-600 dark:text-emerald-400">make proper reptile care accessible to everyone</strong>, 
            from first-time keepers to experienced hobbyists upgrading their setups.
          </p>
        </div>

        {/* Why We Built This */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Why This Tool Exists</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The reptile hobby is growing rapidly, but newcomers often struggle with:
          </p>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-red-500 text-xl">❌</span>
              <span><strong>Undersized enclosures</strong> - "20 gallon is fine for adult bearded dragons" (it's not)</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-red-500 text-xl">❌</span>
              <span><strong>Wrong equipment</strong> - Coil UVB bulbs, inadequate heating, improper substrates</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-red-500 text-xl">❌</span>
              <span><strong>Information overload</strong> - Spending hours on forums trying to piece together care guides</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-red-500 text-xl">❌</span>
              <span><strong>Budget surprises</strong> - Not realizing how much proper setup costs until it's too late</span>
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We built Habitat Builder to give keepers a <strong className="text-gray-900 dark:text-white">clear roadmap </strong> 
            from day one—accurate dimensions, proper equipment, and step-by-step instructions.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Select Your Animal</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Choose from our database of popular reptiles and amphibians, each with verified care requirements.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Input Your Dimensions</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Enter your enclosure size (or choose from common presets). We'll validate it against species requirements.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Get Your Custom Plan</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Instantly receive equipment recommendations, substrate calculations, layout suggestions, and step-by-step build instructions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Our Sources & Methodology</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            All animal profiles and care parameters are based on:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-emerald-500 text-xl">✓</span>
              <div>
                <strong className="text-gray-900 dark:text-white">ReptiFiles</strong> - Comprehensive, research-backed care guides by Jessica Archibald
                <a 
                  href="https://reptifiles.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  reptifiles.com ↗
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-emerald-500 text-xl">✓</span>
              <span><strong className="text-gray-900 dark:text-white">Equipment manufacturers</strong> - Official specifications for UVB output, wattage, coverage</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-emerald-500 text-xl">✓</span>
              <span><strong className="text-gray-900 dark:text-white">Community expertise</strong> - Insights from experienced breeders and keepers</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-emerald-500 text-xl">✓</span>
              <span><strong className="text-gray-900 dark:text-white">Scientific literature</strong> - Published research on thermal biology and habitat requirements</span>
            </li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Our Calculation Approach</h3>
            <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
              Equipment recommendations are <strong>deterministic, not AI-generated</strong>. We use formulas based on enclosure volume, 
              temperature differentials, and species-specific needs. For example, UVB fixture length = enclosure width × coverage percentage. 
              Heat lamp wattage scales with volume and required temperature increase.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-300 mb-3">⚠️ Important Disclaimer</h2>
          <p className="text-yellow-800 dark:text-yellow-300 text-sm leading-relaxed mb-3">
            Habitat Builder provides <strong>general guidance</strong> based on established care standards. However:
          </p>
          <ul className="space-y-2 text-yellow-800 dark:text-yellow-300 text-sm">
            <li>• This tool is <strong>not a substitute for veterinary advice</strong></li>
            <li>• Individual animals may have unique needs (health issues, age, morphs)</li>
            <li>• Always research your specific animal and consult experienced keepers</li>
            <li>• Environmental factors (ambient temperature, humidity) affect requirements</li>
            <li>• We are not responsible for animal welfare outcomes</li>
          </ul>
        </div>

        {/* Future Plans */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">What's Next</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            We're constantly expanding Habitat Builder with:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• <strong className="text-gray-900 dark:text-white">More animals</strong> - Adding popular species monthly</li>
            <li>• <strong className="text-gray-900 dark:text-white">Cost estimates</strong> - Budget planning with real-time pricing</li>
            <li>• <strong className="text-gray-900 dark:text-white">3D previews</strong> - Visual layout tools</li>
            <li>• <strong className="text-gray-900 dark:text-white">Saved designs</strong> - Compare multiple setups</li>
            <li>• <strong className="text-gray-900 dark:text-white">Community features</strong> - Share your builds, get feedback</li>
          </ul>
          <div className="mt-6">
            <Link 
              to="/roadmap" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View our roadmap →
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Get in Touch</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Have questions, suggestions, or want to contribute animal profiles?<br />
            We'd love to hear from you!
          </p>
          <button 
            onClick={onOpenFeedback}
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
          >
            Send Feedback
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm pb-8">
          <p>Built with ❤️ for the reptile and amphibian keeping community</p>
          <p className="mt-2">Last updated: January 2026</p>
        </div>
      </div>
    </>
  );
}
