import * as THREE from 'three';

export interface ModelDefinition {
  type: 'glb' | 'procedural';
  url?: string; // for GLB models
  generator?: () => THREE.Object3D; // for procedural geometry
  defaultScale: number;
  defaultPosition: { x: number; y: number; z: number };
  color?: number;
  category: string;
}

// Generate procedural placeholder geometries
const createWaterDish = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Shallow cylinder for water dish
  const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x4A90E2,
    metalness: 0.3,
    roughness: 0.4
  });
  const dish = new THREE.Mesh(geometry, material);
  group.add(dish);
  
  return group;
};

const createHide = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Half-sphere for hide cave
  const geometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.9,
    metalness: 0.1
  });
  const hide = new THREE.Mesh(geometry, material);
  hide.rotation.x = Math.PI; // flip upside down
  group.add(hide);
  
  return group;
};

const createSubstrate = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Flat box for substrate layer
  const geometry = new THREE.BoxGeometry(8, 0.5, 6);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x654321,
    roughness: 1,
    metalness: 0
  });
  const substrate = new THREE.Mesh(geometry, material);
  substrate.position.y = -2.5; // At bottom
  group.add(substrate);
  
  return group;
};

const createPlant = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Cylinder for pot
  const potGeometry = new THREE.CylinderGeometry(0.8, 0.6, 1, 16);
  const potMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.8
  });
  const pot = new THREE.Mesh(potGeometry, potMaterial);
  pot.position.y = 0.5;
  group.add(pot);
  
  // Sphere for foliage
  const foliageGeometry = new THREE.SphereGeometry(1.2, 16, 16);
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228B22,
    roughness: 0.9
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 1.8;
  group.add(foliage);
  
  return group;
};

const createBranch = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Cylinder for branch
  const geometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x8B7355,
    roughness: 1,
    metalness: 0
  });
  const branch = new THREE.Mesh(geometry, material);
  branch.rotation.z = Math.PI / 4; // Angle it
  group.add(branch);
  
  return group;
};

const createLightFixture = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Flat rectangle for light fixture
  const geometry = new THREE.BoxGeometry(3, 0.3, 1);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xFFFFFF,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xFFFFAA,
    emissiveIntensity: 0.3
  });
  const fixture = new THREE.Mesh(geometry, material);
  fixture.position.y = 4; // At top
  group.add(fixture);
  
  return group;
};

const createHeater = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Flat pad for heat mat
  const geometry = new THREE.BoxGeometry(2, 0.1, 1.5);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xFF4500,
    metalness: 0.3,
    roughness: 0.5,
    emissive: 0xFF0000,
    emissiveIntensity: 0.2
  });
  const heater = new THREE.Mesh(geometry, material);
  heater.position.y = -2.8; // At bottom
  group.add(heater);
  
  return group;
};

const createThermometer = (): THREE.Object3D => {
  const group = new THREE.Group();
  
  // Thin cylinder for thermometer
  const geometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xDDDDDD,
    metalness: 0.5,
    roughness: 0.3
  });
  const thermo = new THREE.Mesh(geometry, material);
  thermo.position.y = 1;
  group.add(thermo);
  
  return group;
};

// Model registry - maps item names/keywords to models
export const modelRegistry: Record<string, ModelDefinition> = {
  // Water features
  'water': {
    type: 'procedural',
    generator: createWaterDish,
    defaultScale: 1,
    defaultPosition: { x: -2, y: -2.5, z: -2 },
    category: 'decor'
  },
  'dish': {
    type: 'procedural',
    generator: createWaterDish,
    defaultScale: 1,
    defaultPosition: { x: -2, y: -2.5, z: -2 },
    category: 'decor'
  },
  
  // Hides
  'hide': {
    type: 'procedural',
    generator: createHide,
    defaultScale: 1,
    defaultPosition: { x: 2, y: -2.5, z: 2 },
    category: 'decor'
  },
  'cave': {
    type: 'procedural',
    generator: createHide,
    defaultScale: 1,
    defaultPosition: { x: 2, y: -2.5, z: 2 },
    category: 'decor'
  },
  
  // Substrate
  'substrate': {
    type: 'procedural',
    generator: createSubstrate,
    defaultScale: 1,
    defaultPosition: { x: 0, y: 0, z: 0 },
    category: 'substrate'
  },
  'soil': {
    type: 'procedural',
    generator: createSubstrate,
    defaultScale: 1,
    defaultPosition: { x: 0, y: 0, z: 0 },
    category: 'substrate'
  },
  
  // Plants
  'plant': {
    type: 'procedural',
    generator: createPlant,
    defaultScale: 1,
    defaultPosition: { x: -1, y: -2.5, z: 1 },
    category: 'live_plants'
  },
  'pothos': {
    type: 'procedural',
    generator: createPlant,
    defaultScale: 1,
    defaultPosition: { x: -1, y: -2.5, z: 1 },
    category: 'live_plants'
  },
  
  // Branches (can use GLB if available)
  'branch': {
    type: 'glb',
    url: '/Meshy_AI_Y_Branch_Twig_0119170311_generate.glb',
    defaultScale: 1,
    defaultPosition: { x: 0, y: 0, z: 0 },
    category: 'decor'
  },
  'vine': {
    type: 'procedural',
    generator: createBranch,
    defaultScale: 1,
    defaultPosition: { x: 1, y: 0, z: -1 },
    category: 'decor'
  },
  
  // Equipment
  'light': {
    type: 'procedural',
    generator: createLightFixture,
    defaultScale: 1,
    defaultPosition: { x: 0, y: 0, z: 0 },
    category: 'equipment'
  },
  'uvb': {
    type: 'procedural',
    generator: createLightFixture,
    defaultScale: 1,
    defaultPosition: { x: 0, y: 0, z: 0 },
    category: 'equipment'
  },
  'heat': {
    type: 'procedural',
    generator: createHeater,
    defaultScale: 1,
    defaultPosition: { x: 2, y: 0, z: 0 },
    category: 'equipment'
  },
  'thermometer': {
    type: 'procedural',
    generator: createThermometer,
    defaultScale: 1,
    defaultPosition: { x: -3, y: 0, z: 0 },
    category: 'equipment'
  },
  'hygrometer': {
    type: 'procedural',
    generator: createThermometer,
    defaultScale: 1,
    defaultPosition: { x: -3, y: 0, z: 1 },
    category: 'equipment'
  }
};

// Match shopping item to model definition
export const matchItemToModel = (itemName: string): ModelDefinition | null => {
  const nameLower = itemName.toLowerCase();
  
  // Direct keyword match
  for (const [keyword, model] of Object.entries(modelRegistry)) {
    if (nameLower.includes(keyword)) {
      return model;
    }
  }
  
  return null;
};
