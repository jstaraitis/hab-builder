/**
 * Prerenders every public route to static HTML.
 *
 * Before this, dist/index.html shipped a 181-character body containing an
 * empty <div id="root">. Every one of the 135 blog posts existed only after
 * JavaScript ran. Google can render JS, but on a deferred second pass; Bing
 * barely does, and social scrapers and AI crawlers do not at all — which is
 * also why the meta tags the SEO component injects were invisible to every
 * service that renders a share card.
 *
 * The approach is to serve the real build and drive it with a headless
 * browser, rather than converting the app to server-side rendering. The
 * router threads planner state through 40-odd inline route elements; rebuilding
 * that as an SSG route config would risk regressions across the whole app to
 * fix a problem that only concerns eleven static pages and a blog.
 *
 * Run: npm run prerender (automatically part of `npm run build`).
 */

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { ROOT, allRoutePaths } from './site-routes.js';

const DIST = path.join(ROOT, 'dist');

/**
 * The untouched SPA shell, kept aside before index.html is overwritten with
 * the prerendered home page. Netlify rewrites unmatched URLs to this, so a
 * signed-in user opening /dashboard directly gets a blank shell rather than a
 * flash of the home page — and, importantly, no canonical tag claiming that
 * every unmatched URL is the home page.
 */
const SHELL_FILE = 'shell.html';

/**
 * Chromium is the bottleneck, not the app. Four tabs saturates a developer
 * machine, but CI containers are routinely smaller, and over-subscribing cores
 * is what turns a slow page into a timed-out one.
 */
const CONCURRENCY = Math.max(2, Math.min(4, os.cpus().length));

/** Generous: a cold first page pays for chunk loading and the Supabase session check. */
const NAV_TIMEOUT_MS = 30_000;

/**
 * Grace period after the canonical link appears, so the JSON-LD script and the
 * rest of the head written by the same effect are captured with it.
 */
const SETTLE_MS = 150;

/**
 * Failed routes are retried once, serially, before the build is failed. The
 * only failure seen in practice was contention rather than a broken page, and
 * re-rendering a handful of routes costs seconds where a false build failure
 * costs a deploy.
 */
const RETRY_ENABLED = true;

/** Below this, the captured body is a shell and something went wrong. */
const MIN_BODY_LENGTH = 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

/** Mirrors Netlify: real files win, everything else falls back to the shell. */
function createServer(shellHtml) {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const candidate = path.join(DIST, urlPath);

    // Refuse anything that escapes dist, however it was encoded.
    if (!candidate.startsWith(DIST)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    if (urlPath !== '/' && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(candidate)] ?? 'application/octet-stream' });
      fs.createReadStream(candidate).pipe(res);
      return;
    }

    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(shellHtml);
  });
}

function outputFileFor(routePath) {
  if (routePath === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, routePath.replace(/^\//, ''), 'index.html');
}

async function renderRoute(browser, origin, routePath) {
  const page = await browser.newPage();
  try {
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
    // A real viewport: components that branch on width would otherwise
    // prerender their mobile branch for every crawler.
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto(`${origin}${routePath}`, { waitUntil: 'domcontentloaded' });

    // Wait for the canonical link, not for #root to have children.
    //
    // Every advertised page renders an SEO component, and that always writes a
    // canonical link, so its presence proves the real component mounted. #root
    // fills the instant the Suspense fallback renders its spinner — before the
    // lazy route chunk has even loaded — so waiting on that and then sleeping a
    // fixed 400ms was a race. It lost on CI against the largest post in the
    // blog. networkidle0 is no use either: the Supabase client holds
    // connections open.
    try {
      await page.waitForFunction(
        () => document.querySelector('link[rel="canonical"]') !== null,
        { timeout: NAV_TIMEOUT_MS }
      );
    } catch {
      throw new Error(
        'no canonical link after ' +
          NAV_TIMEOUT_MS +
          'ms. Does the router define this path, and does it render <SEO>?'
      );
    }
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

    const html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`);
    const bodyLength = await page.evaluate(() => document.body.innerHTML.length);
    return { html, bodyLength };
  } finally {
    await page.close();
  }
}

async function main() {
  const indexFile = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error('dist/index.html not found — run the build first.');
    process.exit(1);
  }

  // Read the shell before anything overwrites it. On a re-run over an already
  // prerendered dist, the saved shell is the trustworthy copy.
  const shellFile = path.join(DIST, SHELL_FILE);
  const shellHtml = fs.existsSync(shellFile)
    ? fs.readFileSync(shellFile, 'utf8')
    : fs.readFileSync(indexFile, 'utf8');
  fs.writeFileSync(shellFile, shellHtml, 'utf8');

  const server = createServer(shellHtml);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const routes = allRoutePaths();
  const thin = [];

  /**
   * Renders the given routes, returning the ones that failed. Workers pull
   * from a shared queue so a slow page does not idle the other tabs.
   */
  async function renderAll(targets, concurrency) {
    const queue = [...targets];
    const failed = [];
    let done = 0;

    async function worker() {
      for (;;) {
        const routePath = queue.shift();
        if (!routePath) return;
        try {
          const { html, bodyLength } = await renderRoute(browser, origin, routePath);
          if (bodyLength < MIN_BODY_LENGTH) thin.push({ routePath, bodyLength });

          const outFile = outputFileFor(routePath);
          fs.mkdirSync(path.dirname(outFile), { recursive: true });
          fs.writeFileSync(outFile, html, 'utf8');
        } catch (error) {
          failed.push({ routePath, message: error.message });
        }
        done++;
        if (done % 25 === 0 || done === targets.length) {
          console.log(`  ${done}/${targets.length}`);
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    return failed;
  }

  console.log(`Prerendering ${routes.length} routes at concurrency ${CONCURRENCY}…`);
  let failures = await renderAll(routes, CONCURRENCY);

  // Retry serially. Contention is the likeliest cause of a lone failure, and
  // one tab with the machine to itself is the cheapest way to rule it out.
  if (RETRY_ENABLED && failures.length > 0) {
    console.log(`Retrying ${failures.length} route(s) one at a time…`);
    failures = await renderAll(
      failures.map((failure) => failure.routePath),
      1
    );
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  for (const { routePath, bodyLength } of thin) {
    console.warn(`  thin: ${routePath} rendered only ${bodyLength} characters`);
  }

  if (failures.length > 0) {
    for (const { routePath, message } of failures) {
      console.error(`  FAILED ${routePath}: ${message}`);
    }
    // A silent partial prerender is the worst outcome: the sitemap would
    // advertise pages that ship as empty shells.
    console.error(`\nPrerender failed for ${failures.length} of ${routes.length} routes.`);
    process.exit(1);
  }

  console.log(`Prerendered ${routes.length} routes. SPA fallback saved as ${SHELL_FILE}.`);
}

await main();
