export type BlogStatus = 'draft' | 'in-progress' | 'review-needed' | 'community-reviewed' | 'expert-verified' | 'published';

/**
 * Statuses fit to be indexed by search engines.
 *
 * Over a third of the posts are still drafts carrying unfilled "[Add Subtitle]"
 * placeholders. They stay readable in the app, but putting them in front of
 * Google half-written would drag on how the whole site is assessed, so they
 * get a noindex tag and are left out of the sitemap.
 *
 * Kept in step with INDEXABLE_BLOG_STATUSES in scripts/site-routes.js by
 * blogStatus.test.ts — the sitemap and the meta tag disagreeing would mean
 * either advertising a noindex page or hiding a finished one.
 */
export const INDEXABLE_BLOG_STATUSES: readonly BlogStatus[] = [
  'published',
  'community-reviewed',
  'expert-verified',
];

/** Posts with no status predate the field and are treated as unfinished. */
export function isIndexableStatus(status?: BlogStatus): boolean {
  return status !== undefined && INDEXABLE_BLOG_STATUSES.includes(status);
}

export interface BlogPost {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  excerpt: string;
  description: string;
  tags: string[];
  status?: BlogStatus; // Optional for backward compatibility
  reviewedBy?: string; // Who reviewed it (for community-reviewed or expert-verified)
  relatedBlogs?: string[]; // IDs of related blog posts
  content: ContentBlock[];
}

export interface ContentBlock {
  type: 'intro' | 'section' | 'text' | 'list' | 'warning' | 'highlight' | 'table' | 'image';
  text?: string;
  heading?: string;
  content?: ContentBlock[] | string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  severity?: 'critical' | 'important' | 'tip' | 'caution';
  icon?: string;
  // Image-specific fields
  src?: string;
  srcMobile?: string; // Optional mobile-specific image source
  alt?: string;
  caption?: string;
}

// Automatically import all blog post JSON files from subdirectories (excluding templates)
const blogModules = import.meta.glob<{ default: BlogPost }>(['./**/*.json', '!./_templates/**'], { 
  eager: true
});

export const blogPosts: Record<string, BlogPost> = Object.entries(blogModules).reduce(
  (acc, [_, module]) => {
    const post = module.default;
    acc[post.id] = post;
    return acc;
  },
  {} as Record<string, BlogPost>
);

export const blogPostsList = Object.values(blogPosts).sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
