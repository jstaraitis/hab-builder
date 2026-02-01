# Blog Status System - Implementation Complete

## Overview
The blog status system allows content creators to transparently communicate the validation level of care information to users. This addresses concerns about publishing potentially incorrect information by showing readers exactly how thoroughly each guide has been reviewed.

## Status Levels (6 Total)

### 1. **Draft** (Gray badge)
- Initial content creation, incomplete or unverified
- Not yet ready for community review
- May contain placeholder sections or unconfirmed information

### 2. **In Progress** (Blue badge)
- Content actively being researched and written
- May have some sections complete but not ready for review
- Authors are still gathering sources and validating information

### 3. **Review Needed** (Amber badge)
- Content complete and ready for review
- Authors have finished initial writing and fact-checking
- Seeking community or expert feedback

### 4. **Community Reviewed** (Purple badge)
- Reviewed by experienced keepers in the community
- Requires `reviewedBy` field with reviewer name(s)
- Information validated by hobbyists with hands-on experience

### 5. **Expert Verified** (Green badge)
- Reviewed by veterinarians, biologists, or professional breeders
- Requires `reviewedBy` field with expert credentials
- Highest level of validation for care information

### 6. **Published** (No badge)
- Fully verified and approved for public consumption
- No status indicator shown (implied complete validation)
- Should only be used for content you're fully confident in

## Visual Design

### Individual Blog Post View (BlogPost.tsx)
- **Full banner** at top of article with:
  - Icon (specific to each status)
  - Colored background and border
  - Status label
  - Optional reviewer name (for community-reviewed and expert-verified)
  - Explanatory message about what the status means
- Only shows banner if status exists and is NOT "published"

### Blog List View (AnimalGuides.tsx)
- **Compact badge** at top of each blog card with:
  - Small icon (3x3 pixels)
  - Status label text
  - Colored background matching the full banner
- Shows in both general guides section and animal-specific guides section
- Only displays if status exists and is NOT "published"

## Implementation Files

### Type Definitions
- **`src/data/blog/index.ts`** - Added `BlogStatus` type and optional `status` and `reviewedBy` fields to `BlogPost` interface

### Components
- **`src/components/Blog/BlogPost.tsx`** - Added full status banner with `getStatusConfig()` function
- **`src/components/Blog/AnimalGuides.tsx`** - Added compact status badges with `getStatusBadge()` function

### Templates
All templates in `src/data/blog/_templates/` now include:
```json
"status": "draft",
"reviewedBy": ""
```

### Documentation
- **`src/data/blog/_templates/README.md`** - Complete guide to using the status system, review processes, and content accuracy guidelines

## Usage for Content Creators

### Adding Status to New Blog Posts
1. Include `status` field in blog post JSON (defaults to "draft")
2. Optionally include `reviewedBy` field for reviewer credits
3. Update status as content progresses through review

Example:
```json
{
  "id": "whites-tree-frog-feeding-guide",
  "title": "Feeding Guide for White's Tree Frogs",
  "status": "in-progress",
  "content": [...]
}
```

### For Reviewed Content
```json
{
  "id": "axolotl-water-quality-guide",
  "title": "Axolotl Water Quality Guide",
  "status": "expert-verified",
  "reviewedBy": "Dr. Jane Smith, DVM, Exotic Animal Specialist",
  "content": [...]
}
```

### For Published Content
Simply omit the `status` field or set to "published":
```json
{
  "id": "bioactive-terrarium-guide",
  "title": "Bioactive Terrarium Setup",
  "status": "published",
  "content": [...]
}
```
No badge will be shown to users.

## Example Blog Post with Status

The White's Tree Frog feeding guide (`whites-tree-frog-feeding-guide.json`) has been updated with `"status": "in-progress"` as a demonstration.

## Testing Checklist

- [ ] View individual blog post with status - verify full banner displays
- [ ] View blog list - verify compact badges display on cards
- [ ] Test each status level (draft, in-progress, review-needed, etc.)
- [ ] Verify "published" status doesn't show any badge
- [ ] Check mobile responsiveness of badges
- [ ] Verify dark mode styling for all status colors
- [ ] Test reviewer name display for community-reviewed/expert-verified

## Color Scheme

| Status | Background | Text | Icon |
|--------|-----------|------|------|
| Draft | Gray | Gray | FileText |
| In Progress | Blue | Blue | AlertTriangle |
| Review Needed | Amber | Amber | Eye |
| Community Reviewed | Purple | Purple | Users |
| Expert Verified | Green | Green | Award |
| Published | (none) | (none) | (none) |

## Next Steps

1. **Test the system** - View blog pages to see status badges in action
2. **Update existing content** - Add status fields to current blog posts
3. **Document review process** - Create workflow for community members to submit reviews
4. **Seek expert reviewers** - Reach out to veterinarians or professional breeders for high-priority content
5. **Monitor feedback** - Track user confidence in content based on status transparency

## Philosophy

This system prioritizes **transparency over perfection**. It's better to:
- Show a "draft" badge on useful but unverified content
- Than to either publish it without disclaimer OR not publish it at all
- Users can make informed decisions about trusting the information

The goal is ethical content publication, not content gatekeeping.
