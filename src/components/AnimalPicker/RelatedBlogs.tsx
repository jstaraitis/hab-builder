import { Link } from 'react-router-dom';
import { blogPosts } from '../../data/blog';
import { Book } from 'lucide-react';

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
    <div className="bg-card rounded-xl border border-divider p-4">
      <div className="flex items-center gap-2 mb-3">
        <Book className="w-6 h-6 text-secondary" />
        <h3 className="text-lg font-semibold text-white">Care Guides for This Species</h3>
      </div>
      <p className="text-sm text-muted mb-4">
        Learn more about proper care with these detailed guides
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            to={`/blog/${blog.id}`}
            className="group bg-card-elevated/50 hover:bg-jade-50 dark:hover:bg-jade-900/20 border border-divider hover:border-jade-300 dark:hover:border-jade-700 rounded-xl p-4 transition-all"
          >
            <h4 className="font-semibold text-white group-hover:text-jade-700 dark:group-hover:text-jade-300 mb-1">
              {blog.title}
            </h4>
            <p className="text-sm text-secondary mb-2 line-clamp-2">
              {blog.excerpt}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted">
              {blog.tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-card-elevated dark:bg-card-elevated text-white rounded-full">
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
