import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import type { EnclosureInput, BuildPlan } from '../../engine/types';
import ExampleSetups from '../ExampleSetups/ExampleSetups';
import { BuildSteps } from '../BuildSteps/BuildSteps';
import { generateBuildPlanPDF } from '../../utils/pdfGenerator';
import { SEO } from '../SEO/SEO';
import { animalProfiles } from '../../data/animals';

interface PlanViewProps {
  readonly plan: BuildPlan | null;
  readonly input: EnclosureInput;
  readonly onOpenFeedback?: () => void;
}

export function PlanView({ plan, input, onOpenFeedback }: PlanViewProps) {
  const animalName = plan?.careTargets ? animalProfiles[input.animal]?.commonName || 'Reptile' : 'Reptile';
  const animalProfile = animalProfiles[input.animal];
  
  const handleDownloadPDF = () => {
    if (plan) {
      generateBuildPlanPDF(plan, input, animalName);
    }
  };
  
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
      <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Complete Build Plan</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Your step-by-step guide to building a {animalName} enclosure</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <div className="flex gap-3 justify-center sm:justify-start">
            <Link to="/supplies" className="text-blue-700 dark:text-blue-400 font-medium underline">Back to Supplies</Link>
            <Link to="/design" className="text-blue-700 dark:text-blue-400 font-medium underline">Edit Design</Link>
          </div>
        </div>
      </div>

      {/* Example Setups Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="border-l-4 border-emerald-500 pl-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Example Enclosure Setups</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-world examples to inspire your build</p>
        </div>
        <ExampleSetups animalType={input.animal} layoutNotes={plan.layout.notes} speciesSetupTips={animalProfile?.setupTips} onOpenFeedback={onOpenFeedback} />
      </div>

      {/* Build Steps Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="border-l-4 border-blue-500 pl-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Build Instructions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Follow these steps to assemble your enclosure</p>
        </div>
        <BuildSteps steps={plan.steps} showHeader={false} animalName={animalName} />
      </div>
    </div>
    </>
  );
}
