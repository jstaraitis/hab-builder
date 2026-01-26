import { useState } from 'react';
import { animalProfiles } from '../../data/animals';
import { blogPosts } from '../../data/blog';
import { Link } from 'react-router-dom';

interface AnimalGuidesProps {
  initialAnimal?: string;
}

export function AnimalGuides({ initialAnimal }: AnimalGuidesProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(initialAnimal || null);
  const animals = Object.values(animalProfiles);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Browse Care Guides by Animal</h2>
      <div className="flex flex-wrap gap-4 mb-6">
        {animals.map((animal) => (
          <button
            key={animal.id}
            onClick={() => setSelectedAnimal(animal.id)}
            className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all flex items-center gap-2 ${
              selectedAnimal === animal.id
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            {animal.id === "whites-tree-frog" && <span className="text-2xl"></span>}
            {animal.commonName}
          </button>
        ))}
      </div>
      <div className="border-t border-gray-300 dark:border-gray-700 my-8"></div>
      {selectedAnimal && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Guides for {animals.find(a => a.id === selectedAnimal)?.commonName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {animals.find(a => a.id === selectedAnimal)?.relatedBlogs?.map((blogId) => {
              const blog = blogPosts[blogId];
              if (!blog) return null;
              return (
                <Link
                  key={blogId}
                  to={`/blog/${blogId}`}
                  className="group bg-gray-50 dark:bg-gray-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700 rounded-lg p-4 transition-all"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 mb-1">
                    {blog.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    {blog.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
