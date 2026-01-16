# Habitat Builder - Setup Instructions

## Prerequisites

You need Node.js installed to run this project. Download from: https://nodejs.org/

## Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser to http://localhost:5173
```

## Project Structure Created

```
HabBuild/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance
├── src/
│   ├── engine/
│   │   ├── types.ts              # Core TypeScript types
│   │   └── generatePlan.ts       # Rule engine (deterministic calculator)
│   ├── data/
│   │   └── animals/
│   │       ├── eastern-gray-tree-frog.json
│   │       ├── whites-tree-frog.json
│   │       ├── crested-gecko.json
│   │       └── index.ts
│   ├── components/
│   │   ├── EnclosureForm/
│   │   │   └── EnclosureForm.tsx
│   │   ├── AnimalPicker/
│   │   │   └── AnimalPicker.tsx
│   │   ├── PlanPreview/
│   │   │   ├── PlanPreview.tsx
│   │   │   └── CareTargets.tsx
│   │   ├── Layout/
│   │   │   ├── TopDownLayout.tsx
│   │   │   └── SideViewLayout.tsx
│   │   ├── ShoppingList/
│   │   │   └── ShoppingList.tsx
│   │   ├── BuildSteps/
│   │   │   └── BuildSteps.tsx
│   │   └── Warnings/
│   │       └── Warnings.tsx
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind imports
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## What's Working

✅ Complete type system for enclosures, animals, and build plans  
✅ Rule engine that calculates equipment sizing and layout zones  
✅ 3 animal profiles with care requirements and warnings  
✅ Input components: enclosure form + animal picker  
✅ Output components: layouts, shopping list, build steps, warnings  
✅ Budget tiers affect equipment recommendations  
✅ Bioactive toggle adds drainage layer + cleanup crew  
✅ Beginner mode provides extra safety tips

## Next Steps

1. **Install Node.js** if not already installed
2. **Run `npm install`** to download dependencies
3. **Run `npm run dev`** to start the app
4. **Test the MVP** by generating plans for all 3 animals
5. **Iterate** on layout algorithms, equipment formulas, or add features

## Key Features to Test

- Generate plan for Eastern Gray Tree Frog (18×18×24")
- Toggle bioactive on/off → see shopping list changes
- Switch budget tiers → equipment brands update
- Try beginner mode → extra warnings appear
- Test with custom dimensions
- Verify UVB sizing calculations

## Future Enhancements (Phase 2)

- Shareable URLs for generated plans
- PDF export
- User accounts (Supabase)
- More species (terrestrial, aquatic)
- Cost estimation
- Plant database with safety info

---

**Questions?** See `.github/copilot-instructions.md` for architecture details.
