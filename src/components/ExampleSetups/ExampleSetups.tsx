interface ExampleSetupsProps {
  readonly animalType?: string;
}

export default function ExampleSetups({ animalType = 'tree-frog' }: ExampleSetupsProps) {
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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">✨</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-200 mb-2">Example Enclosure Setups</h3>
            <p className="text-purple-800 dark:text-purple-300 mb-3">
              Browse personal designed enclosure layouts for inspiration. Each setup is tailored for White's Tree Frogs with proper care requirements.
            </p>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                💎 <strong>Want to create custom layouts?</strong>
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-300 mt-1">
               Interactive Enclosure Designer with drag-and-drop equipment, rotation, resizing, and more is in progress!
              </p>
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
                <div className="text-6xl mb-2">🦎</div>
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
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Setup Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <li><strong>Start Simple:</strong> Begin with a minimalist setup and add complexity as you gain experience</li>
          <li><strong>Monitor Conditions:</strong> All setups should maintain proper humidity and proper temperature</li>
          <li><strong>Safety First:</strong> Ensure all equipment is secured and there are no sharp edges or pinch points</li>
          <li><strong>Customization:</strong> These are starting points - adjust based on your specific frog's behavior and preferences</li>
        </ul>
      </div>
    </div>
  );
}
