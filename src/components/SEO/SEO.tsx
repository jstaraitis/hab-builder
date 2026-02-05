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
  title: 'Habitat Builder - Free Reptile & Amphibian Enclosure Planner with Care Tracking & Analytics',
  description: 'Design the perfect enclosure for your reptile or amphibian with our free interactive planner. Find animals that fit your space, get custom shopping lists, species-specific care parameters, drag-and-drop visual designer with 70+ equipment items, detailed step-by-step build instructions, care task reminders with push notifications, equipment maintenance tracking, and care analytics with completion rates and activity heatmaps. Supports 19 species: tree frogs, geckos, bearded dragons, snakes, salamanders, chameleons, and more.',
  keywords: [
    // Core tool keywords
    'reptile enclosure planner',
    'vivarium builder',
    'habitat designer',
    'terrarium planner',
    'free enclosure calculator',
    'reptile setup cost calculator',
    'find reptile for enclosure',
    'animal recommendation tool',
    'bioactive enclosure calculator',
    'reptile care guide',
    'amphibian enclosure planner',
    
    // How-to/Problem-solving keywords
    'how to set up reptile tank',
    'how to build bioactive terrarium',
    'first time reptile owner',
    'beginner reptile setup',
    'what size tank for bearded dragon',
    'reptile enclosure mistakes to avoid',
    'best beginner reptile',
    'easiest reptile to care for',
    'low maintenance reptile',
    'how to choose reptile enclosure size',
    
    // Species-specific setup keywords
    'bearded dragon setup guide',
    'leopard gecko enclosure guide',
    'crested gecko habitat setup',
    'gargoyle gecko tank setup',
    'ball python enclosure requirements',
    'corn snake habitat guide',
    'blue tongue skink setup',
    'pacman frog terrarium guide',
    'whites tree frog setup',
    'red eyed tree frog habitat',
    'axolotl tank requirements',
    'axolotl chiller setup',
    'red-eared slider tank setup',
    'veiled chameleon enclosure requirements',
    'uromastyx habitat setup',
    'african clawed frog tank guide',
    'tomato frog setup',
    'amazon milk frog habitat',
    'mourning gecko care',
    
    // Equipment-specific keywords
    'reptile UVB lighting guide',
    'best substrate for bioactive',
    'reptile heating setup',
    'thermostat for reptile tank',
    'misting system for terrarium',
    'drainage layer for bioactive',
    'cleanup crew for bioactive',
    'reptile hide recommendations',
    'water feature for terrarium',
    'best plants for bioactive vivarium',
    
    // Shopping/Budget keywords
    'reptile enclosure shopping list',
    'reptile setup cost breakdown',
    'budget reptile setup',
    'reptile equipment calculator',
    'where to buy reptile supplies',
    'cheap reptile setup',
    'affordable reptile enclosure',
    
    // Setup type keywords
    'naturalistic bioactive setup',
    'minimalist reptile enclosure',
    'display terrarium setup',
    'bioactive vivarium guide',
    'bioactive substrate depth',
    'planted terrarium guide',
    
    // Technical/Calculator keywords
    'UVB coverage calculator',
    'substrate depth calculator',
    'enclosure size calculator',
    'reptile temperature guide',
    'humidity calculator',
    'reptile budget planner',
    'gallons to dimensions converter',
    
    // Feature-specific keywords
    'interactive habitat designer',
    'drag and drop enclosure designer',
    'visual enclosure planner',
    'equipment installation guide',
    'thermostat setup guide',
    'misting system installation',
    'escape proof enclosure',
    
    // Category-specific
    'salamander enclosure setup',
    'newt tank requirements',
    'chameleon care guide',
    'tree frog habitat setup',
    'gecko terrarium builder',
    'snake enclosure requirements',
    'turtle tank setup guide',
    'amphibian terrarium guide',
    
    // Care level keywords
    'beginner reptile care',
    'intermediate reptile setup',
    'advanced reptile care',
    'easy reptiles for beginners',
    'hardy reptile species',
    
    // Comparison keywords
    'leopard gecko vs crested gecko',
    'ball python vs corn snake',
    'bioactive vs non-bioactive',
    'glass vs pvc enclosure',
    'screen vs glass terrarium',
    
    // Community & User Content keywords
    'user submitted reptile setups',
    'real enclosure builds',
    'community reptile setups',
    'real life reptile habitats',
    'reptile keeper community',
    'share your reptile setup',
    'enclosure inspiration',
    
    // Care Scheduling & Reminders keywords
    'reptile care calendar',
    'feeding schedule tracker',
    'reptile maintenance checklist',
    'care reminders for reptiles',
    'reptile feeding schedule',
    'humidity monitoring schedule',
    'UVB replacement schedule',
    'tank cleaning calendar',
    'water change schedule',
    'misting system schedule',
    'care task notifications',
    'push notification reminders',
    'reptile care streak tracker',
    'care completion rates',
    'care activity heatmap',
    'equipment maintenance tracker',
    'UVB bulb replacement reminders',
    'substrate level monitoring',
    'supplement expiration tracker',
    'reptile care analytics',
    'care consistency tracking',
    'care pattern analysis',
    
    // Roadmap & Development keywords
    'habitat builder features',
    'enclosure planner updates',
    'new reptile species coming',
    'upcoming features reptile planner',
    'feature roadmap'
  ],
  ogImage: '/og-image.jpg',
  canonical: 'https://habitat-builder.com'
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
          'Custom enclosure design with interactive visual designer',
          'Species-specific care parameters and warnings',
          'Automated shopping lists with Amazon affiliate links',
          'Step-by-step build instructions',
          'Bioactive setup planning and calculations',
          '70+ equipment items across 13 categories',
          'Drag-and-drop layout designer with rotation and resizing',
          'Budget-friendly equipment tier options (minimum/recommended/ideal)',
          'UVB coverage and substrate depth calculators',
          'Color-coded care difficulty levels',
          'Care calendar with customizable reminders for feeding, maintenance, and monitoring',
          'Care analytics dashboard with streaks, completion rates, and activity heatmaps',
          'Equipment inventory tracking and maintenance reminders',
          'UVB bulb replacement scheduling and substrate level monitoring',
          'Push notifications for care tasks and equipment maintenance',
          'Community setup submissions and gallery of real user builds',
          'Complete species profiles with detailed care guidance',
          'Interactive animal finder based on enclosure dimensions and care level',
          'Dark mode support',
          'Mobile-responsive design with full PWA installability'
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
