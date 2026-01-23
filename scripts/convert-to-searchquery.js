import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const catalogPath = join(__dirname, '..', 'src', 'data', 'equipment-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

Object.keys(catalog).forEach(itemKey => {
  const item = catalog[itemKey];
  
  if (!item.tiers) return;
  
  Object.keys(item.tiers).forEach(tierKey => {
    const tier = item.tiers[tierKey];
    
    // Remove old purchaseLink field
    if (tier.purchaseLink) {
      delete tier.purchaseLink;
    }
    
    // Add searchQuery based on item type
    if (itemKey === 'enclosure-glass') {
      if (tierKey === 'minimum') {
        tier.searchQuery = '{size} gallon glass aquarium';
      } else if (tierKey === 'recommended') {
        tier.searchQuery = 'Exo Terra {width}x{depth}x{height} glass terrarium';
      } else {
        tier.searchQuery = 'Zen Habitats {width}x{depth}x{height} glass terrarium';
      }
    } else if (itemKey === 'enclosure-pvc') {
      if (tierKey === 'minimum') {
        tier.searchQuery = 'PVC sheets {width}x{height} terrarium enclosure';
      } else if (tierKey === 'recommended') {
        tier.searchQuery = 'Zen Habitats {width}x{depth}x{height} PVC enclosure';
      } else {
        tier.searchQuery = 'Custom Cages {width}x{depth}x{height} PVC terrarium';
      }
    } else if (itemKey === 'uvb-linear') {
      if (tierKey === 'minimum') {
        tier.searchQuery = 'T8 UVB fluorescent bulb reptile';
      } else if (tierKey === 'recommended') {
        tier.searchQuery = 'Arcadia T5 UVB bulb';
      } else {
        tier.searchQuery = 'Arcadia T5 HO UVB kit controller';
      }
    } else if (itemKey === 'heat-lamp') {
      if (tierKey === 'minimum') {
        tier.searchQuery = 'ceramic heat emitter 50w reptile';
      } else if (tierKey === 'recommended') {
        tier.searchQuery = 'halogen basking bulb 50w dimmer';
      } else {
        tier.searchQuery = 'Arcadia deep heat projector thermostat';
      }
    } else if (itemKey === 'thermometer-hygrometer') {
      if (tierKey === 'minimum') {
        tier.searchQuery = 'digital thermometer hygrometer terrarium';
      } else if (tierKey === 'recommended') {
        tier.searchQuery = 'ThermoPro digital thermometer hygrometer';
      } else {
        tier.searchQuery = 'Govee bluetooth thermometer hygrometer app';
      }
    } else if (itemKey === 'substrate-bioactive') {
      tier.searchQuery = 'ABG mix bioactive substrate reptile';
    } else if (itemKey === 'drainage-layer') {
      tier.searchQuery = 'hydroballs drainage layer terrarium';
    } else if (itemKey === 'springtails') {
      tier.searchQuery = 'springtail culture bioactive cleanup crew';
    } else if (itemKey === 'isopods') {
      tier.searchQuery = 'dwarf white isopods bioactive culture';
    } else if (itemKey === 'water-dish') {
      tier.searchQuery = 'reptile water dish ' + tierKey;
    } else if (itemKey === 'artificial-plants') {
      tier.searchQuery = 'artificial terrarium plants reptile';
    } else if (itemKey === 'live-plants') {
      tier.searchQuery = 'live terrarium plants vivarium';
    } else if (itemKey === 'branches') {
      tier.searchQuery = 'cork bark branches terrarium';
    } else if (itemKey === 'mister-automatic') {
      tier.searchQuery = 'Mistking automatic misting system reptile';
    } else if (itemKey === 'spray-bottle') {
      tier.searchQuery = 'spray bottle misting terrarium';
    } else {
      // Generic fallback
      tier.searchQuery = 'terrarium ' + item.name.toLowerCase();
    }
  });
});

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('✅ Converted purchaseLink fields to searchQuery templates');
