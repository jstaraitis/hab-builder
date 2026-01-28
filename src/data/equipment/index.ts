/**
 * Equipment catalog - modular structure
 * Each category is maintained in its own file for better organization
 */
import enclosures from './enclosures.json';
import substrate from './substrate.json';
import cleanupCrew from './cleanup-crew.json';
import lighting from './lighting.json';
import heating from './heating.json';
import humidity from './humidity.json';
import monitoring from './monitoring.json';
import nutrition from './nutrition.json';
import decor from './decor.json';
import aquatic from './aquatic.json';

// Merge all equipment categories into a single catalog
// Maintains the same interface as the original equipment-catalog.json
const equipmentCatalog = {
  ...enclosures,
  ...substrate,
  ...cleanupCrew,
  ...lighting,
  ...heating,
  ...humidity,
  ...monitoring,
  ...nutrition,
  ...decor,
  ...aquatic,
};

export default equipmentCatalog;
