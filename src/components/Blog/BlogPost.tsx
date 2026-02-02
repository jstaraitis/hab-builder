import { useParams, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SEO } from '../SEO/SEO';
import { blogPosts, ContentBlock, BlogStatus } from '../../data/blog';
import { generateArticleStructuredData } from '../../utils/structuredData';
import { CheckCircle, Eye, Users, Award, FileText } from 'lucide-react';

function getStatusConfig(status?: BlogStatus) {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        icon: FileText,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-300 dark:border-gray-600',
        message: 'This article is in draft form and has not been reviewed. Information may be incomplete or unverified.'
      };
    case 'in-progress':
      return {
        label: 'In Progress',
        icon: FileText,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-800 dark:text-blue-200',
        borderColor: 'border-blue-300 dark:border-blue-700',
        message: 'This article is actively being written and edited. Content may change significantly.'
      };
    case 'review-needed':
      return {
        label: 'Review Needed',
        icon: Eye,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-800 dark:text-amber-200',
        borderColor: 'border-amber-400 dark:border-amber-600',
        message: 'This article is awaiting expert review. Information should be verified with additional sources.'
      };
    case 'community-reviewed':
      return {
        label: 'Community Reviewed',
        icon: Users,
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-800 dark:text-purple-200',
        borderColor: 'border-purple-400 dark:border-purple-600',
        message: 'This article has been reviewed by experienced keepers in the community.'
      };
    case 'expert-verified':
      return {
        label: 'Expert Verified',
        icon: Award,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-200',
        borderColor: 'border-green-500 dark:border-green-600',
        message: 'This article has been verified by a reptile veterinarian or certified expert.'
      };
    case 'published':
      return {
        label: 'Published',
        icon: CheckCircle,
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-800 dark:text-emerald-200',
        borderColor: 'border-emerald-500 dark:border-emerald-600',
        message: 'This article has been reviewed and approved for general guidance.'
      };
    default:
      return null;
  }
}

function renderContentBlock(block: ContentBlock, index: number): JSX.Element {
  switch (block.type) {
    case 'intro':
      return (
        <div key={index} className="rounded-xl p-6 mb-8 border-l-8 border-green-600 shadow-lg bg-green-600/5 dark:bg-green-600/10">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
            {block.text || (typeof block.content === 'string' ? block.content : '')}
          </p>
        </div>
      );

    case 'section':
      return (
        <div key={index} className="mt-10 mb-6 first:mt-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-3 border-b-2 border-green-500">
            {block.heading || ''}
          </h2>
          {block.content && Array.isArray(block.content) && (
            <div className="space-y-4">
              {block.content.map((nestedBlock, nestedIndex) => 
                renderContentBlock(nestedBlock, typeof index === 'number' ? index * 1000 + nestedIndex : nestedIndex)
              )}
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div key={index} className="mb-5">
          <p
            className="text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (block.text || block.content || '') as string }}
          />
        </div>
      );

    case 'list':
      return (
        <div key={index} className="rounded-xl p-5 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="space-y-1.5">
            {block.items?.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 flex-shrink-0 mt-2" />
                <span
                  className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1"
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              </div>
            ))}
          </div>
        </div>
      );

    case 'warning':
      const isCritical = block.severity === 'critical';
      const isImportant = block.severity === 'important';
      const isTip = block.severity === 'tip';
      const warningBg = isCritical 
        ? 'bg-red-50 dark:bg-red-900/20' 
        : isImportant 
          ? 'bg-orange-50 dark:bg-orange-900/20' 
          : isTip 
            ? 'bg-emerald-50 dark:bg-emerald-900/20' 
            : 'bg-yellow-50 dark:bg-yellow-900/20';
      const warningBorder = isCritical 
        ? 'border-red-500' 
        : isImportant 
          ? 'border-orange-500' 
          : isTip 
            ? 'border-emerald-500' 
            : 'border-yellow-500';
      const warningText = isCritical 
        ? 'text-red-800 dark:text-red-300' 
        : isImportant 
          ? 'text-orange-800 dark:text-orange-300' 
          : isTip 
            ? 'text-emerald-800 dark:text-emerald-300' 
            : 'text-yellow-800 dark:text-yellow-300';
      return (
        <div
          key={index}
          className={`${warningBg} border-l-4 ${warningBorder} p-5 rounded-xl mb-6 shadow-sm`}
        >
          <p className={`${warningText} font-medium leading-relaxed`}>
            <span dangerouslySetInnerHTML={{ __html: (block.text || block.content || '') as string }} />
          </p>
        </div>
      );

    case 'highlight':
      return (
        <div
          key={index}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-600 p-6 rounded-xl mb-6 shadow-sm"
        >
          <p className="text-green-800 dark:text-green-300 font-medium leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: typeof block.content === 'string' ? block.content : '' }} />
          </p>
        </div>
      );

    case 'table':
      return (
        <div key={index} className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <tr>
                  {block.headers?.map((header, headerIndex) => (
                    <th
                      key={headerIndex}
                      className="px-6 py-4 text-left text-sm font-bold text-green-800 dark:text-green-300 border-b-2 border-green-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {block.rows?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Swipeable Card View */}
          <div className="md:hidden">
            <div className="overflow-x-auto snap-x snap-mandatory flex gap-1 pb-1 px-4 -mx-4 scrollbar-hide">
              {block.rows?.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="snap-center flex-shrink-0 w-[80vw] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-md first:ml-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">
                      {rowIndex + 1} of {block.rows?.length}
                    </span>
                  </div>
                  {row.map((cell, cellIndex) => (
                    <div key={cellIndex} className="mb-3 last:mb-0">
                      <div className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                        {block.headers?.[cellIndex]}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white leading-relaxed">
                        {cell}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-1">
              {block.rows?.map((_, idx) => (
                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return <div key={index} />;
  }
}

export function BlogPost() {
  const { postId } = useParams<{ postId: string }>();
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollableHeight = documentHeight - windowHeight;
      const progress = (scrollTop / scrollableHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  if (!postId || !blogPosts[postId]) {
    return <Navigate to="/blog" replace />;
  }

  const post = blogPosts[postId];

  const structuredData = generateArticleStructuredData(
    post.title,
    post.description,
    post.date,
    post.date,
    post.author
  );

  return (
    <div className="max-w-4xl mx-auto px-2 py-4 md:px-4 md:py-8">
      {/* Mobile Reading Progress Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <SEO
        title={post.title}
        description={post.description}
        structuredData={structuredData}
      />

      <Link
        to="/blog"
        className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium mb-6 transition-colors"
      >
        ← Back to Blog
      </Link>

      <article className="rounded-2xl shadow-lg p-4 md:p-10 border border-gray-200 dark:border-gray-700">
        {/* Status Banner */}
        {post.status && post.status !== 'published' && (() => {
          const statusConfig = getStatusConfig(post.status);
          if (!statusConfig) return null;
          const StatusIcon = statusConfig.icon;
          
          return (
            <div className={`${statusConfig.bgColor} border-l-4 ${statusConfig.borderColor} p-4 mb-6 rounded-r-lg`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-5 h-5 ${statusConfig.textColor} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className={`font-semibold ${statusConfig.textColor} mb-1`}>
                    {statusConfig.label}
                    {post.reviewedBy && (post.status === 'community-reviewed' || post.status === 'expert-verified') && (
                      <span className="font-normal"> by {post.reviewedBy}</span>
                    )}
                  </p>
                  <p className={`text-sm ${statusConfig.textColor} opacity-90`}>
                    {statusConfig.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        <header className="mb-10 pb-8 border-b-2 border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
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
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs"
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
          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all"
        >
          ← Back to all guides
        </Link>
      </div>
    </div>
  );
}
