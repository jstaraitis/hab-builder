import { Link } from 'react-router-dom';
import type { EnclosureInput, BuildPlan } from '../../engine/types';
import ExampleSetups from '../ExampleSetups/ExampleSetups';
import { SEO } from '../SEO/SEO';
import { animalProfiles } from '../../data/animals';

interface PlanViewProps {
  readonly plan: BuildPlan | null;
  readonly input: EnclosureInput;
}

export function PlanView({ plan, input }: PlanViewProps) {
  const animalName = plan?.careTargets ? animalProfiles[input.animal]?.commonName || 'Reptile' : 'Reptile';
  
  if (!plan) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-lg p-4 space-y-2">
        <SEO title="Build Plan" description="Generate your custom reptile enclosure build plan with step-by-step instructions." />
        <p className="font-semibold">No plan yet.</p>
        <p className="text-sm">Generate a plan in Design first.</p>
        <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Design</Link>
      </div>
    );
  }
  
  return (
    <>
      <SEO
        title={`${animalName} Build Plan & Instructions`}
        description={`Complete ${animalName} enclosure build plan with step-by-step instructions, equipment list, and care parameters. ${input.width}x${input.depth}x${input.height}" ${input.bioactive ? 'bioactive' : 'standard'} setup.`}
        keywords={[`${animalName.toLowerCase()} build guide`, 'enclosure instructions', 'vivarium setup', 'habitat build steps', 'reptile shopping list']}
      />
      <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Plan</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Layout preview and example setups</p>
        </div>
        <div className="flex gap-3">
          <Link to="/supplies" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Supplies</Link>
          <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Edit Design</Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Example Enclosure Setups</h3>
        <ExampleSetups animalType={input.animal} />
      </div>

      {plan.layout.notes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Layout Notes</h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
              {plan.layout.notes.map((note) => (
                <li key={`layout-${note.substring(0, 30)}`}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
