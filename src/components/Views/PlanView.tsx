import { Link } from 'react-router-dom';
import { Download, Lightbulb, Bug } from 'lucide-react';
import type { EnclosureInput, BuildPlan } from '../../engine/types';
import { BuildSteps } from '../BuildSteps/BuildSteps';
import { generateBuildPlanPDF } from '../../utils/pdfGenerator';
import { SEO } from '../SEO/SEO';
import { animalProfiles } from '../../data/animals';

interface PlanViewProps {
  readonly plan: BuildPlan | null;
  readonly input: EnclosureInput;
}

export function PlanView({ plan, input }: PlanViewProps) {
  const animalName = plan?.careTargets ? animalProfiles[input.animal]?.commonName || 'Reptile' : 'Reptile';
  const animalProfile = animalProfiles[input.animal];
  const generalSetupTips = [
    'Start simple and add complexity as you gain experience.',
    'Monitor humidity and temperature gradients closely.',
    'Secure equipment and remove sharp edges or pinch points.',
    'Use the plan zones as anchors for hides, basking, and water areas.'
  ];
  
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Example Enclosure Setups</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Curated reference builds to visualize layout and equipment placement</p>
          </div>
          <Link
            to="/blog/example-enclosure-setups"
            className="text-emerald-700 dark:text-emerald-400 font-medium underline"
          >
            View the example setups blog
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-blue-200/70 dark:border-blue-700/60 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-gray-900/20 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-2 text-blue-700 dark:text-blue-300">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-blue-900 dark:text-blue-200">General Setup Tips</h4>
              <p className="text-xs sm:text-sm text-blue-800/80 dark:text-blue-300/80">Modern best practices that apply to any build.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {generalSetupTips.map((tip) => (
              <div
                key={tip}
                className="rounded-lg border border-blue-200/70 dark:border-blue-800/60 bg-white/80 dark:bg-gray-900/30 px-3 py-2 text-sm text-blue-900 dark:text-blue-200"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>

        {animalProfile?.setupTips?.length ? (
          <div className="rounded-xl border border-purple-200/70 dark:border-purple-700/60 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-900/20 dark:to-gray-900/20 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-2 text-purple-700 dark:text-purple-300">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-purple-900 dark:text-purple-200">Species-Specific Tips</h4>
                <p className="text-xs sm:text-sm text-purple-800/80 dark:text-purple-300/80">Targeted guidance for {animalName}.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {animalProfile.setupTips.map((tip) => (
                <div
                  key={tip}
                  className="rounded-lg border border-purple-200/70 dark:border-purple-800/60 bg-white/80 dark:bg-gray-900/30 px-3 py-2 text-sm text-purple-900 dark:text-purple-200"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Build Steps Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="border-l-4 border-blue-500 pl-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Build Instructions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Follow these steps to assemble your enclosure</p>
        </div>
        <BuildSteps steps={plan.steps} showHeader={false} animalName={animalName} />
      </div>

      <div className="rounded-lg border border-emerald-200/70 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-900/20 p-4 text-sm text-emerald-900 dark:text-emerald-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            If you want a little extra reassurance, premium includes care reminders to help you stay on track.
          </p>
          <Link
            to="/premium"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Explore premium
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
