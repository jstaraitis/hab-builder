# High-Level Architecture Improvements
## Habitat Builder - Code Maintainability & Debugging Analysis

**Date:** January 29, 2026  
**Focus:** Critical architectural changes for long-term maintainability and debugging effectiveness

---

## 🎯 Executive Summary

This report identifies **5 HIGH-IMPACT architectural improvements** that will dramatically improve code maintainability and debugging capabilities. These are not minor refactorings—they are foundational changes that will compound in value over time.

**Current State:**
- ✅ Good: Type safety (recently improved), modular shopping list generator
- ⚠️ Risk: No error boundaries, minimal logging, no data validation layer, limited testing infrastructure
- 🔴 Critical: Single failure point in App.tsx, no observability strategy

---

## 1. 🚨 CRITICAL: Implement Error Boundaries & Centralized Error Handling

### Current State
**Problem:** App.tsx has a single try-catch in `handleGenerate()` that just logs to console:
```typescript
catch (error) {
  const errorMsg = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to generate plan:', error);
  setError(`Failed to generate plan: ${errorMsg}`);
}
```

**Issues:**
- Errors in React components cause white screen of death
- No error tracking/monitoring infrastructure
- User sees nothing when things break
- No context about what user was doing when error occurred
- Errors in child views (SuppliesView, PlanView, etc.) are unhandled

**Impact:**
- Users lose their work silently
- Debugging production issues is impossible (no error reports)
- Single component error crashes entire app

### Recommended Solution

**1. Create Error Boundary Infrastructure**
```typescript
// src/components/ErrorBoundary/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service (Sentry, LogRocket, etc.)
    logErrorToService({
      error,
      errorInfo,
      userContext: {
        animal: this.props.input?.animal,
        enclosureType: this.props.input?.type,
        pathname: window.location.pathname
      }
    });
  }
}
```

**2. Wrap Each Major View**
```typescript
// Wrap each route in App.tsx
<Route path="/design" element={
  <ErrorBoundary fallback={<DesignErrorFallback />}>
    <DesignView />
  </ErrorBoundary>
} />
```

**3. Create Error Context for Engine Functions**
```typescript
// src/engine/errors.ts
export class EnclosureValidationError extends Error {
  constructor(
    message: string,
    public context: {
      input: EnclosureInput;
      profile: AnimalProfile;
      validationType: 'size' | 'type' | 'bioactive';
    }
  ) {
    super(message);
    this.name = 'EnclosureValidationError';
  }
}
```

**Effort:** 2-3 days  
**Impact:** 🔥🔥🔥 Prevents 90% of "app is broken" user reports  
**Priority:** CRITICAL

---

## 2. 📊 HIGH: Implement Structured Logging & Debugging Infrastructure

### Current State
**Problem:** Only basic console.log statements in scripts, zero logging in production code

**Issues:**
- Can't trace user flows through the app
- No performance metrics (how long does plan generation take?)
- Can't debug reported issues without reproducing manually
- No visibility into which features are actually used

### Recommended Solution

**1. Create Logger Service**
```typescript
// src/utils/logger.ts
export const logger = {
  // Development: full logs; Production: send to analytics
  debug: (message: string, context?: object) => {},
  info: (message: string, context?: object) => {},
  warn: (message: string, context?: object) => {},
  error: (message: string, error: Error, context?: object) => {},
  
  // User flow tracking
  trackEvent: (event: string, properties?: object) => {},
  trackPageView: (path: string) => {},
  trackGeneration: (input: EnclosureInput, duration: number) => {}
};
```

**2. Instrument Critical Paths**
```typescript
// In generatePlan.ts
export function generatePlan(input: EnclosureInput): BuildPlan {
  const startTime = performance.now();
  logger.info('Plan generation started', { animal: input.animal });
  
  try {
    // ... existing logic
    const duration = performance.now() - startTime;
    logger.trackGeneration(input, duration);
    return plan;
  } catch (error) {
    logger.error('Plan generation failed', error, { input });
    throw error;
  }
}
```

**3. Add Debug Mode Toggle**
```typescript
// In App.tsx - accessible via keyboard shortcut
const [debugMode, setDebugMode] = useState(
  localStorage.getItem('debug') === 'true'
);

// Ctrl+Shift+D to toggle
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      const newMode = !debugMode;
      setDebugMode(newMode);
      localStorage.setItem('debug', String(newMode));
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [debugMode]);
```

**Effort:** 1-2 days  
**Impact:** 🔥🔥 Essential for debugging user issues and understanding usage patterns  
**Priority:** HIGH

---

## 3. 🛡️ HIGH: Add Runtime Data Validation Layer

### Current State
**Problem:** TypeScript types exist, but no runtime validation of:
- Animal JSON files loaded dynamically
- User input from forms
- Equipment catalog integrity
- Blog content structure

**Issues:**
- Malformed JSON files cause cryptic errors
- No validation that animal profiles meet schema requirements
- Equipment catalog changes can break shopping list silently
- Blog posts with wrong structure crash BlogPost component

### Recommended Solution

**1. Add Zod for Runtime Validation**
```bash
npm install zod
```

**2. Create Schema Definitions**
```typescript
// src/engine/schemas.ts
import { z } from 'zod';

export const AnimalProfileSchema = z.object({
  id: z.string(),
  commonName: z.string(),
  scientificName: z.string(),
  careLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  minEnclosureSize: z.object({
    width: z.number().positive(),
    depth: z.number().positive(),
    height: z.number().positive(),
    units: z.enum(['in', 'cm'])
  }),
  careTargets: z.object({
    temperature: z.object({
      day: z.object({ min: z.number(), max: z.number() }),
      night: z.object({ min: z.number(), max: z.number() }),
      basking: z.union([
        z.number(),
        z.object({ min: z.number(), max: z.number() })
      ]).optional()
    }),
    // ... rest of schema
  }),
  // Validates entire structure
}).strict(); // Catch extra fields

export type AnimalProfile = z.infer<typeof AnimalProfileSchema>;
```

**3. Validate on Load**
```typescript
// src/data/animals/index.ts
import { AnimalProfileSchema } from '../../engine/schemas';

export const animalProfiles = Object.fromEntries(
  Object.entries(animalModules).map(([path, module]) => {
    try {
      const validated = AnimalProfileSchema.parse(module.default);
      return [validated.id, validated];
    } catch (error) {
      console.error(`Invalid animal profile in ${path}:`, error);
      throw new Error(`Animal profile validation failed for ${path}`);
    }
  })
);
```

**4. Build-Time Validation Script**
```javascript
// scripts/validate-data.js
// Run during npm run build to catch issues before deployment
import { animalProfiles } from '../src/data/animals/index.js';
import { equipmentCatalog } from '../src/data/equipment/index.js';

console.log(`✅ Validated ${Object.keys(animalProfiles).length} animal profiles`);
console.log(`✅ Validated ${Object.keys(equipmentCatalog).length} equipment items`);
```

**Effort:** 2-3 days  
**Impact:** 🔥🔥 Catches data errors at build time instead of runtime  
**Priority:** HIGH

---

## 4. 🧪 MEDIUM-HIGH: Establish Testing Foundation

### Current State
**Problem:** 
- Vitest installed but **zero tests exist**
- No test coverage for rule engine calculations
- Can't confidently refactor without manual testing
- Edge cases (micro enclosures, extreme dimensions) not tested

**Current Manual Testing:**
> "Generate plans for all animals at 3 sizes (18×18×24, 24×18×36, 36×18×48)"

### Recommended Solution

**1. Start with Critical Business Logic (Rule Engine)**
```typescript
// src/engine/__tests__/dimensionUtils.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeToInches, calculateGallons } from '../dimensionUtils';

describe('dimensionUtils', () => {
  describe('normalizeToInches', () => {
    it('converts cm to inches correctly', () => {
      const result = normalizeToInches(45.72, 45.72, 60.96, 'cm');
      expect(result.width).toBeCloseTo(18, 1);
      expect(result.height).toBeCloseTo(24, 1);
    });
    
    it('handles inches passthrough', () => {
      const result = normalizeToInches(18, 18, 24, 'in');
      expect(result.width).toBe(18);
    });
  });
  
  describe('calculateGallons', () => {
    it('calculates standard 20 gallon long correctly', () => {
      // 30" x 12" x 12" = 20 gallons
      const gallons = calculateGallons({ width: 30, depth: 12, height: 12 });
      expect(gallons).toBeCloseTo(20, 0);
    });
  });
});
```

**2. Test Shopping List Generation**
```typescript
// src/engine/shopping/__tests__/index.test.ts
describe('generateShoppingList', () => {
  it('includes bioactive items when bioactive is true', () => {
    const input = { ...mockInput, bioactive: true };
    const items = generateShoppingList(mockDims, mockProfile, input);
    
    expect(items.find(i => i.id === 'drainage')).toBeDefined();
    expect(items.find(i => i.id === 'springtails')).toBeDefined();
  });
  
  it('excludes bioactive items when bioactive is false', () => {
    const input = { ...mockInput, bioactive: false };
    const items = generateShoppingList(mockDims, mockProfile, input);
    
    expect(items.find(i => i.id === 'drainage')).toBeUndefined();
  });
});
```

**3. Integration Test for Full Plan Generation**
```typescript
// src/engine/__tests__/generatePlan.integration.test.ts
describe('generatePlan integration', () => {
  it('generates complete plan for White\'s Tree Frog', () => {
    const input: EnclosureInput = {
      width: 18, depth: 18, height: 24, units: 'in',
      animal: 'whites-tree-frog',
      bioactive: true,
      // ... rest of input
    };
    
    const plan = generatePlan(input);
    
    expect(plan.shoppingList.length).toBeGreaterThan(10);
    expect(plan.warnings.length).toBeGreaterThan(0);
    expect(plan.steps.length).toBeGreaterThan(5);
  });
});
```

**4. Add Test Command to package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

**Effort:** 3-5 days (initial foundation)  
**Impact:** 🔥🔥 Enables confident refactoring, catches regressions early  
**Priority:** MEDIUM-HIGH

---

## 5. 🏗️ MEDIUM: Refactor State Management Architecture

### Current State
**Problem:** All state lives in App.tsx (293 lines), passed down through props

**Current Structure:**
```
App.tsx (293 lines)
├── input: EnclosureInput
├── plan: BuildPlan | null
├── error: string
└── 10+ view components receive props
```

**Issues:**
- Props drilling through 3+ levels (App → View → SubComponent)
- Difficult to add global state (e.g., user preferences, saved builds)
- Can't easily share state between views without going through App.tsx
- Testing components in isolation requires complex prop mocking

### Recommended Solution

**Option A: Context API (Simpler, Good for Current Scale)**
```typescript
// src/contexts/EnclosureContext.tsx
interface EnclosureContextType {
  input: EnclosureInput;
  setInput: (input: EnclosureInput) => void;
  plan: BuildPlan | null;
  generatePlan: () => void;
  error: string | null;
  selectedProfile?: AnimalProfile;
}

export const EnclosureContext = createContext<EnclosureContextType>(null);

export function EnclosureProvider({ children }: PropsWithChildren) {
  const [input, setInput] = useState<EnclosureInput>(defaultInput);
  const [plan, setPlan] = useState<BuildPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generatePlan = useCallback(() => {
    try {
      const generated = generatePlanEngine(input);
      setPlan(generated);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [input]);
  
  const value = useMemo(() => ({
    input, setInput, plan, generatePlan, error, selectedProfile
  }), [input, plan, error, selectedProfile, generatePlan]);
  
  return <EnclosureContext.Provider value={value}>{children}</EnclosureContext.Provider>;
}

// Usage in components
export function DesignView() {
  const { input, setInput, generatePlan } = useEnclosure();
  // No props drilling!
}
```

**Option B: Zustand (Better for Phase 2 - Saved Builds, User Preferences)**
```typescript
// src/store/enclosureStore.ts
import create from 'zustand';
import { persist } from 'zustand/middleware';

export const useEnclosureStore = create(
  persist(
    (set, get) => ({
      input: defaultInput,
      plan: null,
      savedBuilds: [],
      
      setInput: (input) => set({ input }),
      generatePlan: () => {
        const generated = generatePlanEngine(get().input);
        set({ plan: generated });
      },
      saveBuild: (name) => {
        set({ savedBuilds: [...get().savedBuilds, { name, input: get().input }] });
      }
    }),
    { name: 'habitat-builder-storage' }
  )
);
```

**Effort:** 1-2 days (Context API), 2-3 days (Zustand)  
**Impact:** 🔥 Simplifies component tree, enables future features  
**Priority:** MEDIUM (but enables Phase 2 features)

---

## 📋 Implementation Roadmap

### Phase 1: Critical Stability (Week 1-2)
**Goal:** Prevent catastrophic failures, enable debugging

1. **Day 1-3:** Error Boundaries + Centralized Error Handling
   - Create ErrorBoundary component
   - Wrap all routes
   - Add structured error types
   - Test error scenarios

2. **Day 4-5:** Structured Logging
   - Create logger service
   - Instrument generatePlan()
   - Add debug mode toggle
   - Test in production build

### Phase 2: Data Integrity (Week 3)
**Goal:** Catch data errors before they reach users

3. **Day 6-8:** Runtime Validation with Zod
   - Define schemas for all data types
   - Add validation to data loading
   - Create build-time validation script
   - Update animal-template.json with schema docs

### Phase 3: Testing Foundation (Week 4)
**Goal:** Enable confident refactoring

4. **Day 9-13:** Core Tests
   - Write tests for dimensionUtils
   - Test shopping list generators
   - Integration tests for generatePlan
   - Set up CI to run tests on PR

### Phase 4: State Management (Week 5)
**Goal:** Simplify future development

5. **Day 14-16:** Context API Implementation
   - Create EnclosureContext
   - Migrate App.tsx state
   - Update all view components
   - Remove props drilling

---

## 🎯 Quick Wins (Can Be Done Independently)

These can be implemented in 1-2 hours each while waiting on larger changes:

1. **Add NODE_ENV checks for console logs**
```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;
export const log = isDev ? console.log : () => {};
```

2. **Add data-testid attributes to critical components**
```tsx
<button data-testid="generate-plan-button" onClick={handleGenerate}>
```

3. **Create constants file for magic numbers**
```typescript
// src/engine/constants.ts
export const CUBIC_INCHES_PER_GALLON = 231;
export const CUBIC_INCHES_PER_CUBIC_FOOT = 1728;
export const CM_PER_INCH = 2.54;
```

4. **Add performance monitoring**
```typescript
// In generatePlan.ts
if (import.meta.env.DEV) {
  console.time('generatePlan');
  const result = generatePlan(input);
  console.timeEnd('generatePlan');
  return result;
}
```

---

## 📊 Metrics for Success

After implementing these changes, you should see:

- **Error Tracking:**
  - Zero uncaught React errors reaching users
  - 100% of errors logged with context
  - < 5 minute average time to reproduce reported bugs

- **Data Integrity:**
  - Zero runtime type errors from data files
  - 100% of animal profiles validated on build
  - Immediate feedback on malformed JSON

- **Testing:**
  - > 80% coverage on rule engine
  - > 60% coverage on components
  - All critical paths tested

- **Maintainability:**
  - Props drilling reduced by 80%
  - New features add < 10 lines to App.tsx
  - Refactoring confidence increases dramatically

---

## 🚀 Next Steps

1. **Review this document** with team/stakeholders
2. **Prioritize based on pain points** - Are user errors or debugging difficulties worse?
3. **Start with Phase 1** - Error boundaries are non-negotiable for production
4. **Implement incrementally** - Each phase provides immediate value
5. **Update .github/copilot-instructions.md** with new patterns as they're established

---

## 💡 Why These Over Other Improvements?

**Not included but considered:**
- CSS-in-JS / Styled Components → Current Tailwind approach works fine
- GraphQL / API Layer → No backend yet, premature
- Micro-frontends → Overcomplicated for current scale
- Redux → Overkill when Context API solves the problem
- E2E Tests (Playwright/Cypress) → Unit/integration tests provide more ROI first

**These 5 changes were selected because they:**
1. Have high impact-to-effort ratios
2. Compound in value over time (enable future work)
3. Address actual pain points (debugging, data errors)
4. Are industry standard practices for production apps
5. Don't require architectural rewrites

---

**Report Generated:** January 29, 2026  
**Review Status:** PENDING  
**Next Review:** After Phase 1 completion
