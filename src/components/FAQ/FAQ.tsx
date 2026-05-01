import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { SEO } from '../SEO/SEO';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  // About the Tool
  {
    category: 'About Habitat Builder',
    question: 'What is Habitat Builder?',
    answer: (
      <p>
        Habitat Builder is a free enclosure planning tool for reptile and amphibian keepers. You pick your animal,
        enter your enclosure dimensions, and the app generates a complete build plan — including a shopping list,
        layout diagram, care targets, and step-by-step setup guide.
      </p>
    ),
  },
  {
    category: 'About Habitat Builder',
    question: 'Is Habitat Builder free to use?',
    answer: (
      <p>
        The core planner — animal selection, enclosure design, shopping list, and build plan — is completely free.
        Premium features like the Care Calendar, My Animals hub, weight and health tracking, and inventory management
        require a <Link to="/premium" className="text-emerald-600 dark:text-emerald-400 underline">Premium subscription</Link>.
      </p>
    ),
  },
  {
    category: 'About Habitat Builder',
    question: 'How accurate are the recommendations?',
    answer: (
      <p>
        All recommendations are based on current husbandry best practices from the reptile-keeping community. The
        rule engine is deterministic — it uses fixed formulas for sizing, UVB coverage, substrate depth, and thermal
        gradients. We always recommend cross-referencing with our{' '}
        <Link to="/blog" className="text-emerald-600 dark:text-emerald-400 underline">species care guides</Link> and
        established keeper communities for your specific animal.
      </p>
    ),
  },
  
  // Care Tasks
  {
    category: 'Care Tasks',
    question: 'What are care tasks?',
    answer: (
      <p>
        Care tasks are scheduled reminders for recurring husbandry activities — feeding, misting, spot cleaning,
        water changes, and more. You create them once, set a frequency, and the{' '}
        <Link to="/care-calendar" className="text-emerald-600 dark:text-emerald-400 underline">Care Calendar</Link> keeps
        track of what's due so nothing gets missed. Care tasks are <strong>free for one animal and one enclosure</strong>.
        A <Link to="/premium" className="text-emerald-600 dark:text-emerald-400 underline">Premium subscription</Link> unlocks
        unlimited animals and enclosures.
      </p>
    ),
  },
  {
    category: 'Care Tasks',
    question: 'What types of tasks can I create?',
    answer: (
      <div className="space-y-2">
        <p>You can create tasks for any recurring care activity, including:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
          <li>Feeding (with optional prey type, quantity, and supplement logging)</li>
          <li>Misting / humidity maintenance</li>
          <li>Spot cleaning and full substrate changes</li>
          <li>Water changes and water quality checks</li>
          <li>Weight and length measurements</li>
          <li>Vet check-ups and health observations</li>
          <li>UVB bulb replacements and equipment checks</li>
        </ul>
      </div>
    ),
  },
  {
    category: 'Care Tasks',
    question: 'How do I set task frequency?',
    answer: (
      <p>
        When creating a task you choose how often it repeats — daily, every few days, weekly, bi-weekly, monthly,
        or a custom interval. The Care Calendar then shows upcoming and overdue tasks sorted by due date so you
        always know what needs attention today.
      </p>
    ),
  },
  {
    category: 'Care Tasks',
    question: 'Can I assign tasks to a specific animal or enclosure?',
    answer: (
      <p>
        Yes. Tasks can be linked to a specific animal in your{' '}
        <Link to="/my-animals" className="text-emerald-600 dark:text-emerald-400 underline">My Animals</Link> list
        and/or a specific enclosure. This lets you filter the calendar by pet or habitat and keep care histories
        separate for each animal.
      </p>
    ),
  },
  {
    category: 'Care Tasks',
    question: 'What happens when I complete a task?',
    answer: (
      <p>
        Completing a task logs it with a timestamp and any notes you add (e.g., how much was eaten, supplements used,
        whether the animal refused food). The log is saved to that animal's history so you can look back at patterns
        over time. The task then resets to its next due date automatically.
      </p>
    ),
  },
  {
    category: 'Care Tasks',
    question: 'Will I get reminders for overdue tasks?',
    answer: (
      <p>
        Yes — if you enable push notifications, the app will send reminders when tasks are due or overdue. You can
        manage notification preferences from your{' '}
        <Link to="/profile" className="text-emerald-600 dark:text-emerald-400 underline">Profile</Link> page.
        Notifications require a Premium account and a supported browser or the installed PWA.
      </p>
    ),
  },
  // Premium & Account
  {
    category: 'Premium & Account',
    question: 'What do I get with Premium?',
    answer: (
      <div className="space-y-2">
        <p>Premium unlocks:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
          <li>Care Calendar — task scheduling and completion tracking</li>
          <li>My Animals — health, growth, and care management hub</li>
          <li>Weight & Length Tracking with analytics</li>
          <li>Inventory management and reorder reminders</li>
          <li>Push notifications for care tasks</li>
        </ul>
        <p>
          <Link to="/premium" className="text-emerald-600 dark:text-emerald-400 underline">See all Premium features →</Link>
        </p>
      </div>
    ),
  },
  {
    category: 'Premium & Account',
    question: 'How do I cancel my subscription?',
    answer: (
      <p>
        You can manage or cancel your subscription anytime from your{' '}
        <Link to="/profile" className="text-emerald-600 dark:text-emerald-400 underline">Profile</Link> page. Cancelling
        stops future billing; you'll retain Premium access until the end of your current billing period.
      </p>
    ),
  },
];

const CATEGORIES = [...new Set(FAQ_ITEMS.map(item => item.category))];

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-800 dark:text-white pr-4">{item.question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? FAQ_ITEMS.filter(item => item.category === activeCategory)
    : FAQ_ITEMS;

  return (
    <>
      <SEO
        title="FAQ - Habitat Builder"
        description="Frequently asked questions about Habitat Builder — the reptile and amphibian enclosure planner. Learn how to use the tool, choose equipment, and care for your animals."
        keywords={['reptile enclosure faq', 'habitat builder help', 'reptile care questions', 'enclosure planning faq']}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-7 h-7" />
            <h1 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-base md:text-lg text-emerald-50">
            Answers to common questions about Habitat Builder and reptile/amphibian care.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-emerald-400'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-emerald-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Sections */}
        {CATEGORIES.filter(cat => !activeCategory || cat === activeCategory).map(cat => {
          const items = filtered.filter(item => item.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-3">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">{cat}</h2>
              <div className="space-y-2">
                {items.map(item => (
                  <FAQAccordionItem key={item.question} item={item} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Still have questions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Still have questions?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Check out our <Link to="/blog" className="text-emerald-600 dark:text-emerald-400 underline">species care guides</Link> or{' '}
            <Link to="/about" className="text-emerald-600 dark:text-emerald-400 underline">learn more about us</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
