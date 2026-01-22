import { Link } from 'react-router-dom';
import type { BuildPlan } from '../../engine/types';
import { ShoppingList } from '../ShoppingList/ShoppingList';
import { BuildSteps } from '../BuildSteps/BuildSteps';
import { SEO } from '../SEO/SEO';

interface SuppliesViewProps {
  readonly plan: BuildPlan | null;
}

export function SuppliesView({ plan }: SuppliesViewProps) {
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Supplies & Steps</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Shopping list and build steps for your enclosure</p>
        </div>
        <Link to="/plan" className="text-blue-700 dark:text-blue-400 font-medium underline">View Plan</Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Shopping List</h3>
        <ShoppingList items={plan.shoppingList} showHeader={false} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Build Steps</h3>
        <BuildSteps steps={plan.steps} showHeader={false} />
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
