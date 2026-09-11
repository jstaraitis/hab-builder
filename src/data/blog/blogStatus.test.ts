import { describe, it, expect } from 'vitest';
import { INDEXABLE_BLOG_STATUSES, isIndexableStatus, blogPostsList } from './index';
// The sitemap generator is plain ESM and shares this decision with the app.
import { INDEXABLE_BLOG_STATUSES as SCRIPT_STATUSES } from '../../../scripts/site-routes.js';

describe('indexable blog statuses', () => {
  it('matches the list the sitemap generator uses', () => {
    // These live in two files because one is TypeScript the app imports and
    // the other is a build script node runs directly. If they drift, the site
    // either advertises a noindex page in the sitemap or hides a finished one
    // from it — and nothing would fail until a search console report months on.
    expect([...SCRIPT_STATUSES].sort()).toEqual([...INDEXABLE_BLOG_STATUSES].sort());
  });

  it('treats unfinished work as not indexable', () => {
    expect(isIndexableStatus('draft')).toBe(false);
    expect(isIndexableStatus('in-progress')).toBe(false);
    expect(isIndexableStatus('review-needed')).toBe(false);
  });

  it('treats reviewed and published work as indexable', () => {
    expect(isIndexableStatus('published')).toBe(true);
    expect(isIndexableStatus('community-reviewed')).toBe(true);
    expect(isIndexableStatus('expert-verified')).toBe(true);
  });

  it('treats a missing status as unfinished rather than publishable', () => {
    // Posts predating the field should not be advertised by default. Failing
    // closed costs a page in the sitemap; failing open costs site quality.
    expect(isIndexableStatus(undefined)).toBe(false);
  });
});

describe('the blog corpus', () => {
  it('still contains posts fit to index', () => {
    // A guard against a refactor that quietly marks everything unfinished and
    // empties the sitemap without anyone noticing.
    const indexable = blogPostsList.filter((post) => isIndexableStatus(post.status));
    expect(indexable.length).toBeGreaterThan(50);
  });
});
