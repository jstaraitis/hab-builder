import basicCare from './basic-care.json';

export interface CareTemplate {
  animalId: string;
  species: string;
  tasks: Array<{
    type: string;
    title: string;
    description: string;
    frequency: string;
    scheduledTime: string;
  }>;
}

export const careTemplates: Record<string, CareTemplate> = {
  'basic-care': basicCare as CareTemplate,
};

export function getTemplateForAnimal(animalId: string): CareTemplate | null {
  return careTemplates[animalId] || null;
}
