import feedingGuide from './whites-tree-frog-feeding-guide.json';
import tempHumidityGuide from './whites-tree-frog-temp-humidity-guide.json';
import uvbLightingGuide from './whites-tree-frog-uvb-lighting-guide.json';
import enclosureSizingGuide from './whites-tree-frog-enclosure-sizing-guide.json';
import hydrationWaterGuide from './whites-tree-frog-hydration-water-guide.json';
import enrichmentWelfareGuide from './whites-tree-frog-enrichment-welfare-guide.json';

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
  content?: ContentBlock[];
  items?: string[];
  headers?: string[];
  rows?: string[][];
}

export const blogPosts: Record<string, BlogPost> = {
  'whites-tree-frog-feeding-guide': feedingGuide as BlogPost,
  'whites-tree-frog-temp-humidity-guide': tempHumidityGuide as BlogPost,
  'whites-tree-frog-uvb-lighting-guide': uvbLightingGuide as BlogPost,
  'whites-tree-frog-enclosure-sizing-guide': enclosureSizingGuide as BlogPost,
  'whites-tree-frog-hydration-water-guide': hydrationWaterGuide as BlogPost,
  'whites-tree-frog-enrichment-welfare-guide': enrichmentWelfareGuide as BlogPost,
};

export const blogPostsList = Object.values(blogPosts).sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
