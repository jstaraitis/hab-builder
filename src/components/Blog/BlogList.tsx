import { SEO } from '../SEO/SEO';
import { AnimalGuides } from './AnimalGuides';
import { BookOpen } from 'lucide-react';

interface BlogListProps {
  selectedAnimal?: string;
}

export function BlogList({ selectedAnimal }: BlogListProps) {
  return (
    <div className="space-y-6">
      <SEO
        title="Care Guides & Resources"
        description="Expert guides for keeping healthy reptiles and amphibians. Learn about enclosure setup, feeding, temperature, humidity, lighting, and species-specific care."
        keywords={['reptile care guides', 'amphibian care', 'enclosure setup guide', 'reptile husbandry', 'species care guide']}
      />
      
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          Care Guides & Resources
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Expert guides for keeping healthy reptiles and amphibians
        </p>
      </div>

      <AnimalGuides initialAnimal={selectedAnimal} />
    </div>
  );
}
