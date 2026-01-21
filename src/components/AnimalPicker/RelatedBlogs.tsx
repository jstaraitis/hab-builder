import { Link } from 'react-router-dom';
import { blogPosts } from '../../data/blog';

interface RelatedBlogsProps {
  blogIds: string[];
}

export function RelatedBlogs({ blogIds }: RelatedBlogsProps) {
  const blogs = blogIds
    .map(id => ({ ...blogPosts[id], id }))
    .filter(blog => blog.title); // Filter out any invalid IDs

  if (blogs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📚</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Care Guides for This Species</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Learn more about proper care with these detailed guides
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            to={`/blog/${blog.id}`}
            className="group bg-gray-50 dark:bg-gray-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700 rounded-lg p-4 transition-all"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 mb-1">
              {blog.title}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
              {blog.excerpt}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              {blog.tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
