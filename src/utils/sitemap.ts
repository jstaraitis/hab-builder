/**
 * Sitemap generation utilities
 * This file provides helpers to generate XML sitemaps for SEO
 */

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate XML sitemap from entries
 */
export function generateSitemapXML(entries: SitemapEntry[]): string {
  const baseUrl = 'https://habitat-builder.com';
  
  const urlEntries = entries
    .map(entry => {
      const loc = entry.loc.startsWith('http') ? entry.loc : `${baseUrl}${entry.loc}`;
      let xml = `  <url>\n    <loc>${escapeXML(loc)}</loc>`;
      
      if (entry.lastmod) {
        xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
      }
      
      if (entry.changefreq) {
        xml += `\n    <changefreq>${entry.changefreq}</changefreq>`;
      }
      
      if (entry.priority !== undefined) {
        xml += `\n    <priority>${entry.priority.toFixed(1)}</priority>`;
      }
      
      xml += '\n  </url>';
      return xml;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate sitemap index for large sitemaps
 */
export function generateSitemapIndexXML(sitemaps: string[]): string {
  const baseUrl = 'https://habitat-builder.com';
  
  const sitemapEntries = sitemaps
    .map(sitemap => {
      const loc = sitemap.startsWith('http') ? sitemap : `${baseUrl}${sitemap}`;
      return `  <sitemap>\n    <loc>${escapeXML(loc)}</loc>\n  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

/**
 * Generate default sitemap entries for static pages
 */
export function getDefaultSitemapEntries(): SitemapEntry[] {
  const today = new Date().toISOString().split('T')[0];
  
  return [
    {
      loc: '/',
      lastmod: today,
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      loc: '/animal',
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: '/find-animal',
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: '/design',
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: '/plan',
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: '/supplies',
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: '/designer',
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: '/blog',
      lastmod: today,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: '/about',
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      loc: '/roadmap',
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.5
    }
  ];
}

/**
 * Generate sitemap entries for animal guides
 */
export function getAnimalSitemapEntries(animals: string[]): SitemapEntry[] {
  const today = new Date().toISOString().split('T')[0];
  
  return animals.map(animal => ({
    loc: `/animal/${animal}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: 0.7
  }));
}

/**
 * Generate sitemap entries for blog posts
 */
export function getBlogSitemapEntries(
  posts: Array<{
    slug: string;
    lastmod?: string;
  }>
): SitemapEntry[] {
  const today = new Date().toISOString().split('T')[0];
  
  return posts.map(post => ({
    loc: `/blog/${post.slug}`,
    lastmod: post.lastmod || today,
    changefreq: 'monthly',
    priority: 0.6
  }));
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };
  return str.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(sitemapUrl: string = 'https://habitatbuilder.com/sitemap.xml'): string {
  return `User-agent: *
Allow: /
Disallow: /dev/
Disallow: /admin/

Sitemap: ${sitemapUrl}`;
}
