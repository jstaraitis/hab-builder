import { useState } from 'react';
import { animalProfiles } from '../../data/animals';
import { blogPosts, blogPostsList, BlogStatus } from '../../data/blog';
import { Link } from 'react-router-dom';
import { Book, ChevronDown, FileText, AlertTriangle, Eye, Users, Award, Star } from 'lucide-react';

interface AnimalGuidesProps {
  initialAnimal?: string;
}

function getStatusBadge(status?: BlogStatus) {
  if (!status || status === 'published') return null;

  const configs = {
    'draft': { 
      icon: FileText, 
      bgColor: 'bg-gray-100 dark:bg-gray-700', 
      textColor: 'text-gray-700 dark:text-gray-300',
      label: 'Draft'
    },
    'in-progress': { 
      icon: AlertTriangle, 
      bgColor: 'bg-blue-100 dark:bg-blue-900/50', 
      textColor: 'text-blue-700 dark:text-blue-300',
      label: 'In Progress'
    },
    'review-needed': { 
      icon: Eye, 
      bgColor: 'bg-amber-100 dark:bg-amber-900/50', 
      textColor: 'text-amber-700 dark:text-amber-300',
      label: 'Needs Review'
    },
    'community-reviewed': { 
      icon: Users, 
      bgColor: 'bg-purple-100 dark:bg-purple-900/50', 
      textColor: 'text-purple-700 dark:text-purple-300',
      label: 'Community Reviewed'
    },
    'expert-verified': { 
      icon: Award, 
      bgColor: 'bg-green-100 dark:bg-green-900/50', 
      textColor: 'text-green-700 dark:text-green-300',
      label: 'Expert Verified'
    }
  };

  const config = configs[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
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
  
  // Separate featured and non-featured guides
  const featuredGuides = generalGuides.filter((blog: any) => blog.featured);
  const regularGuides = generalGuides.filter((blog: any) => !blog.featured);

  return (
    <div className="space-y-6">
      {/* General Guides Section */}
      {generalGuides.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md border border-blue-200 dark:border-blue-800 p-3 sm:p-4 lg:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <Book className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            General Care Guides
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            Universal guides applicable to multiple species
          </p>
          
          {/* Featured Guides */}
          {featuredGuides.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Featured
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 mb-4">
                {featuredGuides.map((blog) => (
                  <Link
                    key={blog.id}
                    to={`/blog/${blog.id}`}
                    className="group relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/50 dark:hover:to-yellow-900/30 border-2 border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600 rounded-lg p-3 sm:p-4 transition-all shadow-md hover:shadow-lg"
                  >
                    <div className="absolute -top-2 -right-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                      </span>
                    </div>
                    {getStatusBadge(blog.status) && (
                      <div className="mb-2">
                        {getStatusBadge(blog.status)}
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 mb-1">
                      {blog.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      {blog.tags?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Regular Guides */}
          {regularGuides.length > 0 && (
            <div>
              {featuredGuides.length > 0 && (
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">All Guides</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
                {regularGuides.map((blog) => (
                  <Link
                    key={blog.id}
                    to={`/blog/${blog.id}`}
                    className="group bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 rounded-lg p-3 sm:p-4 transition-all shadow-sm hover:shadow-md"
                  >
                    {getStatusBadge(blog.status) && (
                      <div className="mb-2">
                        {getStatusBadge(blog.status)}
                      </div>
                    )}
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
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Browse Care Guides by Animal</h2>
        
        {/* Mobile Dropdown */}
        <div className="relative sm:hidden">
          <select
            value={selectedAnimal || ''}
            onChange={(e) => setSelectedAnimal(e.target.value || null)}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none text-gray-900 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">Select an animal...</option>
            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.commonName}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Desktop/Tablet Button Grid */}
        <div className="hidden sm:flex flex-wrap gap-2.5 lg:gap-3">
          {animals.map((animal) => (
            <button
              key={animal.id}
              onClick={() => setSelectedAnimal(animal.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold border-2 transition-all ${
                selectedAnimal === animal.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg text-emerald-700 dark:text-emerald-300 scale-105'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:scale-105'
              }`}
            >
              {animal.commonName}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-300 dark:border-gray-700 my-6"></div>
      {selectedAnimal && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg shadow-md border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Guides for {animals.find(a => a.id === selectedAnimal)?.commonName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
            {animals.find(a => a.id === selectedAnimal)?.relatedBlogs?.map((blogId) => {
              const blog = blogPosts[blogId];
              if (!blog) return null;
              return (
                <Link
                  key={blogId}
                  to={`/blog/${blogId}`}
                  className="group bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-lg p-3 sm:p-4 transition-all shadow-sm hover:shadow-md"
                >
                  {getStatusBadge(blog.status) && (
                    <div className="mb-2">
                      {getStatusBadge(blog.status)}
                    </div>
                  )}
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
