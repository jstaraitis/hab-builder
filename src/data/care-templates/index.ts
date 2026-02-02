import whitestreefrog from './whites-tree-frog.json';

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
  'whites-tree-frog': whitestreefrog as CareTemplate,
};

export function getTemplateForAnimal(animalId: string): CareTemplate | null {
  return careTemplates[animalId] || null;
}
