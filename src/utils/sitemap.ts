import { animalList } from '../data/animals';
import { blogPosts } from '../data/blog';

export function generateSitemap(): string {
  const baseUrl = 'https://habitatbuilder.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/animal', priority: '1.0', changefreq: 'daily' },
    { url: '/design', priority: '0.9', changefreq: 'weekly' },
    { url: '/plan', priority: '0.9', changefreq: 'weekly' },
    { url: '/supplies', priority: '0.8', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  ];

  const animalPages = animalList.map(animal => ({
    url: `/animal?selected=${animal.id}`,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: currentDate
  }));

  const blogPages = blogPosts.map(post => ({
    url: `/blog/${post.id}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: currentDate
  }));

  const allPages = [...staticPages, ...animalPages, ...blogPages];

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  allPages.forEach(page => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
    if (page.lastmod) {
      sitemap += `    <lastmod>${page.lastmod}</lastmod>\n`;
    }
    sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${page.priority}</priority>\n`;
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>';

  return sitemap;
}

// Generate and save sitemap (run this as a build step)
export function saveSitemap() {
  const sitemap = generateSitemap();
  
  // In production build, write to public folder
  if (typeof window === 'undefined') {
    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
  }
  
  return sitemap;
}
