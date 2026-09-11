/**
 * The list of publicly indexable URLs, in one place.
 *
 * Both the sitemap generator and the prerenderer read from here. They used to
 * be at risk of the same drift that made the hand-written sitemap wrong for
 * months: a page listed in one and missing from the other means either an
 * unindexed page or a sitemap entry pointing at an empty shell.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://habitat-builder.com';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Public pages worth indexing, listed explicitly rather than discovered from
 * the router. Most routes in this app are either behind a login, behind the
 * paywall, or a step in a flow that renders nothing useful when opened cold —
 * an allowlist fails closed, which is the right direction to fail.
 *
 * Deliberately excluded and why:
 *   /design /plan /supplies /find-animal/results
 *     Depend on planner state. Visited cold they render a stub telling you to
 *     pick an animal first, which is thin content, not a page.
 *   /upgrade /profile /dashboard /health /my-animals /care-calendar /inventory
 *   /feeder-colonies /cost-of-keeping /sitter-sheet
 *     Gated. A crawler sees a login wall.
 *   /dev/* /owner-dashboard/*
 *     Internal.
 */
export const PUBLIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/animal', priority: '0.9', changefreq: 'weekly' },
  { path: '/find-animal', priority: '0.9', changefreq: 'monthly' },
  { path: '/blog', priority: '0.9', changefreq: 'weekly' },
  { path: '/premium', priority: '0.8', changefreq: 'monthly' },
  { path: '/faq', priority: '0.8', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/whats-new', priority: '0.5', changefreq: 'monthly' },
  { path: '/install', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
];

/**
 * Statuses fit to be indexed.
 *
 * 56 of the 135 posts are still `draft` and carry unfilled "[Add Subtitle]"
 * placeholders. They have always been listed in the app, but were invisible to
 * search because nothing was prerendered. Publishing them now would put 41% of
 * the blog in front of Google half-written, which drags on how the whole site
 * is assessed — so they are prerendered (the pages should still work and be
 * fast) but marked noindex and left out of the sitemap.
 *
 * Kept in step with INDEXABLE_BLOG_STATUSES in src/data/blog/index.ts by
 * src/data/blog/blogStatus.test.ts.
 */
export const INDEXABLE_BLOG_STATUSES = ['published', 'community-reviewed', 'expert-verified'];

const BLOG_DIR = path.join(ROOT, 'src', 'data', 'blog');

function readJson(file) {
  // Several of these files carry a UTF-8 BOM, which JSON.parse refuses.
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Templates are placeholder content, excluded from the app's own glob too.
    // Indexing them would be six thin pages of lorem.
    if (entry.name === '_templates') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (entry.name.endsWith('.json')) found.push(full);
  }
  return found;
}

/** Only emit a date where a real one exists. A guessed lastmod is worse than none. */
function isoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/** Every published post, newest first. The app keys posts by id and routes on it. */
export function collectBlogPosts() {
  const posts = [];
  for (const file of walk(BLOG_DIR)) {
    let post;
    try {
      post = readJson(file);
    } catch (error) {
      console.error(`Skipping unparseable blog file ${path.relative(ROOT, file)}: ${error.message}`);
      continue;
    }
    if (!post.id) {
      console.error(`Skipping ${path.relative(ROOT, file)}: no id field.`);
      continue;
    }
    posts.push({ id: post.id, date: isoDate(post.date), status: post.status ?? 'draft' });
  }

  posts.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id));
  return posts;
}

/** Posts finished enough to advertise in the sitemap. */
export function indexableBlogPosts() {
  return collectBlogPosts().filter((post) => INDEXABLE_BLOG_STATUSES.includes(post.status));
}

/**
 * Every URL path that should exist as a static file after prerendering.
 * Broader than the sitemap on purpose: a draft still deserves a fast page, it
 * just carries noindex and is not advertised.
 */
export function allRoutePaths() {
  return [...PUBLIC_ROUTES.map((route) => route.path), ...collectBlogPosts().map((p) => `/blog/${p.id}`)];
}
