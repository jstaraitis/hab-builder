import { AnimalGuides } from './AnimalGuides';

export function BlogList() {
  return (
    <div className="space-y-6">
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
