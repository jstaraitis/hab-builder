import feedingGuide from './feeding-guide.json';
import tempHumidityGuide from './temp-humidity-guide.json';
import uvbLightingGuide from './uvb-lighting-guide.json';
import enclosureSizingGuide from './enclosure-sizing-guide.json';
import hydrationWaterGuide from './hydration-water-guide.json';
import enrichmentWelfareGuide from './enrichment-welfare-guide.json';

export interface BlogPost {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  excerpt: string;
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
  'feeding-guide': feedingGuide as BlogPost,
  'temp-humidity-guide': tempHumidityGuide as BlogPost,
  'uvb-lighting-guide': uvbLightingGuide as BlogPost,
  'enclosure-sizing-guide': enclosureSizingGuide as BlogPost,
  'hydration-water-guide': hydrationWaterGuide as BlogPost,
  'enrichment-welfare-guide': enrichmentWelfareGuide as BlogPost,
};

export const blogPostsList = Object.values(blogPosts).sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
