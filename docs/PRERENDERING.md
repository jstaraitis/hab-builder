# Prerendering

Every public page ships as real HTML instead of an empty `<div id="root">`.

Before this, `dist/index.html` had a 181-character body and all 135 blog posts
existed only after JavaScript ran. Google can render JS, but on a deferred
second pass; Bing barely does; social scrapers and AI crawlers do not at all —
which is why the meta tags the SEO component injects were invisible to every
service that renders a share card.

## How it runs

`npm run build` does three things, in order:

| Step | Script | Output |
|---|---|---|
| `prebuild` | `generate-sitemap.js` | `public/sitemap.xml` |
| `build` | `tsc && vite build` | `dist/` |
| `postbuild` | `prerender.js` | one `index.html` per route, plus `shell.html` |

Prerendering serves the real build on a local port and drives it with headless
Chrome, four tabs at a time. A full run is about 25 seconds for 145 routes.

It was done this way rather than converting the app to SSG because the router
threads planner state through 40-odd inline route elements; rebuilding that as
an SSG route config would risk regressions across the whole app to fix a
problem that only concerns ten static pages and a blog.

## Adding a public page

Add it to `PUBLIC_ROUTES` in `scripts/site-routes.js`. That one list feeds both
the sitemap and the prerenderer, so they cannot drift apart.

The page **must render an `<SEO>` component**. The prerenderer fails the build
if an advertised route produces no canonical link, because that is the
signature of a URL that renders nothing — which is how `/roadmap` sat in the
old sitemap for months pointing at a route the router never defined.

Give every page exactly one `<h1>`, describing that page. The site wordmark is
deliberately a `<span>`: as an `<h1>` it appeared on all 145 pages and buried
the heading that actually described each one.

## Drafts are prerendered but not indexed

Blog posts carry a `status`. Only `published`, `community-reviewed` and
`expert-verified` are indexable; at the time of writing 57 of 135 posts are
still drafts carrying unfilled `[Add Subtitle]` placeholders.

Those still get prerendered — the page should work and be fast — but they are
tagged `noindex,follow` and left out of the sitemap. `follow` rather than
`nofollow` so their links to finished posts are still crawled.

The status list lives in two files, because one is TypeScript the app imports
and the other is a script node runs directly. `src/data/blog/blogStatus.test.ts`
fails if they disagree.

**To publish a draft:** fill in its content, change `status` to
`community-reviewed`, and rebuild. It appears in the sitemap automatically.

## shell.html

`dist/index.html` is now the prerendered home page, so unmatched URLs fall back
to `shell.html` instead — an untouched copy of the SPA shell. Both
`public/_redirects` and `netlify.toml` point at it.

This matters for two reasons: a signed-in user opening `/dashboard` directly
gets a blank shell rather than a flash of the home page, and no unmatched URL
ships a canonical tag claiming to be the home page.

For the same reason there is **no static canonical in `index.html`** — every
route is served the same file before prerendering, so a hard-coded one would
invite a crawler to fold the whole site into a single URL.

## Netlify

Netlify serves matching static files before applying redirect rules, so
`/blog/<slug>` resolves to `dist/blog/<slug>/index.html` on its own. No
configuration beyond the fallback change.

Puppeteer downloads Chrome on install. `PUPPETEER_CACHE_DIR` is pinned inside
`node_modules` in `netlify.toml` so Netlify's dependency cache can keep it
between builds — **worth confirming on your first two deploys** that the second
build does not re-download Chrome.

## Capacitor

`npm run cap:sync` runs the same build, so the iOS bundle now ships a
prerendered home page in `index.html`. React takes over on boot as usual; the
canonical tag it contains is inert inside the native app.
