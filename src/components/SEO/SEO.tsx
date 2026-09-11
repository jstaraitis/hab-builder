import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  noindex?: boolean;
  structuredData?: object;
}

/** The production origin. Exported so callers building their own canonical
 *  URL use the same one rather than whatever host they happen to be served
 *  from — a deploy preview, or the prerenderer's localhost. */
export const SITE_URL = 'https://habitat-builder.com';

/**
 * The share card. This must be an absolute URL: Open Graph requires one, and
 * for months this pointed at a relative /og-image.jpg that did not exist in
 * public/ at all — so every share on TikTok, Discord, iMessage and Facebook
 * rendered a blank box. Regenerate with `npm run generate-og-image`.
 */
const OG_IMAGE_PATH = '/og-image.png';
const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

const DEFAULT_SEO = {
  title: 'Habitat Builder - Reptile & Amphibian Enclosure Planner',
  description:
    'Plan the perfect reptile or amphibian enclosure in minutes. Get a custom shopping list, step-by-step build guide, and care calendar for 18+ species. Free to use.',
  ogImage: OG_IMAGE_PATH,
  canonical: SITE_URL,
};

/**
 * Scrapers reject relative image paths, and several never retry. Anything
 * already absolute is left alone so a caller can point at an external asset.
 */
function toAbsoluteUrl(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  article,
  noindex = false,
  structuredData
}: SEOProps) {
  const location = useLocation();

  // Pages that already name the brand would otherwise read "FAQ - Habitat
  // Builder | Habitat Builder" in the tab and every search result.
  const fullTitle = !title
    ? DEFAULT_SEO.title
    : title.includes('Habitat Builder')
      ? title
      : `${title} | Habitat Builder`;
  const metaDescription = description || DEFAULT_SEO.description;
  const canonicalUrl = canonical || `${DEFAULT_SEO.canonical}${location.pathname}`;
  const imageUrl = toAbsoluteUrl(ogImage || DEFAULT_SEO.ogImage);

  useEffect(() => {
    // Set document title
    document.title = fullTitle;

    // Remove existing meta tags
    const existingMeta = document.querySelectorAll('meta[data-seo]');
    existingMeta.forEach(tag => tag.remove());

    // Remove existing structured data
    const existingStructuredData = document.querySelectorAll('script[type="application/ld+json"]');
    existingStructuredData.forEach(script => script.remove());

    // Create meta tags
    // No meta keywords tag. Google has ignored it since 2009, Bing reads
    // stuffing as a negative signal, and the 200-entry list that used to live
    // here still advertised an enclosure designer that no longer exists.
    const metaTags = [
      { name: 'description', content: metaDescription },
      
      // Open Graph
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: metaDescription },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: imageUrl },
      // Dimensions let a scraper commit to the large card on first fetch
      // instead of downloading the image before deciding.
      { property: 'og:image:width', content: OG_IMAGE_WIDTH },
      { property: 'og:image:height', content: OG_IMAGE_HEIGHT },
      { property: 'og:image:alt', content: 'Habitat Builder - Reptile & Amphibian Enclosure Planner' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:site_name', content: 'Habitat Builder' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: metaDescription },
      { name: 'twitter:image', content: imageUrl },
      
      // Additional SEO
      // noindex,follow rather than noindex,nofollow: an unfinished post should
      // stay out of the index, but its links to finished posts are still worth
      // crawling. nofollow would strand them.
      { name: 'robots', content: noindex ? 'noindex,follow' : 'index,follow' },
      { name: 'googlebot', content: noindex ? 'noindex,follow' : 'index,follow' },
      { name: 'author', content: 'Habitat Builder' },
      { name: 'theme-color', content: '#10b981' }
    ];

    // Add article-specific meta tags
    if (article && ogType === 'article') {
      if (article.publishedTime) {
        metaTags.push({ property: 'article:published_time', content: article.publishedTime });
      }
      if (article.modifiedTime) {
        metaTags.push({ property: 'article:modified_time', content: article.modifiedTime });
      }
      if (article.author) {
        metaTags.push({ property: 'article:author', content: article.author });
      }
      if (article.section) {
        metaTags.push({ property: 'article:section', content: article.section });
      }
      if (article.tags) {
        article.tags.forEach(tag => {
          metaTags.push({ property: 'article:tag', content: tag });
        });
      }
    }

    // Append meta tags to head.
    //
    // Each one first removes any existing tag for the same key, including the
    // static defaults in index.html. Without this every page carried two
    // description tags and two of each og: tag — one static, one injected —
    // and a scraper picking the wrong one would describe every page as the
    // home page. It matters more now that those defaults exist to be read by
    // scrapers that never run this code at all.
    metaTags.forEach(tag => {
      const key =
        'property' in tag && tag.property
          ? `meta[property="${tag.property}"]`
          : 'name' in tag && tag.name
            ? `meta[name="${tag.name}"]`
            : null;
      if (key) {
        document.head.querySelectorAll(key).forEach(existing => existing.remove());
      }

      const meta = document.createElement('meta');
      meta.setAttribute('data-seo', 'true');
      
      if ('name' in tag && tag.name) {
        meta.setAttribute('name', tag.name);
      }
      if ('property' in tag && tag.property) {
        meta.setAttribute('property', tag.property);
      }
      if (tag.content) {
        meta.setAttribute('content', tag.content);
      }
      
      document.head.appendChild(meta);
    });

    // Set canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Add structured data
    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Add default organization structured data if none provided
    if (!structuredData) {
      /**
       * Kept honest deliberately. This list previously advertised an
       * "interactive visual designer" and "drag-and-drop layout designer"
       * months after the enclosure designer was deleted, while saying nothing
       * about Setup Check, Ferguson zones or the vet report — the only
       * features no competitor offers. Structured data that misdescribes the
       * product is a spam-policy risk as well as a wasted signal.
       */
      const organizationData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Habitat Builder',
        description: metaDescription,
        url: DEFAULT_SEO.canonical,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web, iOS',
        offers: [
          {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free — enclosure planner, shopping list, species profiles and care guides',
          },
          {
            '@type': 'Offer',
            price: '2.99',
            priceCurrency: 'USD',
            description:
              'Premium — setup validation, vet reports, growth benchmarks, colony and cost tracking',
          },
        ],
        featureList: [
          "Setup Check: eight placement questions graded against your species' Ferguson zone",
          'Habitat Score grading temperature, humidity, lighting and equipment placement',
          'Ferguson zone UVB guidance, with bulb type and mounting distance checked together',
          'Printable vet-ready health report covering weight, feeding, shedding and stool',
          "What changed? — reconstructs husbandry changes in the weeks before a symptom",
          "Growth percentiles built from other keepers' animals of the same species and age",
          'Nutrition analysis reading supplementation against UVB provision',
          'Feeder colony tracking: harvest rate against what breeding stock can replace',
          'Cost of keeping, including electricity estimated from wattage and runtime',
          'Pet-sitter care sheet generated from your own schedule',
          'Care calendar with customisable push reminders for feeding and maintenance',
          'Inventory tracking with UVB bulb replacement and consumable reminders',
          'Collection import from a spreadsheet or another husbandry app export',
          'Species profiles, build plans and automated shopping lists for 18+ species',
          'Interactive animal finder based on enclosure dimensions and care level',
          'Native iOS app plus full PWA installability',
        ],
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(organizationData);
      document.head.appendChild(script);
    }
  }, [fullTitle, metaDescription, canonicalUrl, imageUrl, ogType, article, noindex, structuredData]);

  return null;
}
