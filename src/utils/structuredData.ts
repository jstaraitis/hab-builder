import type { AnimalProfile } from '../engine/types';

export function generateAnimalStructuredData(profile: AnimalProfile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${profile.commonName} Enclosure Setup Guide`,
    description: `Complete care guide and enclosure planning for ${profile.commonName} (${profile.scientificName}). Includes temperature, humidity, lighting requirements, and habitat design.`,
    image: `/animals/${profile.id}-og.jpg`,
    author: {
      '@type': 'Organization',
      name: 'Habitat Builder'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Habitat Builder',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://habitatbuilder.com/animal/${profile.id}`
    }
  };
}

export function generateHowToStructuredData(animalName: string, steps: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Build a ${animalName} Enclosure`,
    description: `Step-by-step instructions for building a proper ${animalName} habitat`,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step
    }))
  };
}

export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
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

export function generateProductStructuredData(items: Array<{ name: string; description: string; price?: number }>) {
  return items.map(item => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description,
    offers: item.price ? {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    } : undefined
  }));
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}
