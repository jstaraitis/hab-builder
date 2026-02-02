import { Link } from 'react-router-dom';
import { Info, ArrowRight } from 'lucide-react';
import type { BuildPlan, EnclosureInput } from '../../engine/types';
import { ShoppingList } from '../ShoppingList/ShoppingList';
import { CostSummary, RecurringCosts } from '../CostSummary';
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
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shopping List & Supplies</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Everything you need to build and maintain your enclosure</p>
        </div>
        <Link to="/plan" className="text-blue-700 dark:text-blue-400 font-medium underline">View Plan</Link>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Supporting Habitat Builder</p>
            <p>Our Amazon purchase links include an affiliate tag that helps cover server and maintenance costs. You pay the same price, and we earn a small commission to keep this tool free for the reptile community. Thank you for your support!</p>
          </div>
        </div>
      </div>

      {/* Cost Estimate */}
      {plan.costEstimate && (
        <CostSummary
          costEstimate={plan.costEstimate}
          selectedTier={input.setupTier || 'recommended'}
        />
      )}

      {/* Recurring Costs Section */}
      {plan.costEstimate && (
        <RecurringCosts costEstimate={plan.costEstimate} />
      )}

      {/* Shopping List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="border-l-4 border-purple-500 pl-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Equipment & Supplies</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete list of items needed for your build</p>
        </div>
        <ShoppingList items={plan.shoppingList} selectedTier={input.setupTier || 'recommended'} input={input} showHeader={false} affiliateTag="habitatbuil08-20" />
      </div>

      <div className="flex justify-center mt-6">
        <Link
          to="/plan"
          className="group w-full lg:w-auto px-12 py-5 lg:py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg lg:text-xl rounded-xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 active:rotate-1 border-2 border-emerald-400/20 inline-flex items-center justify-center gap-2"
        >
          Continue to Plan
          <ArrowRight className="w-5 h-5 transition-transform duration-200 group-active:translate-x-1 group-active:scale-110" />
        </Link>
      </div>
    </div>
    </>
  );
}
