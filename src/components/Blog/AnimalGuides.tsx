import { useState } from 'react';
import { animalProfiles } from '../../data/animals';
import { blogPosts, blogPostsList } from '../../data/blog';
import { Link } from 'react-router-dom';
import { Book } from 'lucide-react';

interface AnimalGuidesProps {
  initialAnimal?: string;
}

export function AnimalGuides({ initialAnimal }: AnimalGuidesProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(initialAnimal || null);
  const animals = Object.values(animalProfiles);

  // Get all animal-specific blog IDs
  const animalSpecificBlogIds = new Set(
    animals.flatMap(animal => animal.relatedBlogs || [])
  );

  // Filter for general guides (not in any animal's relatedBlogs)
  const generalGuides = blogPostsList.filter(blog => !animalSpecificBlogIds.has(blog.id));

  return (
    <div className="space-y-6">
      {/* General Guides Section */}
      {generalGuides.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            General Care Guides
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Universal guides applicable to multiple species
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalGuides.map((blog) => (
              <Link
                key={blog.id}
                to={`/blog/${blog.id}`}
                className="group bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 rounded-lg p-4 transition-all shadow-sm hover:shadow-md"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 mb-1">
                  {blog.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {blog.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  {blog.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg shadow-md border border-emerald-200 dark:border-emerald-800 p-6">
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
                  className="group bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-lg p-4 transition-all shadow-sm hover:shadow-md"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 mb-1">
                    {blog.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    {blog.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
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
