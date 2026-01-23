import { Link } from 'react-router-dom';
import type { BuildPlan, EnclosureInput } from '../../engine/types';
import { ShoppingList } from '../ShoppingList/ShoppingList';
import { SEO } from '../SEO/SEO';

interface SuppliesViewProps {
  readonly plan: BuildPlan | null;
  readonly input: EnclosureInput;
}

export function SuppliesView({ plan, input }: SuppliesViewProps) {
  if (!plan) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg p-4 space-y-2">
        <SEO title="Shopping List" description="Get your custom reptile enclosure shopping list with equipment, substrate, and decor." />
        <p className="font-semibold">No plan yet.</p>
        <p className="text-sm">Generate a plan in Design first.</p>
        <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Design</Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Shopping List & Supplies"
        description="Complete equipment shopping list for your reptile enclosure. Includes heating, lighting, substrate, and decor with build instructions."
        keywords={['reptile supplies', 'vivarium shopping list', 'enclosure equipment', 'bioactive supplies', 'reptile decor']}
      />
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shopping List</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Equipment and supplies for your enclosure</p>
        </div>
        <Link to="/plan" className="text-blue-700 dark:text-blue-400 font-medium underline">View Plan</Link>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Supporting Habitat Builder</p>
            <p>Our Amazon purchase links include an affiliate tag that helps cover server and maintenance costs. You pay the same price, and we earn a small commission to keep this tool free for the reptile community. Thank you for your support! 🦎</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Shopping List</h3>
        <ShoppingList items={plan.shoppingList} selectedTier={input.setupTier || 'recommended'} input={input} showHeader={false} affiliateTag="habitatbuil08-20" />
      </div>

      <div className="flex justify-center mt-6">
        <Link
          to="/plan"
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          Continue to Plan →
        </Link>
      </div>
    </div>
    </>
  );
}
