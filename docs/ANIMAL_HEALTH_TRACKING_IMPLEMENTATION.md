# Animal Health & Tracking Features - Implementation Guide

## Overview
This document outlines the architecture and implementation plan for comprehensive animal health and tracking features.

## Database Architecture Decisions

### Why Separate Tables?
We're using **separate tables for each log type** rather than a single "animal_logs" table because:

1. **Type Safety**: Each log type has different fields (shed quality vs vet diagnosis)
2. **Performance**: Separate indexes optimize specific queries
3. **Consistency**: Follows existing pattern (weight_logs already exists)
4. **Easy to Extend**: Can add constraints and triggers specific to each type
5. **Clear Intent**: Makes queries more readable and maintainable

### Schema Structure

```
enclosure_animals (extended)
├── source (text)
├── source_details (text)
├── acquisition_date (date)
├── acquisition_price (numeric)
└── acquisition_notes (text)

shed_logs
├── shed_date
├── quality (complete/incomplete/stuck-shed/assisted)
├── shed_in_one_piece (boolean)
├── problem_areas (text[])
├── humidity_percent
└── photos/notes

brumation_logs
├── start_date
├── end_date (nullable - still in brumation if NULL)
├── duration_days (auto-calculated)
├── temperature_low/high
├── activity_level
├── weight_loss_grams
└── preparation/notes

vet_records
├── visit_date
├── visit_type (checkup/illness/injury/surgery/etc)
├── vet_name/clinic_name/clinic_phone
├── chief_complaint/diagnosis/treatment
├── prescriptions (text[])
├── cost/currency
├── follow_up tracking
└── documents/photos

length_logs
├── date
├── length/unit
├── measurement_type (snout-to-vent/total-length/carapace-length)
└── notes
```

## Implementation Plan

### Phase 1: Services Layer (Data Access)

Create TypeScript services for each new feature:

#### 1. `src/services/shedLogService.ts`
```typescript
interface ShedLog {
  id: string;
  enclosure_animal_id: string;
  user_id: string;
  shed_date: string;
  quality: 'complete' | 'incomplete' | 'stuck-shed' | 'assisted';
  shed_in_one_piece?: boolean;
  problem_areas?: string[];
  humidity_percent?: number;
  notes?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

// Methods:
// - getLogsForAnimal(animalId: string)
// - createLog(log: Omit<ShedLog, 'id' | 'created_at' | 'updated_at'>)
// - updateLog(id: string, updates: Partial<ShedLog>)
// - deleteLog(id: string)
// - getRecentSheds(animalId: string, limit: number = 10)
// - getShedStats(animalId: string) // e.g., average time between sheds
```

#### 2. `src/services/brumationLogService.ts`
```typescript
interface BrumationLog {
  id: string;
  enclosure_animal_id: string;
  user_id: string;
  start_date: string;
  end_date?: string | null;
  duration_days?: number;
  temperature_low?: number;
  temperature_high?: number;
  activity_level?: 'inactive' | 'occasional-movement' | 'restless' | 'normal';
  eating_during: boolean;
  drinking_during: boolean;
  weight_loss_grams?: number;
  preparation_notes?: string;
  notes?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

// Methods:
// - getLogsForAnimal(animalId: string)
// - createLog(log: Omit<BrumationLog, 'id' | 'created_at' | 'updated_at'>)
// - updateLog(id: string, updates: Partial<BrumationLog>)
// - deleteLog(id: string)
// - endBrumation(id: string, endDate: string) // Sets end_date, auto-calculates duration
// - getActiveBrumation(animalId: string) // Returns current brumation if any
```

#### 3. `src/services/vetRecordService.ts`
```typescript
interface VetRecord {
  id: string;
  enclosure_animal_id: string;
  user_id: string;
  visit_date: string;
  visit_type: 'checkup' | 'illness' | 'injury' | 'surgery' | 'emergency' | 'follow-up' | 'other';
  vet_name?: string;
  clinic_name?: string;
  clinic_phone?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string[];
  cost?: number;
  currency: string;
  follow_up_needed: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  notes?: string;
  documents?: string[];
  photos?: string[];
  created_at: string;
  updated_at: string;
}

// Methods:
// - getRecordsForAnimal(animalId: string)
// - createRecord(record: Omit<VetRecord, 'id' | 'created_at' | 'updated_at'>)
// - updateRecord(id: string, updates: Partial<VetRecord>)
// - deleteRecord(id: string)
// - getUpcomingFollowUps(userId: string) // Across all animals
// - getTotalVetCosts(animalId: string) // Sum all costs
```

#### 4. `src/services/lengthLogService.ts`
```typescript
interface LengthLog {
  id: string;
  enclosure_animal_id: string;
  user_id: string;
  date: string;
  length: number;
  unit: 'inches' | 'cm' | 'feet' | 'meters';
  measurement_type?: 'snout-to-vent' | 'total-length' | 'carapace-length' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Methods:
// - getLogsForAnimal(animalId: string)
// - createLog(log: Omit<LengthLog, 'id' | 'created_at' | 'updated_at'>)
// - updateLog(id: string, updates: Partial<LengthLog>)
// - deleteLog(id: string)
// - getGrowthRate(animalId: string) // Calculate growth per month
```

### Phase 2: UI Components

#### Core Components to Create:

1. **ShedLogForm.tsx** - Add/edit shed records
2. **ShedLogList.tsx** - Display shed history
3. **BrumationTracker.tsx** - Start/end brumation, view history
4. **VetRecordForm.tsx** - Add/edit vet visits
5. **VetRecordList.tsx** - Display vet history
6. **LengthTracker.tsx** - Similar to WeightTracker component
7. **AnimalSourceForm.tsx** - Edit acquisition info (part of animal form)

#### Enhanced Views:

Update `AnimalDetailView.tsx` to include tabs/sections for:
- Weight & Length Charts (side by side)
- Shedding History
- Brumation History
- Vet Records
- Acquisition Info & Misc Notes

### Phase 3: Integration Points

#### AnimalDetailView.tsx Structure
```tsx
// Tabs/Sections:
<Tabs>
  <Tab label="Overview">
    {/* Basic info, quick stats, weight/length charts */}
  </Tab>
  
  <Tab label="Health">
    {/* Vet records, upcoming follow-ups */}
  </Tab>
  
  <Tab label="Growth">
    {/* Weight and length tracking with combined chart */}
  </Tab>
  
  <Tab label="Shedding">
    {/* Shed log list, add new shed */}
  </Tab>
  
  <Tab label="Brumation">
    {/* Brumation history, start/end tracking */}
  </Tab>
  
  <Tab label="Care">
    {/* Feeding logs, care tasks (existing) */}
  </Tab>
  
  <Tab label="Info">
    {/* Acquisition info, misc notes */}
  </Tab>
</Tabs>
```

#### MyAnimals.tsx Enhancements
Add visual indicators:
- 🩺 Red dot if vet follow-up due
- 💤 Blue indicator if currently brumating
- 📏/⚖️ Growth trend arrows (up/down/stable)

### Phase 4: Analytics & Insights

#### Dashboard Additions:
- **Shed Frequency**: Average days between sheds
- **Growth Charts**: Combined weight + length over time
- **Health Summary**: Total vet visits, upcoming appointments
- **Brumation Tracker**: Currently brumating animals, historical patterns

## Data Validation

### Required Validations:
1. **Shed Logs**: Date cannot be in future
2. **Brumation**: End date must be after start date
3. **Vet Records**: Cost must be positive
4. **Length Logs**: Length must be positive, unit conversion checks

### Business Logic:
1. **Auto-calculate** brumation duration when end_date set
2. **Alert user** if shed frequency changes dramatically
3. **Reminder notifications** for vet follow-ups
4. **Growth rate warnings** if animal stops growing or loses length

## TypeScript Types Location

Add to `src/types/database.types.ts`:
```typescript
export interface ShedLog { /* ... */ }
export interface BrumationLog { /* ... */ }
export interface VetRecord { /* ... */ }
export interface LengthLog { /* ... */ }

// Extend EnclosureAnimal:
export interface EnclosureAnimal {
  // ... existing fields
  source?: string;
  source_details?: string;
  acquisition_date?: string;
  acquisition_price?: number;
  acquisition_notes?: string;
}
```

## Migration Steps

### Step 1: Database (Run in Supabase SQL Editor)
```sql
-- Run: docs/ANIMAL_HEALTH_TRACKING_MIGRATION.sql
```

### Step 2: Services
Create 4 new service files following existing pattern (like weightTrackingService.ts)

### Step 3: Types
Extend `database.types.ts` with new interfaces

### Step 4: Components
Create forms and list components for each feature

### Step 5: Views
Update AnimalDetailView with tabs and data loading

### Step 6: Navigation
Add quick access from MyAnimals cards

## Example Usage Patterns

### Add a Shed Log:
```typescript
await shedLogService.createLog({
  enclosure_animal_id: animalId,
  user_id: user.id,
  shed_date: '2026-02-10',
  quality: 'complete',
  shed_in_one_piece: true,
  humidity_percent: 70,
  notes: 'Clean shed, no issues'
});
```

### Start Brumation:
```typescript
await brumationLogService.createLog({
  enclosure_animal_id: animalId,
  user_id: user.id,
  start_date: '2025-11-01',
  temperature_low: 50,
  temperature_high: 55,
  activity_level: 'inactive',
  preparation_notes: 'Gradually reduced temps over 2 weeks'
});
```

### End Brumation:
```typescript
await brumationLogService.endBrumation(brumationId, '2026-02-01');
// Auto-calculates duration_days
```

### Log Vet Visit:
```typescript
await vetRecordService.createRecord({
  enclosure_animal_id: animalId,
  user_id: user.id,
  visit_date: '2026-01-15',
  visit_type: 'checkup',
  vet_name: 'Dr. Smith',
  clinic_name: 'Exotic Animal Clinic',
  diagnosis: 'Healthy',
  cost: 75.00,
  follow_up_needed: false
});
```

## Performance Considerations

### Indexes Created:
- All foreign keys indexed (animal_id, user_id)
- Date fields indexed for time-range queries
- Status fields indexed (quality, visit_type, etc.)
- Composite index on follow-up reminders

### Query Optimization:
- Use `.limit()` for list views (default 50)
- Paginate vet records if > 100
- Cache growth rate calculations (recalculate on new entry only)

## Future Enhancements

### Phase 5+ Ideas:
- **Photo Galleries**: Dedicated photo management per animal
- **Health Scores**: Auto-calculate based on vet visits, shed quality, growth rate
- **PDF Export**: Generate complete animal health report
- **Calendar Integration**: Add vet appointments to Care Calendar
- **Reminders**: "Shed due soon" based on historical frequency
- **Breeding Records**: Track pairings, clutch info, offspring
- **Mortality Records**: Respectful logging when animals pass

## Notes for Misc Field

Rather than a single "misc" field, consider:
1. **General Notes**: Already exists in `enclosure_animals.notes`
2. **Acquisition Notes**: New `acquisition_notes` field
3. **Care Notes**: Use Care Task notes field
4. **Health Notes**: Use vet record notes

If you need a true "miscellaneous" notes area, add:
```sql
ALTER TABLE enclosure_animals
ADD COLUMN IF NOT EXISTS misc_notes TEXT;
```

But structured data is always better than freeform where possible.

## Questions to Consider

1. **Photo Storage**: Where? Supabase Storage bucket? External CDN?
2. **Document Storage**: Same as photos?
3. **Premium Feature Gating**: Which features require subscription?
4. **Mobile Optimization**: Forms work on phone screens?
5. **Export Format**: CSV, PDF, or both?
6. **Sharing**: Should users be able to share health records with vets?

## Summary

This architecture:
- ✅ Scalable (separate tables easy to extend)
- ✅ Type-safe (strong TypeScript interfaces)
- ✅ Performance-optimized (proper indexes)
- ✅ Follows existing patterns (similar to weight_logs)
- ✅ Secure (RLS policies on all tables)
- ✅ Future-proof (easy to add fields/features)

Ready to implement one feature at a time or all at once!
