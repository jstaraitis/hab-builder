import { useParams, Link, Navigate } from 'react-router-dom';
import { blogPosts, ContentBlock } from '../../data/blog';

function renderContentBlock(block: ContentBlock, index: number): JSX.Element {
  switch (block.type) {
    case 'intro':
      return (
        <p key={index} className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
          {block.text}
        </p>
      );

    case 'section':
      return (
        <div key={index} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {block.heading}
          </h2>
          <div className="space-y-4">
            {block.content?.map((subBlock, subIndex) => renderContentBlock(subBlock, subIndex))}
          </div>
        </div>
      );

    case 'text':
      return (
        <p
          key={index}
          className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: block.text || '' }}
        />
      );

    case 'list':
      return (
        <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
          {block.items?.map((item, itemIndex) => (
            <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );

    case 'warning':
      return (
        <div
          key={index}
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 p-4 rounded-r-md mb-4"
        >
          <p className="text-red-800 dark:text-red-300 font-medium" dangerouslySetInnerHTML={{ __html: block.text || '' }} />
        </div>
      );

    case 'highlight':
      return (
        <div
          key={index}
          className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-700 p-4 rounded-r-md mb-4"
        >
          <p className="text-blue-800 dark:text-blue-300 font-medium" dangerouslySetInnerHTML={{ __html: block.text || '' }} />
        </div>
      );

    case 'table':
      return (
        <div key={index} className="overflow-x-auto mb-6">
          <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {block.headers?.map((header, headerIndex) => (
                  <th
                    key={headerIndex}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <div key={index} />;
  }
}

export function BlogPost() {
  const { postId } = useParams<{ postId: string }>();
  
  if (!postId || !blogPosts[postId]) {
    return <Navigate to="/blog" replace />;
  }

  const post = blogPosts[postId];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/blog"
        className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline mb-6"
      >
        ← Back to all guides
      </Link>

      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
        <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full font-medium">
              {post.category}
            </span>
            <span>•</span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>By {post.author}</span>
          </div>

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
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {post.content.map((block, index) => renderContentBlock(block, index))}
        </div>
      </article>

      <div className="mt-8 text-center">
        <Link
          to="/blog"
          className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition-all"
        >
          ← Back to all guides
        </Link>
      </div>
    </div>
  );
}
