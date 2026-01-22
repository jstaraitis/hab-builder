import { SEO } from '../SEO/SEO';
import { AnimalGuides } from './AnimalGuides';

export function BlogList() {
  return (
    <div className="space-y-6">
      <SEO
        title="Care Guides & Resources"
        description="Expert guides for keeping healthy reptiles and amphibians. Learn about enclosure setup, feeding, temperature, humidity, lighting, and species-specific care."
        keywords={['reptile care guides', 'amphibian care', 'enclosure setup guide', 'reptile husbandry', 'species care guide']}
      />
      
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          📚 Care Guides & Resources
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Expert guides for keeping healthy reptiles and amphibians
        </p>
      </div>

      <AnimalGuides />
    </div>
  );
}
