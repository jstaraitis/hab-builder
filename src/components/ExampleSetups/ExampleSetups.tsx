import { Star, Award, Image, CheckCircle, Lightbulb, Bug } from 'lucide-react';

interface ExampleSetupsProps {
  readonly animalType?: string;
  readonly layoutNotes?: string[];
  readonly speciesSetupTips?: string[];
}

export default function ExampleSetups({ animalType = 'tree-frog', speciesSetupTips = [] }: ExampleSetupsProps) {
  const examples = [
    {
      id: 'minimalist',
      name: 'Minimalist Setup',
      description: 'Clean, functional design with essential equipment only',
      image: `/examples/${animalType}/minimalist-setup.jpg`,
      features: ['Basic lighting', 'Simple water dish', 'Single hide', 'Minimal decor']
    },
    {
      id: 'naturalistic',
      name: 'Naturalistic Bioactive',
      description: 'Lush planted setup with live plants and cleanup crew',
      image: `/examples/${animalType}/naturalistic-setup.jpg`,
      features: ['Live plants', 'Drainage layer', 'Springtails & isopods', 'Natural branches']
    },
    {
      id: 'display',
      name: 'Display/Show Tank',
      description: 'Visually stunning setup optimized for viewing',
      image: `/examples/${animalType}/display-setup.jpg`,
      features: ['Premium lighting', 'Artistic hardscape', 'Featured plants', 'Viewing angles']
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Header Card - Improved Design */}
      <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:from-purple-900/30 dark:via-indigo-900/30 dark:to-purple-800/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Star className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-purple-900 dark:text-purple-100 mb-1.5 sm:mb-2">Example Enclosure Setups</h3>
            <p className="text-sm sm:text-base text-purple-800 dark:text-purple-200 mb-3 sm:mb-4 leading-relaxed">
              Browse personal designed enclosure layouts for inspiration. Each setup is tailored for your animal with proper care requirements.
            </p>
            
            {/* Premium Feature Callout - Redesigned */}
            <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-3 sm:p-4 border-2 border-green-200 dark:border-green-700 shadow-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 dark:bg-green-600/20 rounded-full -mr-10 -mt-10" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm sm:text-base font-bold text-green-900 dark:text-green-200">Want to create custom layouts?</span>
                </div>
                <p className="text-xs sm:text-sm text-green-800 dark:text-green-300 leading-relaxed">
                  Interactive Enclosure Designer with drag-and-drop equipment, rotation, resizing, and more is in progress!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {examples.map((example) => (
          <div
            key={example.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Image placeholder */}
            <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative">
              <div className="text-center">
                <Image className="w-12 h-12 mb-2 text-gray-600 dark:text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{example.name}</p>
              </div>
              {/* Overlay for actual image when provided */}
              <img
                src={example.image}
                alt={example.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{example.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{example.description}</p>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Key Features:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {example.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* General Setup Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5" />General Setup Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <li><strong>Start Simple:</strong> Begin with a minimalist setup and add complexity as you gain experience</li>
          <li><strong>Monitor Conditions:</strong> All setups should maintain proper humidity and temperature gradients</li>
          <li><strong>Safety First:</strong> Ensure all equipment is secured and there are no sharp edges or pinch points</li>
          <li><strong>Customization:</strong> These are starting points - adjust based on your specific animal's behavior and preferences</li>
        </ul>
      </div>

      {/* Species-Specific Setup Tips */}
      {speciesSetupTips.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2"><Bug className="w-5 h-5" />Species-Specific Tips</h4>
          <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-2">
            {speciesSetupTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
