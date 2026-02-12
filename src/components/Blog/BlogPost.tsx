import { useParams, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { SEO } from '../SEO/SEO';
import { blogPosts, ContentBlock } from '../../data/blog';
import { generateArticleStructuredData } from '../../utils/structuredData';
import { 
  Clock, Award, ArrowRight, 
  CheckCircle, AlertTriangle, Info, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react';

// Calculate estimated reading time
function calculateReadingTime(content: ContentBlock[]): number {
  let wordCount = 0;
  const countWords = (text: string): number => {
    return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  };
  const processBlock = (block: ContentBlock) => {
    if (block.text) wordCount += countWords(block.text);
    if (typeof block.content === 'string') wordCount += countWords(block.content);
    if (block.items) block.items.forEach(item => wordCount += countWords(item));
    if (Array.isArray(block.content)) block.content.forEach(processBlock);
    if (block.rows) block.rows.forEach(row => row.forEach(cell => wordCount += countWords(cell)));
  };
  content.forEach(processBlock);
  return Math.ceil(wordCount / 200);
}

// Mobile table accordion component
function MobileTableAccordion({ headers, rows, index }: Readonly<{ headers?: string[]; rows?: string[][]; index: number }>) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (rowIndex: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  return (
    <div className="md:hidden space-y-3">
      {rows?.map((row, rowIndex) => {
        const isExpanded = expandedRows.has(rowIndex);
        const [firstCell, ...restCells] = row;

        return (
          <div
            key={`${index}-accordion-${rowIndex}`}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >
            {/* Collapsed header showing first column */}
            <button
              onClick={() => toggleRow(rowIndex)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {rowIndex + 1}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                    {headers?.[0]}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {firstCell}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              )}
            </button>

            {/* Expanded content showing remaining columns */}
            {isExpanded && restCells.length > 0 && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                {restCells.map((cell, cellIndex) => (
                  <div key={`${index}-detail-${rowIndex}-${cellIndex}`}>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      {headers?.[cellIndex + 1]}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white leading-relaxed">
                      {cell}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple content renderer
function renderBlock(block: ContentBlock, index: number): JSX.Element {
  switch (block.type) {
    case 'intro':
      return (
        <div
          key={index}
          className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-l-4 border-emerald-600 p-6 rounded-xl mb-12"
        >
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
            {block.text || (typeof block.content === 'string' ? block.content : '')}
          </p>
        </div>
      );

    case 'section': {
      return (
        <div key={index}>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-20 first:mt-0 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-emerald-600 to-green-600 rounded-full"></span>
            {block.heading || ''}
          </h2>
          {block.content && Array.isArray(block.content) && (
            <div className="space-y-6">
              {block.content.map((nestedBlock, nestedIndex) =>
                renderBlock(nestedBlock, index * 1000 + nestedIndex)
              )}
            </div>
          )}
        </div>
      );
    }

    case 'text':
      const textContent = (block.text || block.content || '') as string;
      const hasHeading = textContent.includes("class='text-base font-semibold") || textContent.includes("class='font-semibold'");
      
      return (
        <div key={index} className={hasHeading ? "mb-6 mt-16" : "mb-6"}>
          <p
            className="text-gray-700 dark:text-gray-300 leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        </div>
      );

    case 'list':
      return (
        <div key={index} className="mb-8">
          <ul className="space-y-3">
            {block.items?.map((item, itemIndex) => (
              <li key={`${index}-${itemIndex}`} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span
                  className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1"
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              </li>
            ))}
          </ul>
        </div>
      );

    case 'warning': {
      const isCritical = block.severity === 'critical';
      const isImportant = block.severity === 'important';
      const isTip = block.severity === 'tip';
      
      let bgColor, borderColor, textColor, icon;
      
      if (isCritical) {
        bgColor = 'bg-red-50 dark:bg-red-900/20';
        borderColor = 'border-red-500';
        textColor = 'text-red-900 dark:text-red-200';
        icon = <AlertTriangle className="w-6 h-6" />;
      } else if (isImportant) {
        bgColor = 'bg-orange-50 dark:bg-orange-900/20';
        borderColor = 'border-orange-500';
        textColor = 'text-orange-900 dark:text-orange-200';
        icon = <AlertTriangle className="w-6 h-6" />;
      } else if (isTip) {
        bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
        borderColor = 'border-emerald-500';
        textColor = 'text-emerald-900 dark:text-emerald-200';
        icon = <Lightbulb className="w-6 h-6" />;
      } else {
        bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
        borderColor = 'border-yellow-500';
        textColor = 'text-yellow-900 dark:text-yellow-200';
        icon = <Info className="w-6 h-6" />;
      }

      return (
        <div
          key={index}
          className={`${bgColor} border-l-4 ${borderColor} p-5 rounded-xl mb-12 flex items-start gap-4`}
        >
          <div className={textColor}>{icon}</div>
          <p className={`${textColor} font-medium leading-relaxed flex-1`}>
            <span dangerouslySetInnerHTML={{ __html: (block.text || block.content || '') as string }} />
          </p>
        </div>
      );
    }

    case 'highlight':
      return (
        <div
          key={index}
          className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-l-4 border-emerald-600 p-6 rounded-xl mb-12"
        >
          <p className="text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: typeof block.content === 'string' ? block.content : '' }} />
          </p>
        </div>
      );

    case 'table':
      return (
        <div key={index} className="mb-10">
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {block.headers?.map((header, headerIndex) => (
                      <th
                        key={`${index}-header-${headerIndex}`}
                        className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {block.rows?.map((row, rowIndex) => (
                    <tr key={`${index}-row-${rowIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${index}-cell-${rowIndex}-${cellIndex}`}
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
          </div>

          {/* Mobile accordion cards */}
          <MobileTableAccordion headers={block.headers} rows={block.rows} index={index} />
        </div>
      );

    case 'image':
      return (
        <div key={index} className="mb-10">
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={block.src || ''}
              alt={block.alt || ''}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          {block.caption && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-3 italic">
              {block.caption}
            </p>
          )}
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
  const readingTime = calculateReadingTime(post.content);

  const structuredData = generateArticleStructuredData(
    post.title,
    post.description,
    post.date,
    post.date,
    post.author
  );

  // Get related posts
  const relatedPosts = post.relatedBlogs
    ?.map(id => blogPosts[id])
    .filter(Boolean)
    .slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title={post.title}
        description={post.description}
        structuredData={structuredData}
      />

      {/* Hero Recipe Card */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link
              to="/blog"
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              ← All Guides
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>

          {/* Status badge */}
          {post.status && post.status !== 'published' && (() => {
            let statusLabel = 'In Progress';
            if (post.status === 'community-reviewed') statusLabel = 'Community Reviewed';
            if (post.status === 'expert-verified') statusLabel = 'Expert Verified';
            return (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                <span>{statusLabel}</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-10">
          {post.content.map((block, index) => renderBlock(block, index))}
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-md"
                >
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-2 line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Read more
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
