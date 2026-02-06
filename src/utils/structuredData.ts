/**
 * Schema.org structured data utilities for SEO
 */

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

// Schema.org type interfaces for type safety
interface HowToStep {
  '@type': 'HowToStep';
  position: string;
  name: string;
  text: string;
  image?: string;
}

interface PriceSpecification {
  '@type': 'PriceSpecification';
  priceCurrency: string;
  price: string;
}

interface HowToSchema extends StructuredData {
  '@type': 'HowTo';
  name: string;
  description: string;
  step: HowToStep[];
  totalTime?: string;
  estimatedCost?: PriceSpecification;
}

interface ProductSchema extends StructuredData {
  '@type': 'Product';
  name: string;
  description: string;
  brand: { '@type': 'Brand'; name: string };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
  };
  url?: string;
  image?: string;
}

/**
 * Generate Article structured data for blog posts
 */
export function generateArticleStructuredData(
  title: string,
  description: string,
  publishedDate: string,
  modifiedDate: string,
  author: string = 'Habitat Builder',
  imageUrl?: string
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: imageUrl || '/og-image.jpg',
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://habitat-builder.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Habitat Builder',
      logo: {
        '@type': 'ImageObject',
        url: 'https://habitat-builder.com/logo.png',
        width: 200,
        height: 60
      }
    }
  };
}

/**
 * Generate HowTo structured data for build instructions
 */
export function generateHowToStructuredData(
  title: string,
  description: string,
  steps: Array<{
    name: string;
    text: string;
    imageUrl?: string;
  }>,
  totalTime?: string,
  estimatedCost?: string
): StructuredData {
  const estimatedSteps: HowToStep[] = steps.map((step, index) => ({
    '@type': 'HowToStep' as const,
    position: (index + 1).toString(),
    name: step.name,
    text: step.text,
    ...(step.imageUrl && {
      image: step.imageUrl
    })
  }));

  const data: HowToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description: description,
    step: estimatedSteps
  };

  if (totalTime) {
    data.totalTime = totalTime;
  }

  if (estimatedCost) {
    data.estimatedCost = {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      price: estimatedCost
    };
  }

  return data;
}

/**
 * Generate Product structured data for shopping list items
 */
export function generateProductStructuredData(
  name: string,
  description: string,
  price?: number,
  url?: string,
  imageUrl?: string
): StructuredData {
  const data: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    brand: {
      '@type': 'Brand',
      name: 'Various Brands'
    }
  };

  if (price !== undefined) {
    data.offers = {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    };
  }

  if (url) {
    data.url = url;
  }

  if (imageUrl) {
    data.image = imageUrl;
  }

  return data;
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{
    question: string;
    answer: string;
  }>
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{
    name: string;
    url: string;
  }>
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}

/**
 * Generate LocalBusiness structured data for contact/location info
 */
export function generateLocalBusinessStructuredData(
  name: string = 'Habitat Builder',
  description?: string
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: name,
    description: description || 'Free reptile and amphibian enclosure design tool',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    url: 'https://habitat-builder.com',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Habitat Builder',
    url: 'https://habitat-builder.com',
    logo: 'https://habitat-builder.com/logo.png',
    sameAs: [
      'https://www.instagram.com/habitat_builder'
    ],
    contact: {
      '@type': 'ContactPoint',
      contactType: 'Support',
      url: 'https://habitat-builder.com'
    }
  };
}
