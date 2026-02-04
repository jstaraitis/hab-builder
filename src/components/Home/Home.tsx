import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Worm, Search, BookOpen, CheckCircle, ShieldAlert, ShoppingCart, ClipboardList, DollarSign, Sparkles, Quote, Star, Bell, GraduationCap, Palette } from 'lucide-react';

export function Home() {
  const [activeBenefitCard, setActiveBenefitCard] = useState(0);
  const [activeFeatureCard, setActiveFeatureCard] = useState(0);
  const benefitScrollRef = useRef<HTMLDivElement>(null);
  const featureScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = benefitScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.offsetWidth;
      const scrollWidth = scrollContainer.scrollWidth;
      const cardWidth = containerWidth * 0.90 + 16; // 90% width + gap
      
      // Handle last card edge case
      const isAtEnd = scrollLeft + containerWidth >= scrollWidth - 10;
      if (isAtEnd) {
        setActiveBenefitCard(5);
        return;
      }
      
      const activeIndex = Math.round(scrollLeft / cardWidth);
      setActiveBenefitCard(Math.min(activeIndex, 5)); // Clamp to max 5
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const scrollContainer = featureScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.offsetWidth;
      const scrollWidth = scrollContainer.scrollWidth;
      const cardWidth = containerWidth * 0.90 + 16; // 90% width + gap
      
      // Handle last card edge case
      const isAtEnd = scrollLeft + containerWidth >= scrollWidth - 10;
      if (isAtEnd) {
        setActiveFeatureCard(3);
        return;
      }
      
      const activeIndex = Math.round(scrollLeft / cardWidth);
      setActiveFeatureCard(Math.min(activeIndex, 3)); // Clamp to max 3
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
          Give Your Pet the Home
          <span className="block text-green-600 dark:text-green-400 flex items-center justify-center gap-3">They Deserve</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Setting up your first enclosure shouldn't be overwhelming. We'll walk you through everything step-by-step—from picking the right equipment to avoiding common mistakes. 
          <strong className="text-gray-900 dark:text-white"> Get the confidence that comes from knowing you're doing it right.</strong>
        </p>

        <p className="text-base text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-2">
           Takes about 5 minutes to get your custom plan • Completely free • No sign-up required
        </p>

        {/* Hero Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto border-4 border-green-200 dark:border-green-800">
          <img 
            src="/examples/whites-tree-frog/display-setup.jpg" 
            alt="Example White's Tree Frog bioactive enclosure setup"
            className="w-full h-64 md:h-96 object-cover"
            onError={(e) => {
              // Fallback to placeholder if image doesn't load
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect width="800" height="400" fill="%2322c55e"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="white"%3EBeautiful Bioactive Setup%3C/text%3E%3C/svg%3E';
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-sm">
            <p className="font-semibold">Example: White's Tree Frog Bioactive Setup</p>
          </div>
        </div>
      </section>

      {/* Personal Story Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-lg p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          Why I Built This
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-4 text-gray-700 dark:text-gray-300">
          <p className="text-lg leading-relaxed">
            When I decided to get White's Tree Frogs, I wasn't just excited—I was <em>determined</em> to give them the best possible life. These weren't decorations—they were going to be members of my family. I wanted to get <strong className="text-gray-900 dark:text-white">everything right.</strong>
          </p>
          
          <p className="text-lg leading-relaxed">
            So I dove into research. And that's when the anxiety hit. Every source contradicted the last. One person said 10 gallons was fine, another insisted on 20 minimum. Screen enclosures? Some swore by them, others said they'd seriously harm your frogs from humidity loss. UVB lighting? "Essential" according to some, "unnecessary" according to others.
          </p>
          
          <p className="text-lg leading-relaxed">
            I didn't want conflicting advice—I wanted to know <strong className="text-emerald-600 dark:text-emerald-400">what my frogs actually needed to thrive.</strong> Not just survive, but be healthy and happy. I ended up with this massive spreadsheet comparing 30+ setups, trying to figure out what would truly meet their needs.
          </p>
          
          <p className="text-lg leading-relaxed">
            And I kept thinking: Why doesn't something just exist that tells me—clearly and accurately—what's right for <em>my specific situation?</em> Something that cares as much about animal welfare as I do?
          </p>
          
          <p className="text-lg leading-relaxed">
            <strong className="text-gray-900 dark:text-white">So I built it.</strong> My name is Josh, and I'm a software engineer. Habitat Builder is what I wished existed back then—a tool built by a keeper, for keepers, that helps you provide proper care without the stress, second-guessing, and conflicting information. Because your animal deserves the best, and you deserve to feel confident you're giving it to them.
          </p>

          {/* Frog Photo */}
          <div className="mt-6 overflow-hidden rounded-xl shadow-lg border-4 border-emerald-300 dark:border-emerald-700">
            <img 
              src="/animals/whites-tree-frog/whites-tree-frog-6.jpg" 
              alt="Three White's Tree Frogs named Mango, Kiwi, and Fig"
              className="w-full h-64 sm:h-80 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect width="800" height="400" fill="%2322c55e"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="white"%3EMango, Kiwi, and Fig%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 px-4 py-3 border-t-2 border-emerald-200 dark:border-emerald-800">
              <p className="text-center text-sm text-gray-700 dark:text-gray-300 font-medium italic">
                 Mango, Kiwi, and Fig—happy, healthy, and thriving
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Your Complete Setup Plan in 5 Minutes
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto text-lg">
          Everything you need to give your pet a proper home—<strong className="text-gray-800 dark:text-gray-200">all free, forever</strong>
        </p>
        
        {/* Mobile: Swipeable cards */}
        <div className="md:hidden">
          <div ref={benefitScrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-4 -mx-4">
            <div className="flex-shrink-0 w-[90%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center space-y-3 border-2 border-red-200 dark:border-red-800">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Catch Mistakes Before You Buy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Screen enclosure for an amphibian? Gravel for an axolotl? We'll warn you about dangerous mistakes before they happen.
              </p>
            </div>

            <div className="flex-shrink-0 w-[90%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center space-y-3 border-2 border-purple-200 dark:border-purple-800">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Species-Specific Plans
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Crested geckos need different setups than bearded dragons. Everything is customized to your animal's exact requirements.
              </p>
            </div>

            <div className="flex-shrink-0 w-[90%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center space-y-3 border-2 border-blue-200 dark:border-blue-800">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Exact Shopping Lists
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No guessing wattages or sizes. Get precise equipment lists with purchase links and sizing calculations.
              </p>
            </div>

            <div className="flex-shrink-0 w-[90%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center space-y-3 border-2 border-amber-200 dark:border-amber-800">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                <ClipboardList className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Step-by-Step Instructions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Never wonder "what's next?" Clear build instructions tell you exactly what to do, in order, and why.
              </p>
            </div>

            <div className="flex-shrink-0 w-[90%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center space-y-3 border-2 border-emerald-200 dark:border-emerald-800">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Budget-Friendly Options
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get upfront cost estimates with three tier options—minimum, recommended, or ideal. Quality equipment at every price point.
              </p>
            </div>

            <div className="flex-shrink-0 w-[90%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center space-y-3 border-2 border-indigo-200 dark:border-indigo-800">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Science, Not AI Guesswork
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Deterministic calculations based on verified care requirements and enclosure physics. Same inputs equals same results, every time.
              </p>
            </div>
          </div>

          {/* Swipe indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeBenefitCard === index 
                    ? index === 0 ? 'bg-red-500' 
                      : index === 1 ? 'bg-purple-500'
                      : index === 2 ? 'bg-blue-500'
                      : index === 3 ? 'bg-amber-500'
                      : index === 4 ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-red-200 dark:border-red-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Catch Mistakes Before You Buy
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Screen enclosure for an amphibian? Gravel for an axolotl? We'll warn you about dangerous mistakes before they happen.
            </p>
          </div>

          <div className="text-center space-y-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Species-Specific Plans
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Crested geckos need different setups than bearded dragons. Everything is customized to your animal's exact requirements.
            </p>
          </div>

          <div className="text-center space-y-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Exact Shopping Lists
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No guessing wattages or sizes. Get precise equipment lists with purchase links and sizing calculations.
            </p>
          </div>

          <div className="text-center space-y-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-amber-200 dark:border-amber-800">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
              <ClipboardList className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Step-by-Step Instructions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Never wonder "what's next?" Clear build instructions tell you exactly what to do, in order, and why.
            </p>
          </div>

          <div className="text-center space-y-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-emerald-200 dark:border-emerald-800">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Budget-Friendly Options
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get upfront cost estimates with three tier options—minimum, recommended, or ideal. Quality equipment at every price point.
            </p>
          </div>

          <div className="text-center space-y-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Science, Not AI Guesswork
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Deterministic calculations based on verified care requirements and enclosure physics. Same inputs equals same results, every time.
            </p>
          </div>
        </div>
      </section>

      {/* Beyond Setup: Complete Care Tools */}
      <section className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Beyond Setup: Complete Care Tools
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto text-lg">
          Building the enclosure is just the start. We help you maintain proper care for years to come.
        </p>

        {/* Mobile: Swipeable cards */}
        <div className="md:hidden">
          <div ref={featureScrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-4 -mx-4">
            {/* Care Tasks Feature */}
            <div className="flex-shrink-0 w-[90%] snap-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Care Task Reminders
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Never miss a feeding, misting, or health check. Set up recurring care tasks with push notifications so your pet gets consistent, reliable care—even during busy weeks.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Daily, weekly, or custom schedules</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Push notifications to your phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Track completion history</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Manage multiple enclosures</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Reliability score tracks your care consistency</span>
                </li>
              </ul>
              <Link
                to="/blog/care-reminders-guide"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors text-sm mb-4"
              >
                Learn more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Premium feature in TESTING - requires paid subscription. Push notifications require browser permission and work best on mobile devices.
                </p>
              </div>
            </div>

            {/* Blog/Guides Feature */}
            <div className="flex-shrink-0 w-[90%] snap-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg p-6 border-2 border-amber-200 dark:border-amber-800">
              <div className="w-16 h-16 bg-amber-600 dark:bg-amber-500 rounded-2xl flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                77+ Free Care Guides
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Comprehensive, species-specific guides covering everything from substrate choices to feeding schedules. Validated by keepers who actually care about your animal's wellbeing.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Complete enrichment & welfare guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Substrate, heating, lighting, feeding guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Safety warnings for common mistakes</span>
                </li>
              </ul>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors text-sm mb-4"
              >
                Browse all guides
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Guides are educational resources. Always consult with an exotic veterinarian for health concerns and verify information against multiple sources.
                </p>
              </div>
            </div>

            {/* Visual Designer Feature */}
            <div className="flex-shrink-0 w-[90%] snap-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-800">
              <div className="w-16 h-16 bg-purple-600 dark:bg-purple-500 rounded-2xl flex items-center justify-center mb-4">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Visual Layout Designer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Drag-and-drop designer to plan your enclosure layout before you build. Visualize equipment placement, ensure proper thermal gradients, and avoid placement mistakes.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Interactive drag-and-drop canvas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Pre-sized equipment from your shopping list</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Zone overlays (basking, cooling, hides)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>Export as image to reference while building</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Available after generating your plan. Works best on larger screens (tablets/desktops). Still in development—verify all equipment fits and meets safety requirements before purchasing.
                </p>
              </div>
            </div>

            {/* Animal Search Feature */}
            <div className="flex-shrink-0 w-[90%] snap-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl shadow-lg p-6 border-2 border-emerald-200 dark:border-emerald-800">
              <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Find Your Perfect Pet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Not sure which animal to get? Use our smart search to find species that match your available space, experience level, and care preferences.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Filter by enclosure size you have available</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Match care level to your experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>See handling frequency, noise level, lifespan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>View detailed care requirements before committing</span>
                </li>
              </ul>
              <Link
                to="/find-animal"
                className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors text-sm mb-4"
              >
                Find your match
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Research thoroughly before getting any pet. Consider long-term costs, space requirements, and lifespan. Adopt from reputable breeders or rescues only.
                </p>
              </div>
            </div>
          </div>

          {/* Swipe indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${ 
                  activeFeatureCard === index 
                    ? index === 0 ? 'bg-blue-500' 
                      : index === 1 ? 'bg-amber-500'
                      : index === 2 ? 'bg-purple-500'
                      : 'bg-emerald-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Care Tasks Feature */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg p-8 border-2 border-blue-200 dark:border-blue-800">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Care Task Reminders
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Never miss a feeding, misting, or health check. Set up recurring care tasks with push notifications so your pet gets consistent, reliable care—even during busy weeks.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Daily, weekly, or custom schedules</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Push notifications to your phone</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Track completion history</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Manage multiple enclosures</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Reliability score tracks your care consistency</span>
              </li>
            </ul>
            <Link
              to="/blog/care-reminders-guide"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors text-sm mb-6"
            >
              Learn more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Premium feature in TESTING - requires paid subscription. Push notifications require browser permission and work best on mobile devices.
              </p>
            </div>
          </div>

          {/* Blog/Guides Feature */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg p-8 border-2 border-amber-200 dark:border-amber-800">
            <div className="w-16 h-16 bg-amber-600 dark:bg-amber-500 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              77+ Free Care Guides
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Comprehensive, species-specific guides covering everything from substrate choices to feeding schedules. Validated by keepers who actually care about your animal's wellbeing.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Complete enrichment & welfare guides</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Substrate, heating, lighting, feeding guides</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Safety warnings for common mistakes</span>
              </li>
            </ul>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors mb-4"
            >
              Browse all guides
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Guides are educational resources. Always consult with an exotic veterinarian for health concerns and verify information against multiple sources.
              </p>
            </div>
          </div>

          {/* Visual Designer Feature */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg p-8 border-2 border-purple-200 dark:border-purple-800">
            <div className="w-16 h-16 bg-purple-600 dark:bg-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Visual Layout Designer
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Drag-and-drop designer to plan your enclosure layout before you build. Visualize equipment placement, ensure proper thermal gradients, and avoid placement mistakes.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Interactive drag-and-drop canvas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Pre-sized equipment from your shopping list</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Zone overlays (basking, cooling, hides)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Export as image to reference while building</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Available after generating your plan. Works best on larger screens (tablets/desktops). Still in development—verify all equipment fits and meets safety requirements before purchasing.
              </p>
            </div>
          </div>

          {/* Animal Search Feature */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl shadow-lg p-8 border-2 border-emerald-200 dark:border-emerald-800">
            <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Find Your Perfect Pet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Not sure which animal to get? Use our smart search to find species that match your available space, experience level, and care preferences.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Filter by enclosure size you have available</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Match care level to your experience</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>See handling frequency, noise level, lifespan</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>View detailed care requirements before committing</span>
              </li>
            </ul>
            <Link
              to="/find-animal"
              className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors mb-4"
            >
              Find your match
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Research thoroughly before getting any pet. Consider long-term costs, space requirements, and lifespan. Adopt from reputable breeders or rescues only.
              </p>
            </div>
          </div>
        </div>

        {/* Color indicators for desktop */}
        <div className="hidden md:flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
          Keepers Who've Used It
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Real feedback from the White's Tree Frog community
        </p>

        {/* Mobile: Swipeable cards */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-4 -mx-4">
            {/* Testimonial 1 */}
            <div className="flex-shrink-0 w-[85%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
              <Quote className="w-8 h-8 text-emerald-500 mb-3 opacity-50" />
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "I'm new to this and it's so helpful, so thank you"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <Worm className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">AJ14</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">White's Tree Frog keeper</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="flex-shrink-0 w-[85%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <Quote className="w-8 h-8 text-blue-500 mb-3 opacity-50" />
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "I used it and it works great"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Worm className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Logan</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">White's Tree Frog keeper</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="flex-shrink-0 w-[85%] snap-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <Quote className="w-8 h-8 text-purple-500 mb-3 opacity-50" />
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "Thank you so much! This is fantastic. I also felt like this when getting a new reptile or amphibian. I'm sure plenty of people can relate to this feeling"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Worm className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">WTF Community Member</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">First-time keeper</p>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe indicators */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
            <Quote className="w-8 h-8 text-emerald-500 mb-3 opacity-50" />
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              "I'm new to this and it's so helpful, so thank you"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Worm className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">AJ14</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">White's Tree Frog keeper</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <Quote className="w-8 h-8 text-blue-500 mb-3 opacity-50" />
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              "I used it and it works great"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Worm className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Logan</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">White's Tree Frog keeper</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <Quote className="w-8 h-8 text-purple-500 mb-3 opacity-50" />
            <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
              "Thank you so much! This is fantastic. I also felt like this when getting a new reptile or amphibian. I'm sure plenty of people can relate to this feeling"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Worm className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">WTF Community Member</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">First-time keeper</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Path */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
          Ready to get started?
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Pick your starting point—we'll guide you from here
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Path 1: I Have an Animal */}
          <Link
            to="/animal"
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500 dark:hover:border-green-400 p-8 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-green-600 dark:bg-green-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Worm className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                I Already Have My Pet
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Perfect! Let's make sure they have everything they need. We'll help you design an enclosure that keeps them healthy and happy.
              </p>
              
              <div className="inline-flex items-center text-green-600 dark:text-green-400 font-semibold group-hover:translate-x-2 transition-transform">
                Let's Get Started
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Path 2: I'm Planning to Get One */}
          <Link
            to="/find-animal"
            onClick={() => window.scrollTo(0, 0)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 p-8 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                I'm Still Deciding
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Smart move! Let's find an animal that fits your space, budget, and experience level. We'll help you make the right choice.
              </p>
              
              <div className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                Help Me Choose
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Blog Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">Just want to learn more first?</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold text-lg transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Browse our free care guides
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center space-y-6 pb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          Your pet is lucky to have you—let's give them a great home <Worm className="w-10 h-10 text-green-600 dark:text-green-400" />
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Takes about 5 minutes to get your custom plan. Completely free, no sign-up required.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/animal"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
          >
            <Worm className="w-6 h-6" />
            Let's Get Started
          </Link>
          
          <Link
            to="/blog"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg border-2 border-gray-200 dark:border-gray-700"
          >
            <BookOpen className="w-6 h-6" />
            I Want to Read First
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> Always free  • 18 species (and growing!)
        </p>
      </section>
    </div>
  );
}

