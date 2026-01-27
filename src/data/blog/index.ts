export interface BlogPost {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  excerpt: string;
  description: string;
  tags: string[];
  content: ContentBlock[];
}

export interface ContentBlock {
  type: 'intro' | 'section' | 'text' | 'list' | 'warning' | 'highlight' | 'table';
  text?: string;
  heading?: string;
  content?: ContentBlock[] | string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  severity?: 'important' | 'tip';
  icon?: string;
}

// Automatically import all blog post JSON files from subdirectories
const blogModules = import.meta.glob<{ default: BlogPost }>('./**/*.json', { eager: true });

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
