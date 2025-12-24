# PDF Comparison Feature - Usage Guide

## Overview

The PDF comparison feature allows side-by-side viewing of two PDFs with synchronized scrolling, unified zoom controls, and shared highlight management for the MWR domain.

## Components

### 1. PDFComparison Component

**Location:** `/src/components/pdf-comparison.jsx`

Core comparison component with dual PDF viewers and sync controls.

**Features:**
- Side-by-side PDF viewing (vertical or horizontal split)
- Synchronized scrolling between PDFs
- Unified zoom control (applies to both PDFs)
- Linked page navigation (when sync enabled)
- Resizable divider between panels
- View mode toggle (vertical/horizontal split)
- Persistent preferences (localStorage)

**Props:**
```javascript
{
  pdf1Url: string,              // First PDF file URL/ID
  pdf2Url: string,              // Second PDF file URL/ID
  pdf1Title?: string,           // Display title for PDF 1 (default: "Document 1")
  pdf2Title?: string,           // Display title for PDF 2 (default: "Document 2")
  highlights1?: Array,          // Highlights for first PDF
  highlights2?: Array,          // Highlights for second PDF
  onHighlight1?: Function,      // Callback for creating highlights on PDF 1
  onHighlight2?: Function,      // Callback for creating highlights on PDF 2
  selectedHighlight?: string,   // Currently selected highlight ID
  onSelectHighlight?: Function  // Callback when highlight selected
}
```

### 2. PDFWrapper Component

**Location:** `/src/components/pdf-wrapper.jsx`

Smart wrapper that automatically chooses between single PDF viewer and comparison mode.

**Decision Logic:**
1. If URL params `?pdf1=X&pdf2=Y` are present → use comparison mode
2. If review has `comparison_enabled=true` and both `comparison_pdf1_id` and `comparison_pdf2_id` set → use comparison mode
3. Otherwise → use single PDF viewer

**Props:**
```javascript
{
  review?: Object,              // Review entity with comparison settings
  fileUrl: string,              // Fallback single PDF URL
  highlights?: Array,           // All highlights
  onHighlight?: Function,       // Highlight creation callback
  selectedHighlight?: string,   // Selected highlight ID
  onSelectHighlight?: Function  // Selection callback
}
```

## Usage Examples

### Example 1: Enable Comparison via Review Entity

Set comparison fields in the review record:

```javascript
const review = {
  id: 123,
  name: "Audit Review 2024",
  comparison_enabled: true,
  comparison_pdf1_id: "file_abc123",
  comparison_pdf2_id: "file_xyz789",
  comparison_pdf1_title: "Draft Report",
  comparison_pdf2_title: "Final Report"
};
```

Then use PDFWrapper in your component:

```jsx
<PDFWrapper
  review={review}
  fileUrl={review.drive_file_id}
  highlights={highlights}
  onHighlight={handleHighlight}
  selectedHighlight={selectedId}
  onSelectHighlight={setSelectedId}
/>
```

### Example 2: Enable Comparison via URL Parameters

Navigate to a review page with comparison params:

```
/review/123?pdf1=file_abc123&pdf2=file_xyz789
```

The PDFWrapper will automatically detect these params and enable comparison mode.

### Example 3: Direct PDFComparison Usage

Use the comparison component directly:

```jsx
import { PDFComparison } from '@/components/pdf-comparison';

<PDFComparison
  pdf1Url="file_abc123"
  pdf2Url="file_xyz789"
  pdf1Title="Version 1"
  pdf2Title="Version 2"
  highlights1={leftHighlights}
  highlights2={rightHighlights}
  selectedHighlight={selectedId}
  onSelectHighlight={setSelectedId}
/>
```

## Configuration

### Master Config (master-config.yml)

The feature flag is already enabled in the MWR domain:

```yaml
domains:
  mwr:
    features:
      pdf_comparison: true
```

Feature configuration:

```yaml
feature_flags:
  pdf_comparison:
    enabled: true
    domain: mwr
    description: Side-by-side PDF comparison with sync scroll
    entity: review
    sync_scroll: true
```

### Review Entity Fields

New fields added to support comparison:

```yaml
review:
  field_overrides:
    comparison_enabled:
      type: bool
      default: false
      description: Enable PDF comparison mode for this review
    comparison_pdf1_id:
      type: ref
      ref: file
      description: First PDF for comparison (primary document)
    comparison_pdf2_id:
      type: ref
      ref: file
      description: Second PDF for comparison (secondary document)
    comparison_pdf1_title:
      type: text
      description: Display title for first PDF
    comparison_pdf2_title:
      type: text
      description: Display title for second PDF
```

## User Controls

### Sync Scroll Toggle

Enable/disable synchronized scrolling between PDFs:
- **ON**: Scrolling one PDF automatically scrolls the other to the same percentage position
- **OFF**: PDFs scroll independently

### View Mode Selector

Switch between layout orientations:
- **Horizontal Split**: PDFs stacked vertically (good for portrait documents)
- **Vertical Split**: PDFs side-by-side horizontally (good for landscape documents)

### Zoom Control

Unified zoom slider controls both PDFs simultaneously:
- Range: 50% to 300%
- Increment: 25%
- Applied to both panels equally

### Resizable Divider

Drag the divider between panels to adjust relative sizes:
- Click and drag the grip icon
- Min size: 20% of container
- Max size: 80% of container
- Works in both view modes

### Page Navigation

Navigate pages in sync or independently:
- When sync scroll ON: Page controls affect both PDFs
- When sync scroll OFF: Each PDF has independent page controls

## Persistent Preferences

The component stores user preferences in localStorage:

```javascript
{
  pdf_comparison_view_mode: 'vertical' | 'horizontal',
  pdf_comparison_sync_scroll: 'true' | 'false'
}
```

Preferences persist across sessions for the same browser.

## Highlight Management

Highlights are filtered by PDF file ID:
- `highlights1` receives highlights where `highlight.file_id === pdf1Url`
- `highlights2` receives highlights where `highlight.file_id === pdf2Url`
- Highlights without `file_id` default to PDF 1

The same highlight selection state is shared across both PDFs.

## Integration with Existing Components

### ReviewDetail Component

The ReviewDetail component in `/src/components/domain.jsx` has been updated to use PDFWrapper instead of PDFViewer directly:

```jsx
<PDFWrapper
  review={data}
  fileUrl={data.drive_file_id}
  highlights={highlights}
  onHighlight={canEdit ? handleHighlight : undefined}
  selectedHighlight={selectedHighlight}
  onSelectHighlight={setSelectedHighlight}
/>
```

This means comparison mode works automatically when:
1. Review has comparison fields set, OR
2. URL contains `?pdf1=X&pdf2=Y` params

## API Usage

### Enable Comparison for a Review

Update review via API:

```javascript
PATCH /api/mwr/review/:id
{
  comparison_enabled: true,
  comparison_pdf1_id: "file_abc123",
  comparison_pdf2_id: "file_xyz789",
  comparison_pdf1_title: "Draft",
  comparison_pdf2_title: "Final"
}
```

### Disable Comparison

```javascript
PATCH /api/mwr/review/:id
{
  comparison_enabled: false
}
```

## Performance Considerations

### Loading Strategy

Both PDFs use dynamic imports with loading states:
- Lazy loaded on demand
- Independent loading states
- Fallback to loading indicator

### Scroll Debouncing

Scroll synchronization uses 50ms debounce to prevent infinite loops:
- Primary scroll triggers secondary scroll
- Secondary scroll is blocked during sync
- Timeout ensures clean state reset

### Memory Usage

Both PDFs render simultaneously:
- Double memory footprint vs single viewer
- Consider file size limits for large PDFs
- Browser may struggle with 2x 50MB+ PDFs

## Known Limitations

1. **Page Count Mismatch**: If PDFs have different page counts, sync scroll works by percentage, not absolute page
2. **Different Aspect Ratios**: Both PDFs use same zoom level even if aspect ratios differ
3. **Highlight Positioning**: Highlights are positioned per-PDF, not cross-referenced
4. **No Diff View**: Comparison is visual only, no automatic difference detection
5. **Single Divider**: Cannot adjust individual panel sizes, only relative ratio

## Future Enhancements

Potential improvements not yet implemented:

- [ ] Independent zoom per PDF
- [ ] Highlight linking across PDFs
- [ ] Automatic difference detection
- [ ] Annotation comparison mode
- [ ] Three-way comparison support
- [ ] Export comparison report
- [ ] Print both PDFs together
- [ ] Overlay mode (transparency blend)

## Troubleshooting

### Comparison mode not activating

Check:
1. Feature flag `pdf_comparison` is `true` in master-config.yml
2. Review entity has `comparison_enabled: true`
3. Both `comparison_pdf1_id` and `comparison_pdf2_id` are set
4. OR URL params `?pdf1=X&pdf2=Y` are present

### Scroll sync not working

Check:
1. Sync scroll toggle is ON (switch in toolbar)
2. Both PDFs have loaded successfully
3. Browser console for scroll event errors
4. Try disabling and re-enabling sync scroll

### Highlights not showing

Check:
1. Highlight has correct `file_id` matching PDF URL
2. Highlight `page_number` is within PDF page range
3. Highlight has valid `position` object with x, y, width, height
4. Component received `highlights1` or `highlights2` props

### Divider not dragging

Check:
1. Click directly on the grip icon (not the divider background)
2. Mouse events not blocked by other overlays
3. Browser console for drag event errors

## Testing

Manual test procedure:

1. Create a review with comparison enabled
2. Set two different PDF file IDs
3. Load the review detail page
4. Verify side-by-side view appears
5. Test sync scroll toggle
6. Test view mode toggle
7. Test zoom controls
8. Test divider dragging
9. Test page navigation
10. Test highlight selection

## Component Registry

Both new components are registered in `/src/config/component-paths.js`:

```javascript
viewers: {
  pdf: 'PDFViewer',
  pdfComparison: 'PDFComparison',
  pdfWrapper: 'PDFWrapper',
  highlight: 'HighlightLayer',
  chat: 'ChatPanel',
}
```

This allows dynamic imports and component loading throughout the app.
