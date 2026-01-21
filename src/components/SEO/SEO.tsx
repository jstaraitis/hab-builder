import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
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

const DEFAULT_SEO = {
  title: 'Habitat Builder - Free Reptile & Amphibian Enclosure Planning Tool',
  description: 'Design the perfect enclosure for your reptile or amphibian. Get custom shopping lists, care parameters, and step-by-step build instructions. Free habitat planner for bearded dragons, tree frogs, and more.',
  keywords: ['reptile enclosure', 'vivarium builder', 'habitat planner', 'bearded dragon setup', 'bioactive enclosure', 'reptile care'],
  ogImage: '/og-image.jpg',
  canonical: 'https://habitatbuilder.com'
};

export function SEO({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  article,
  noindex = false,
  structuredData
}: SEOProps) {
  const location = useLocation();

  const fullTitle = title ? `${title} | Habitat Builder` : DEFAULT_SEO.title;
  const metaDescription = description || DEFAULT_SEO.description;
  const metaKeywords = keywords || DEFAULT_SEO.keywords;
  const canonicalUrl = canonical || `${DEFAULT_SEO.canonical}${location.pathname}`;
  const imageUrl = ogImage || DEFAULT_SEO.ogImage;

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
    const metaTags = [
      { name: 'description', content: metaDescription },
      { name: 'keywords', content: metaKeywords.join(', ') },
      
      // Open Graph
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: metaDescription },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: imageUrl },
      { property: 'og:site_name', content: 'Habitat Builder' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: metaDescription },
      { name: 'twitter:image', content: imageUrl },
      
      // Additional SEO
      { name: 'robots', content: noindex ? 'noindex,nofollow' : 'index,follow' },
      { name: 'googlebot', content: noindex ? 'noindex,nofollow' : 'index,follow' },
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

    // Append meta tags to head
    metaTags.forEach(tag => {
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
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
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
      const organizationData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Habitat Builder',
        description: metaDescription,
        url: DEFAULT_SEO.canonical,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'Custom enclosure design',
          'Species-specific care parameters',
          'Automated shopping lists',
          'Step-by-step build instructions',
          'Bioactive setup planning'
        ]
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(organizationData);
      document.head.appendChild(script);
    }
  }, [fullTitle, metaDescription, metaKeywords, canonicalUrl, imageUrl, ogType, article, noindex, structuredData]);

  return null;
}
