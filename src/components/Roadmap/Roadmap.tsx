import { SEO } from '../SEO/SEO';

interface RoadmapItemProps {
  readonly title: string;
  readonly description: string;
  readonly status: 'completed' | 'in-progress' | 'planned';
  readonly priority?: 'high' | 'medium' | 'low';
  readonly eta?: string;
}

function RoadmapItem({ title, description, status, priority, eta }: RoadmapItemProps) {
  const statusColors = {
    completed: 'bg-green-100 dark:bg-green-900/20 border-green-500 dark:border-green-700',
    'in-progress': 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 dark:border-blue-700',
    planned: 'bg-gray-100 dark:bg-gray-700/20 border-gray-300 dark:border-gray-600',
  };

  const statusLabels = {
    completed: '✅ Complete',
    'in-progress': '🔄 In Progress',
    planned: '📋 Planned',
  };

  const priorityColors = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-orange-600 dark:text-orange-400',
    low: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${statusColors[status]}`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {statusLabels[status]}
          </span>
          {priority && (
            <span className={`text-xs font-medium ${priorityColors[priority]}`}>
              {priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{description}</p>
      {eta && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>ETA:</strong> {eta}
        </p>
      )}
    </div>
  );
}

interface RoadmapProps {
  readonly onOpenFeedback: () => void;
}

export function Roadmap({ onOpenFeedback }: RoadmapProps) {
  return (
    <>
      <SEO
        title="Roadmap - Habitat Builder"
        description="See what's coming next for Habitat Builder. Track new features, animal profiles, and community tools in development."
        keywords={['habitat builder roadmap', 'upcoming features', 'reptile tool updates', 'development plans']}
      />
      
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">Roadmap</h1>
          <p className="text-xl text-purple-50">
            See what we're working on and what's coming next
          </p>
        </div>

        {/* In Progress */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Currently Working On</h2>
          <div className="space-y-3">
            <RoadmapItem
              title="More Animals"
              description="Adding popular species like Crested Gecko, Leopard Gecko, Ball Python, and Corn Snake."
              status="in-progress"
              priority="high"
            />
            <RoadmapItem
              title="Better Example Setups"
              description="Expanding our library of example enclosure setups with more species and styles."
              status="in-progress"
              priority="medium"
            />
            <RoadmapItem
              title="FAQ Page"
              description="Answers to common questions about enclosure sizing, equipment choices, and bioactive setups."
              status="in-progress"
              priority="high"
            />
            <RoadmapItem
              title="Mobile Improvements"
              description="Better mobile experience and bug fixes based on user feedback."
              status="in-progress"
              priority="medium"
            />
          </div>
        </section>

        {/* Coming Soon */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Coming Soon</h2>
          <div className="space-y-3">
            <RoadmapItem
              title="Animal Directory"
              description="Browse all available animals with filters for care level, size requirements, and habitat type."
              status="planned"
              priority="high"
            />
            <RoadmapItem
              title="Cost Estimates"
              description="See approximate costs for your shopping list to better plan your budget."
              status="planned"
              priority="medium"
            />
            <RoadmapItem
              title="PDF Export"
              description="Download your complete build plan as a PDF for easy reference during setup."
              status="planned"
              priority="medium"
            />
            <RoadmapItem
              title="3D Visualizer"
              description="Interactive 3D preview of your enclosure with equipment placement and decorations."
              status="planned"
              priority="medium"
            />
            <RoadmapItem
              title="Husbandry Checklists"
              description="Daily, weekly, and monthly care checklists tailored to your specific animal and setup."
              status="planned"
              priority="medium"
            />
            <RoadmapItem
              title="Photo Gallery"
              description="Browse real enclosure setups from the community for inspiration and ideas."
              status="planned"
              priority="low"
            />
          </div>
        </section>

        {/* Community Ideas */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Considering for Future</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-500">💬</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Saved Designs:</strong> Create an account to save and compare multiple enclosure plans
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500">💬</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">DIY Builder:</strong> Plans and cut lists for building custom wood or PVC enclosures
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500">💬</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Species Comparison:</strong> Compare care requirements side-by-side when choosing between animals
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500">💬</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Climate Adjustments:</strong> Equipment recommendations based on your local climate
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500">💬</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Plant Database:</strong> Searchable list of bioactive-safe plants with care info and toxicity ratings
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Contribute */}
        <section className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Have Ideas?</h2>
          <p className="mb-4 text-emerald-50">
            This tool is built for the community. Help us make it better:
          </p>
          <ul className="space-y-2 text-emerald-50 mb-6">
            <li>• Request species you'd like to see added</li>
            <li>• Report bugs or incorrect care information</li>
            <li>• Suggest new features</li>
            <li>• Share your expertise to improve care guides</li>
          </ul>
          <button
            onClick={onOpenFeedback}
            className="inline-block px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg shadow-md hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            Send Feedback
          </button>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm pb-8">
          <p>Roadmap is updated regularly based on user feedback and priorities.</p>
        </div>
      </div>
    </>
  );
}
