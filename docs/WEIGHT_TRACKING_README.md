# Weight Tracking Feature - Implementation Guide

## 📊 Overview

The weight tracking feature allows users to log and monitor their animals' weight over time, providing visual trend analysis, statistics, and health insights. This is a **premium feature** that requires user authentication.

## 🎯 Feature Components

### 1. Database Layer (`WEIGHT_TRACKING_MIGRATION.sql`)
**Location:** `docs/WEIGHT_TRACKING_MIGRATION.sql`

**Tables:**
- `weight_logs` - Stores individual weight measurements

**Key Fields:**
- `weight_grams` - Standardized weight storage in grams
- `measurement_date` - Timestamp of measurement
- `notes` - Optional observations
- `photo_url` - Optional photo (future premium feature)

**Security:**
- Row Level Security (RLS) enabled
- Users can only access their own weight logs
- Automatic `updated_at` timestamp trigger

**To Install:**
1. Open Supabase SQL Editor
2. Copy/paste the entire migration file
3. Click "Run"

### 2. Type Definitions (`weightTracking.ts`)
**Location:** `src/types/weightTracking.ts`

**Key Types:**
- `WeightLog` - Individual weight entry
- `WeightStats` - Calculated statistics (current, change, trend)
- `WeightAnalytics` - Comprehensive analytics including chart data
- `WeightUnit` - Supported units (g, kg, oz, lbs)

**Unit Conversion:**
- All weights stored in grams for consistency
- Automatic conversion between units
- Appropriate decimal precision per unit

### 3. Service Layer (`weightTrackingService.ts`)
**Location:** `src/services/weightTrackingService.ts`

**Methods:**
```typescript
// CRUD Operations
getWeightLogs(enclosureAnimalId) // Get all logs for an animal
createWeightLog(userId, input)    // Create new entry
updateWeightLog(id, updates)      // Update existing entry
deleteWeightLog(id)               // Delete entry

// Analytics
getWeightStats(enclosureAnimalId)      // Calculate current stats
getWeightAnalytics(enclosureAnimalId)  // Full analytics + chart data
```

**Statistics Calculated:**
- Current weight
- Weight change from last measurement
- Percentage change
- Days since last weigh
- 30-day average
- Trend detection (gaining/stable/losing)
- Growth rate (grams per month)

### 4. UI Components

#### `WeightTracker.tsx` (Main Container)
- Orchestrates all sub-components
- Handles refresh logic
- Shows auth prompt for non-logged-in users

#### `WeightLogForm.tsx`
- Weight entry form with unit conversion
- Date/time picker (defaults to now)
- Optional notes field
- Supports create and edit modes

#### `WeightChart.tsx`
- Line chart visualization using Recharts
- Shows weight trend over time
- Average weight reference line
- Responsive design

#### `WeightStats.tsx`
- Stats card grid layout
- Current weight, change, trend indicators
- Color-coded trend cards (green=gaining, red=losing, blue=stable)
- Days since last weigh, growth rate

#### `WeightHistory.tsx`
- Chronological list of all weight entries
- Inline editing capability
- Delete with confirmation
- Formatted dates and times

## 🔌 Integration Points

### CareCalendar Integration
**File:** `src/components/CareCalendar/AnimalList.tsx`

**Changes Made:**
1. Added Scale icon button to each animal card
2. State management for tracking modal
3. Full-screen weight tracker modal overlay

**Usage:**
- Click Scale icon next to any animal
- Opens full-screen weight tracker
- Modal includes close button (X)

### Navigation Structure
```
Care Calendar
└── Enclosure Manager
    └── Animal List
        └── [Animal Card]
            ├── Scale Button → Weight Tracker Modal
            ├── Edit Button
            └── Delete Button
```

## 💻 Technical Requirements

### Dependencies
```json
{
  "recharts": "^2.x" // For weight charts
  "@supabase/supabase-js": "^2.x" // Database
  "lucide-react": "^0.x" // Icons
}
```

### Installation
```bash
npm install recharts
```

### Environment Variables
Requires Supabase credentials in `.env.local`:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📋 Database Schema

```sql
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  enclosure_animal_id UUID NOT NULL,
  weight_grams DECIMAL(10, 2) NOT NULL CHECK (weight_grams > 0),
  measurement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_weight_logs_user_id` - Fast user queries
- `idx_weight_logs_animal_id` - Fast animal queries
- `idx_weight_logs_date` - Chronological sorting
- `idx_weight_logs_animal_date` - Combined animal + date queries

## 🎨 User Experience

### Weight Entry Flow
1. User clicks Scale icon on animal card
2. Full-screen modal opens with weight tracker
3. Click "Log Weight" button
4. Form appears with:
   - Weight input (auto-converts units)
   - Unit selector (g/kg/oz/lbs)
   - Date picker (defaults to today)
   - Time picker (defaults to now)
   - Notes field (optional)
5. Click "Save" → Entry created
6. Stats/chart/history auto-refresh

### Analytics Display
- **Stats Cards** - 4-column grid showing key metrics
- **Chart** - Line graph with average reference line
- **History** - Scrollable list with edit/delete actions

### Mobile Responsiveness
- Stats grid collapses to single column on mobile
- Chart maintains aspect ratio
- Modal uses full viewport height
- Touch-friendly button sizes

## 🔐 Premium Feature Considerations

### Free Tier Limitations (Future Implementation)
- Allow 3 weight entries per animal (trial)
- Show blurred chart with "Upgrade" overlay
- Basic stats visible (current weight only)

### Pro Tier ($9.99/mo)
- Unlimited weight entries
- Full analytics dashboard
- Export to CSV

### Keeper Pro Tier ($19.99/mo)
- Everything in Pro
- Photo uploads per entry
- AI anomaly detection
- Vet-ready PDF reports
- Growth predictions

## 📊 Analytics Formulas

### Weight Change
```typescript
weightChange = currentWeight - previousWeight
weightChangePercent = (weightChange / previousWeight) * 100
```

### Trend Detection
Based on last 3 measurements:
```typescript
changePercent = ((last - first) / first) * 100
if (changePercent > 2) return 'gaining'
if (changePercent < -2) return 'losing'
return 'stable'
```

### Growth Rate
```typescript
gramsPerDay = (latestWeight - oldestWeight) / daysBetween
growthRate = gramsPerDay * 30 // Monthly rate
```

## 🧪 Testing Checklist

### Manual Testing
- [ ] Create weight entry (all units)
- [ ] Edit existing entry
- [ ] Delete entry with confirmation
- [ ] Chart displays correctly with 1+ entries
- [ ] Stats calculate accurately
- [ ] Unit conversion works (switch between g/kg/oz/lbs)
- [ ] Date validation (cannot select future dates)
- [ ] Notes field optional
- [ ] Modal close (X button, ESC key)
- [ ] Responsive on mobile

### Edge Cases
- [ ] No weight entries yet (empty state)
- [ ] Single entry (no trend calculation)
- [ ] Two entries (no growth rate)
- [ ] 50+ entries (performance)
- [ ] Very small weights (< 1g)
- [ ] Very large weights (> 10kg)
- [ ] Same-day multiple entries

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers

## 🚀 Deployment Steps

1. **Database Setup:**
   ```sql
   -- Run WEIGHT_TRACKING_MIGRATION.sql in Supabase
   ```

2. **Install Dependencies:**
   ```bash
   npm install recharts
   ```

3. **Build & Deploy:**
   ```bash
   npm run build
   # Deploy to Netlify/Vercel
   ```

4. **Verify RLS:**
   - Test with multiple user accounts
   - Ensure users can't see each other's weight logs

## 📝 Future Enhancements

### Phase 2 (Premium Features)
- [ ] Photo uploads (Supabase Storage)
- [ ] CSV export
- [ ] PDF vet reports
- [ ] Multiple animals comparison chart
- [ ] Weight goals/targets
- [ ] Reminder notifications ("Weigh your frog!")

### Phase 3 (AI/ML Features)
- [ ] Anomaly detection (rapid weight loss)
- [ ] Growth predictions
- [ ] Seasonal pattern analysis
- [ ] Health alerts ("Consult vet")

### Phase 4 (Advanced Analytics)
- [ ] Correlation with feeding logs
- [ ] Shed cycle correlation
- [ ] Temperature/humidity impact analysis
- [ ] Breeding weight tracking

## 🐛 Known Issues / Limitations

1. **Chart Performance**: May slow with 200+ entries
   - **Solution**: Implement data aggregation for large datasets

2. **Timezone Handling**: Measurement dates stored in UTC
   - **Solution**: Display in user's local timezone (already implemented)

3. **Photo Storage**: Currently placeholder (not implemented)
   - **Solution**: Supabase Storage integration in Phase 2

## 📚 Related Documentation

- [MONETIZATION_STRATEGY.md](./MONETIZATION_STRATEGY.md) - Premium tiers
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup
- [CARE_REMINDERS_IMPLEMENTATION.md](./CARE_REMINDERS_IMPLEMENTATION.md) - Related feature

## 🎓 Code Examples

### Creating a Weight Entry
```typescript
import { weightTrackingService } from '@/services/weightTrackingService';

await weightTrackingService.createWeightLog(userId, {
  enclosureAnimalId: 'animal-uuid',
  weightGrams: 45.5,
  measurementDate: new Date(),
  notes: 'Healthy, active'
});
```

### Getting Analytics
```typescript
const analytics = await weightTrackingService.getWeightAnalytics(animalId);

console.log(analytics.stats.currentWeight); // 45.5
console.log(analytics.stats.trend); // 'gaining'
console.log(analytics.chartData); // Array for Recharts
```

### Unit Conversion
```typescript
import { WEIGHT_CONVERSIONS } from '@/types/weightTracking';

const grams = WEIGHT_CONVERSIONS.toGrams.oz(1.6); // Convert 1.6 oz to grams
const ounces = WEIGHT_CONVERSIONS.fromGrams.oz(45.5); // Convert 45.5g to oz
```

## 💡 Tips for Developers

1. **Always store weights in grams** - Simplifies calculations
2. **Use Recharts `ResponsiveContainer`** - Ensures proper chart sizing
3. **Implement optimistic UI updates** - Better UX during saves
4. **Cache analytics** - Reduce database queries
5. **Add loading states** - Handle slow connections gracefully
6. **Validate weight inputs** - Prevent negative/zero values
7. **Format dates consistently** - Use `toLocaleDateString()`

---

## ✅ Quick Start

```bash
# 1. Run database migration
# Open Supabase SQL Editor → Paste WEIGHT_TRACKING_MIGRATION.sql → Run

# 2. Install dependencies
npm install recharts

# 3. Start dev server
npm run dev

# 4. Navigate to Care Calendar → Click animal Scale icon

# 5. Log first weight entry!
```

---

**Questions?** Check the inline code comments or review the existing `careTaskService.ts` for similar patterns.
