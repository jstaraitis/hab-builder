# Care Tasks & Animal Management - User Guide

## Overview
Track care tasks and animals across all your enclosures with automated reminders, completion tracking, and health analytics.

---

## Features

### Care Tasks
- **Task Management**: Create feeding, misting, cleaning, maintenance, and health check tasks
- **Flexible Scheduling**: Daily, every-other-day, weekly, bi-weekly, monthly, or custom intervals
- **Smart Filters**: Filter by view (Today/This Week/All), pet, and layout (cards/list)
- **Completion Tracking**: Mark tasks complete with automatic next-due calculation
- **Reliability Analytics**: 30-day completion rate tracking
- **Selection Mode**: Bulk complete multiple tasks at once

### My Animals
- **Centralized View**: See all your animals across all enclosures in one place
- **Detailed Profiles**: Track name, gender, morph, birthday, and notes for each animal
- **Weight Tracking**: Integrated weight history charts
- **Unassigned Animals**: Animals can exist without an enclosure and be reassigned anytime
- **Visual Badges**: Color-coded badges for gender (purple), age (blue), and morph (orange)

---

## Data Structure

### Enclosures
- Name, species, custom name
- Setup date, substrate type
- Linked to care tasks and animals

### Animals (enclosure_animals)
- Optional enclosure assignment (can be moved/unassigned)
- Name and/or number
- Gender: male/female/unknown
- Morph: color variant tracking
- Birthday: automatic age calculation
- Notes: health info, temperament, special needs
- Weight history (separate tracking)

### Care Tasks
- Title, description, task type
- Frequency and scheduled time
- Next due date (auto-updated)
- Optional animal assignment (enclosure-wide or specific animal)
- Completion logs with reliability scoring

---

## Quick Start

### 1. Create an Enclosure
Navigate to Care Tasks → Add enclosure with species and name

### 2. Add Animals
- From Care Tasks: Expand enclosure → Add Animal
- From My Animals: Add Animal → Select enclosure (or leave unassigned)

### 3. Create Care Tasks
Click "Add Task" → Select:
- Task type (feeding, misting, cleaning, etc.)
- Frequency (daily, weekly, custom)
- Scheduled time
- Optional: assign to specific animal

### 4. Track Completions
- Tap checkmark on task cards
- Or use Selection Mode for bulk completion
- View reliability score (30-day completion rate)

---

## Mobile Optimizations

### Compact Filters (Care Tasks)
Single-row layout:
- **View dropdown**: Today/This Week/All Tasks
- **Pet filter**: Quick enclosure selection
- **Layout toggle**: Icon-only cards/list switcher
- **Menu button**: Access Analytics and Selection Mode

### Responsive Cards
- **Animal cards**: Compact layout with badges, quick actions in header
- **Task cards**: Swipe gestures, expandable details
- **Auto-hide header**: Hides on scroll down, shows on scroll up

---

## Database Migrations Required

Run these in Supabase SQL Editor:

1. **ANIMAL_GENDER_MIGRATION.sql** - Adds gender field
2. **ANIMAL_MORPH_MIGRATION.sql** - Adds morph field  
3. **ANIMAL_ENCLOSURE_OPTIONAL_MIGRATION.sql** - Makes enclosure optional

---

## Key Technical Details

- **Storage**: Supabase PostgreSQL with RLS (Row Level Security)
- **Auth**: Supabase Auth with email/password
- **State**: React hooks + context (AuthContext, ToastContext)
- **Routing**: react-router-dom with mobile + desktop navigation
- **PWA**: Service worker with offline capability (sw.js)

### File Structure
```
src/
  components/
    CareCalendar/
      CareCalendar.tsx          # Main task view
      TaskCreationModal.tsx     # Add/edit tasks
      EnclosureManager.tsx      # Enclosure CRUD
      AnimalList.tsx            # Animals per enclosure
      MyAnimals.tsx             # All animals view
  services/
    careTaskService.ts          # Task CRUD + completion logs
    enclosureService.ts         # Enclosure CRUD with cascade delete
    enclosureAnimalService.ts   # Animal CRUD across enclosures
  types/
    careCalendar.ts             # TS interfaces
```

---

## Future Enhancements
- Push notifications (browser/PWA)
- Export care logs to CSV
- Photo gallery per animal
- Feeding logs with food type tracking
- Shed tracking calendar
