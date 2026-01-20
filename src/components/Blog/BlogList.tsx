import { Link } from 'react-router-dom';
import { blogPostsList } from '../../data/blog';
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

      <div className="grid gap-6">
        {blogPostsList.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {post.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                  <span>•</span>
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>By {post.author}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-primary-600 dark:text-primary-400 text-sm font-medium">
              Read more →
            </div>
          </Link>
        ))}
      </div>

      {blogPostsList.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No posts available yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
