# Blog Post Templates & Status System

## Status Workflow

All blog posts should include a `status` field to indicate their review/validation state. This transparency helps users understand the reliability of care information.

### Status Levels

1. **`draft`** (Gray badge with FileText icon)
   - Initial content creation, incomplete or unverified
   - Not yet ready for community review
   - May contain placeholder sections or unconfirmed information

2. **`in-progress`** (Blue badge with AlertTriangle icon)
   - Content actively being researched and written
   - May have some sections complete but not ready for review
   - Authors are still gathering sources and validating information

3. **`review-needed`** (Amber badge with Eye icon)
   - Content complete and ready for review
   - Authors have finished initial writing and fact-checking
   - Seeking community or expert feedback

4. **`community-reviewed`** (Purple badge with Users icon)
   - Reviewed by experienced keepers in the community
   - Requires `reviewedBy` field with reviewer name(s)
   - Information validated by hobbyists with hands-on experience

5. **`expert-verified`** (Green badge with Award icon)
   - Reviewed by veterinarians, biologists, or professional breeders
   - Requires `reviewedBy` field with expert credentials
   - Highest level of validation for care information

6. **`published`** (No badge shown - default state)
   - Fully verified and approved for public consumption
   - No status indicator shown (implied complete validation)
   - Should only be used for content you're fully confident in

### Adding Status to Blog Posts

```json
{
  "id": "whites-tree-frog-feeding-guide",
  "title": "White's Tree Frog Feeding Guide",
  "author": "Habitat Builder",
  "status": "community-reviewed",
  "reviewedBy": "John Smith (15 years experience with White's Tree Frogs)",
  "content": [...]
}
```

**Required fields:**
- `status`: One of the status levels above (omit for published content)
- `reviewedBy`: Required for `community-reviewed` and `expert-verified` statuses

**Optional for other statuses:**
- Can omit `reviewedBy` for draft/in-progress/review-needed
- Can omit `status` entirely for published content (defaults to no badge)

## Template Files

### Standard Guide Templates

Each template follows the same structure but with species-specific content variations:

1. **TEMPLATE-enclosure-setup-guide.json** - Tank sizing, enclosure types, layout design
2. **TEMPLATE-feeding-guide.json** - Diet schedules, prey sizes, supplements, foods to avoid
3. **TEMPLATE-hydration-guide.json** - Water sources, humidity needs, misting schedules (terrestrial)
4. **TEMPLATE-substrate-guide.json** - Safe substrate options, bioactive setups, maintenance
5. **TEMPLATE-lighting-guide.json** - UVB requirements, heat lamps, day/night cycles
6. **TEMPLATE-temp-humidity-guide.json** - Temperature gradients, humidity ranges, seasonal adjustments

### Using Templates

1. Copy the appropriate template file
2. Rename to `[species-id]-[guide-type].json`
3. Replace all `[PLACEHOLDER]` fields with species-specific information
4. Set appropriate `status` field (start with "draft")
5. Add to species folder: `src/data/blog/[species-name]/`
6. Import in `src/data/blog/index.ts`
7. Add blog ID to animal's `relatedBlogs` array in animal profile JSON

### Content Block Types

- `intro`: Hero section with overview
- `section`: Heading/subheading
- `text`: Paragraph content (can include inline HTML)
- `list`: Bulleted or numbered list
- `table`: Tabular data with headers and rows
- `warning`: Critical safety information (severity: critical/important/caution/tip)
- `highlight`: Key takeaways or important notes

## Review Process Recommendations

### For Draft Content
- Focus on accuracy over completeness
- Leave sections incomplete rather than guessing
- Add `TODO:` comments for missing information

### For Review-Needed Content
- Ensure all critical safety warnings are included
- Cross-reference multiple reputable sources
- Include citations for controversial or species-specific claims
- Test any care parameters yourself if possible

### For Community Review
- Seek experienced keepers with 3+ years of hands-on experience
- Get feedback from multiple sources when possible
- Document reviewer credentials in `reviewedBy` field
- Address all feedback before upgrading status

### For Expert Verification
- Seek veterinarians specializing in exotic pets/herpetology
- Professional breeders with scientific documentation
- Academic researchers or conservation biologists
- Document credentials (e.g., "Dr. Jane Smith, DVM, Exotic Animal Specialist")

## Content Accuracy Guidelines

### Critical Information (Requires Expert Verification)
- Temperature ranges (especially max/min tolerances)
- Toxic substrates, plants, or foods
- Medication dosages or health treatment advice
- Species identification for morphs/subspecies

### Community Review Acceptable
- General care routines and schedules
- Equipment recommendations and comparisons
- Behavioral observations and enrichment ideas
- Setup aesthetics and layout preferences

### Draft Status OK
- Personal experiences and anecdotes
- Experimental setups or non-standard approaches
- Regional availability of products/feeders
- Cost comparisons (prices change frequently)

## Notes

- **Published status should be rare**: Most content should remain at community-reviewed or expert-verified
- **Be transparent**: Better to show "draft" than publish unverified information
- **Update statuses**: As content is reviewed, update the status field and add reviewer credits
- **No external links**: Keep all content self-contained to maintain quality control
