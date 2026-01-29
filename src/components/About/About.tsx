import { Link } from 'react-router-dom';
import { SEO } from '../SEO/SEO';
import { Target, Lightbulb, Workflow, Database, Calculator, AlertTriangle, Rocket, MessageCircle, Heart, Squirrel, Ruler, Sparkles, CheckCircle2, Factory, Users, FlaskConical, XCircle, Home, DollarSign, Box, Save, Share2, ArrowRight } from 'lucide-react';

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
            Making reptile and amphibian care way less stressful (and way more fun)!
          </p>
        </div>

        {/* Origin Story */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">How This Started</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            So here's the real story: I was researching to get my whites tree frogs, and I thought "this'll be easy—just buy 
            a tank and set it up, right?" Wrong. <em>So</em> wrong.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            I spent weeks down rabbit holes on Reddit, YouTube, Facebook groups, random care sheets that all said different things... 
            One source said 10 gallons is fine, another said 20 minimum. Someone swore by screen enclosures, someone else 
            said they'd kill your frogs from humidity loss. UVB? Maybe? Depends who you ask.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            I ended up with a massive spreadsheet comparing like 30 different setups, trying to figure out what was actually  
            <em> right</em>. And I kept thinking: "Why doesn't something just... tell me what I need?"
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            So I built it. <strong className="text-gray-900 dark:text-white">Habitat Builder</strong> is literally the tool 
            I wished existed when I was drowning in conflicting advice. If it helps even one person skip the stress I went through, 
            totally worth it.
          </p>
          
          {/* Frog Photo */}
          <div className="mt-6 overflow-hidden rounded-xl shadow-lg max-w-2xl mx-auto border-4 border-emerald-300 dark:border-emerald-700">
            <img 
              src="/animals/whites-tree-frog/whites-tree-frog-6.jpg" 
              alt="Three White's Tree Frogs named Mango, Kiwi, and Fig"
              className="w-full h-64 sm:h-80 object-cover"
            />
            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 px-4 py-3 border-t-2 border-emerald-200 dark:border-emerald-800">
              <p className="text-center text-sm text-gray-700 dark:text-gray-300 font-medium italic">
                 Mango, Kiwi, and Fig 
              </p>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">What We're All About</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Look, setting up a reptile enclosure shouldn't feel like solving a Rubik's cube blindfolded. But between 
            conflicting forum advice, confusing equipment labels, and the fear of accidentally harming your new pet... 
            it can be pretty overwhelming.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            That's why we built <strong className="text-gray-900 dark:text-white">Habitat Builder</strong>. We give you 
            species-specific, science-backed plans that actually make sense—no more guessing, no more "wait, do I need that?"
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Our goal? <strong className="text-emerald-600 dark:text-emerald-400">Make proper reptile care accessible to everyone</strong>—whether 
            you're setting up your first gecko terrarium or upgrading your ball python's palace.
          </p>
        </div>

        {/* Why We Built This */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Why We Built This Thing</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            More people are getting into reptiles (awesome!), but we kept seeing the same mistakes over and over:
          </p>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span><strong>Undersized enclosures</strong> - "20 gallon is fine for adult bearded dragons" (it's not)</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span><strong>Wrong equipment</strong> - Coil UVB bulbs, inadequate heating, improper substrates</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span><strong>Information overload</strong> - Spending hours on forums trying to piece together care guides</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
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
                <Squirrel className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                <Ruler className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Where We Get Our Info</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            We didn't just make this stuff up. Every animal profile and care parameter comes from:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900 dark:text-white">Equipment manufacturers</strong> - Official specifications for UVB output, wattage, coverage</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900 dark:text-white">Community expertise</strong> - Insights from experienced breeders and keepers</span>
            </li>
            <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900 dark:text-white">Scientific literature</strong> - Published research on thermal biology and habitat requirements</span>
            </li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">How We Calculate Stuff</h3>
            </div>
            <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
              Quick note: our equipment recommendations are <strong>math-based, not AI guesses</strong>. We use actual formulas 
              (enclosure volume, temperature needs, species requirements) to figure out what you need. For example, your UVB fixture 
              length is calculated from your tank width × coverage percentage. Heat lamp wattage? That's based on volume and how much 
              temp increase you need. Real science, not magic.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-300">Quick Reality Check</h2>
          </div>
          <p className="text-yellow-800 dark:text-yellow-300 text-sm leading-relaxed mb-3">
            We provide solid <strong>general guidance</strong> based on proven care standards, but here's the thing:
          </p>
          <ul className="space-y-2 text-yellow-800 dark:text-yellow-300 text-sm">
            <li>• We're not vets—if your pet seems sick, <strong>talk to a vet</strong></li>
            <li>• Every animal is different (health, age, temperament, morphs—they all matter)</li>
            <li>• Do your own research too and chat with experienced keepers</li>
            <li>• Your home environment (ambient temp, humidity) affects what you'll need</li>
            <li>• We're here to help, but ultimately, you're responsible for your pet's welfare</li>
          </ul>
        </div>

        {/* Future Plans */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">What's Coming Next</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            We're always cooking up new stuff:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <Squirrel className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
              <span><strong className="text-gray-900 dark:text-white">More animals</strong> - We're adding new species every month</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
              <span><strong className="text-gray-900 dark:text-white">Cost estimates</strong> - Know what you'll spend before you buy</span>
            </li>
            <li className="flex items-start gap-2">
              <Box className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
              <span><strong className="text-gray-900 dark:text-white">3D previews</strong> - See your setup before you build it</span>
            </li>
            <li className="flex items-start gap-2">
              <Save className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
              <span><strong className="text-gray-900 dark:text-white">Saved designs</strong> - Save and compare different setups</span>
            </li>
            <li className="flex items-start gap-2">
              <Share2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
              <span><strong className="text-gray-900 dark:text-white">Community features</strong> - Share your builds and get advice from other keepers</span>
            </li>
          </ul>
          <div className="mt-6">
            <Link 
              to="/roadmap" 
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View our roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Let's Chat</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Got questions? Ideas? Want to help us add more animals?<br />
            Hit us up—we actually read everything!
          </p>
          <button 
            onClick={onOpenFeedback}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            Send Feedback
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm pb-8">
          <p className="flex items-center justify-center gap-2">
            Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for the reptile and amphibian keeping community
          </p>
          <p className="mt-2">Last updated: January 2026</p>
        </div>
      </div>
    </>
  );
}
