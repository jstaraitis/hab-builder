/**
 * Generates public/sitemap.xml from the shared route list.
 *
 * The sitemap used to be maintained by hand, and had drifted: it advertised
 * /designer (a route deleted months ago), listed four pages sitting behind a
 * login wall, omitted /faq and two real blog posts, and carried a lastmod of
 * February on every URL. None of that is anyone's fault — a hand-written list
 * of 167 URLs cannot stay true. So it is generated.
 *
 * Runs automatically before every build; also `npm run generate-sitemap`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_ROUTES, ROOT, SITE, collectBlogPosts, indexableBlogPosts } from './site-routes.js';

const OUTPUT = path.join(ROOT, 'public', 'sitemap.xml');

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const lines = ['  <url>', `    <loc>${loc}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

const entries = PUBLIC_ROUTES.map((route) =>
  urlEntry({
    loc: `${SITE}${route.path}`,
    changefreq: route.changefreq,
    priority: route.priority,
  })
);

const posts = indexableBlogPosts();
const withheld = collectBlogPosts().length - posts.length;
for (const post of posts) {
  entries.push(
    urlEntry({
      loc: `${SITE}/blog/${post.id}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.7',
    })
  );
}

// No BOM: the previous file began with one, which some validators reject.
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

fs.writeFileSync(OUTPUT, xml, 'utf8');
console.log(
  `Wrote ${path.relative(ROOT, OUTPUT)}: ${entries.length} URLs ` +
    `(${PUBLIC_ROUTES.length} pages, ${posts.length} blog posts` +
    `${withheld > 0 ? `; ${withheld} unfinished posts withheld` : ''}).`
);
