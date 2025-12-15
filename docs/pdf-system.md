# PDF System Documentation

## Overview

The PDF system provides a complete solution for document review and query management. It enables users to view PDF documents, create highlights/queries, track resolutions, and collaborate on document reviews through a responsive web interface.

## Architecture

### Components

#### PDFViewer Component
**Location:** `src/components/domain.jsx:94`

The core component for displaying and interacting with PDF documents.

**Props:**
- `fileUrl` (string): URL/path to the PDF file to display
- `highlights` (array): Array of highlight objects to render on the PDF
- `onHighlight` (function): Callback when user creates a new highlight
- `selectedHighlight` (string): ID of currently selected highlight
- `onSelectHighlight` (function): Callback when user selects a highlight

**State:**
- `currentPage` (number): Current page being viewed (1-indexed)
- `totalPages` (number): Total number of pages in document
- `scale` (number): Zoom scale (0.5 to 3.0, default 1.0)
- `loading` (boolean): Whether document is loading
- `isSelecting` (boolean): Whether user is actively selecting on PDF
- `selectionStart` (object): {x, y} coordinates of selection start

**Features:**
- Page navigation (previous/next buttons)
- Zoom controls (25% increments, range 50-300%)
- Area selection for creating highlights
- Highlight rendering and selection
- Crosshair cursor when selection is enabled
- PDF dimensions: 612x792px (standard letter size)

**Highlight Visualization:**
- **Unresolved:** Yellow border, semi-transparent yellow background
- **Selected:** Blue border, semi-transparent blue background
- **Resolved:** Green border, semi-transparent green background

#### HighlightLayer Component
**Location:** `src/components/domain.jsx:156`

Displays a list of highlights/queries and enables interaction with them.

**Props:**
- `highlights` (array): Array of highlight objects
- `selectedId` (string): Currently selected highlight ID
- `onSelect` (function): Callback when highlight is selected
- `onResolve` (function): Callback to mark highlight as resolved
- `onAddResponse` (function): Callback to add response to highlight
- `user` (object): Current user object
- `canResolve` (boolean): Whether current user can resolve highlights

**Features:**
- List view of all highlights
- Expandable highlight details showing:
  - Page number badge
  - Resolution status badge (Open/Resolved)
  - Highlight content/text
  - Creator name and timestamp
  - List of responses with creator info
- Response input textarea with submit button
- Mark as Resolved button (conditional on permissions)
- Empty state when no highlights exist

**Styling:**
- Selected highlight has blue outline
- Resolved highlights have green badge
- Open highlights have yellow badge
- Hover cursor changes to pointer

#### ReviewDetail Component
**Location:** `src/components/domain.jsx:194`

Custom detail view for Review entities combining PDF viewer with highlights management.

**Key Features:**
- Two-panel layout:
  - **Left:** PDFViewer component (70% width on desktop, full width on mobile)
  - **Right:** Tabs panel with 4 tabs:
    - **Queries:** HighlightLayer component showing all highlights
    - **Details:** Review metadata (financial year, team, deadline, WIP value, privacy)
    - **Checklists:** List of assigned checklists with status badges
    - **Chat:** Team communication interface
- Action buttons in header:
  - Add Checklist (opens modal dialog)
  - Edit (navigates to edit form)
  - Delete (soft-delete with confirmation)

**Responsive Design:**
- Desktop: 60/40 split layout
- Tablet/Mobile: Stacked layout with full-width panels

### Data Model

#### Highlight Entity
**Database Table:** `highlights`

**Fields:**
- `id` (text, PK): Unique highlight ID
- `review_id` (text, FK): Parent review
- `page_number` (int): Page where highlight appears (1-indexed)
- `position` (json): Selection coordinates as `{x, y, width, height}` (0-1 normalized)
- `content` (text): Selected text from PDF
- `image` (text): Base64 image data for area selections (optional)
- `comment` (textarea): User's comment/query about the highlight
- `emoji` (text): Optional emoji in comment
- `type` (enum): 'text' or 'area' (text = selection, area = rectangular)
- `resolved` (bool): Whether highlight has been resolved (0/1)
- `resolved_by` (FK): User who resolved
- `resolved_at` (timestamp): When resolved
- `partial_resolved` (bool): Partially addressed/in progress
- `partial_resolved_by` (FK): User who marked partial
- `partial_resolved_at` (timestamp): When marked partial
- `is_general` (bool): General comment not tied to selection
- `rfi_id` (FK): Linked RFI from Friday (optional)
- `color` (text): Display color, defaults to '#B0B0B0'
- `is_partner` (bool): Partner-only highlight flag
- `created_by` (FK): Creator user
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

**Indexes:**
- `review_id` (for filtering by review)
- `created_by` (for filtering by creator)

#### HighlightResponse Entity
**Database Table:** `highlight_responses`

**Fields:**
- `id` (text, PK): Unique response ID
- `highlight_id` (text, FK): Parent highlight
- `content` (textarea): Response text
- `attachments` (json): Array of file metadata
- `created_by` (FK): Response author
- `created_at` (timestamp): When posted

**Relationship:** One-to-many with highlights

### API Endpoints

#### GET /api/highlight
**Query Parameters:**
- `review_id` (string): Filter by review
- `page_number` (int): Filter by specific page
- `created_by` (string): Filter by creator
- `resolved` (bool): Filter by resolution status
- `limit` (int): Results per page (default 50)
- `offset` (int): Pagination offset

**Response:** Array of highlight objects with joined creator display names

**Example:**
```javascript
GET /api/highlight?review_id=yA4qvgBq89aXDBamP2Q06&page_number=1
→ [{id, review_id, page_number, position, content, comment, type, resolved, created_by_display, ...}]
```

#### POST /api/highlight
**Request Body:**
```json
{
  "review_id": "yA4qvgBq89aXDBamP2Q06",
  "page_number": 1,
  "content": "Selected text from PDF",
  "comment": "Query about this section",
  "type": "text",
  "position": {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.1},
  "is_partner": false,
  "color": "#B0B0B0"
}
```

**Response:** Created highlight object with auto-generated ID

**Status:** 201 Created

**Permission Required:** `highlight.create` (partner, manager, clerk)

#### GET /api/highlight/:id
**Response:** Single highlight object with all fields and `created_by_display` join

#### PUT /api/highlight/:id
**Request Body:** Partial update fields
- `comment`, `resolved`, `partial_resolved`, `color`, etc.

**Response:** Updated highlight object

**Status:** 200 OK

**Permission Required:** `highlight.edit` (partner, manager)

#### DELETE /api/highlight/:id
**Behavior:** Soft-delete via archiving to `removed_highlights` table

**Response:** 200 OK or 500 with FOREIGN KEY constraint error if responses exist

**Permission Required:** `highlight.delete` (partner only)

#### GET /api/highlight_response
**Query Parameters:**
- `highlight_id` (string): Filter by parent highlight
- `limit` (int): Results per page
- `offset` (int): Pagination offset

**Response:** Array of response objects

#### POST /api/highlight_response
**Request Body:**
```json
{
  "highlight_id": "eMnuFB8FkWxS0CN0yXVZB",
  "content": "Response to the query"
}
```

**Response:** Created response object

**Status:** 201 Created

### Database Schema

```sql
-- Highlights table
CREATE TABLE highlights (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  position TEXT,
  content TEXT,
  image TEXT,
  comment TEXT,
  emoji TEXT,
  type TEXT,
  resolved INTEGER DEFAULT 0,
  resolved_by TEXT,
  resolved_at INTEGER,
  partial_resolved INTEGER DEFAULT 0,
  partial_resolved_by TEXT,
  partial_resolved_at INTEGER,
  is_general INTEGER DEFAULT 0,
  rfi_id TEXT,
  color TEXT DEFAULT '#B0B0B0',
  is_partner INTEGER DEFAULT 0,
  created_by TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (rfi_id) REFERENCES rfis(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE INDEX idx_highlights_review_id ON highlights(review_id);
CREATE INDEX idx_highlights_created_by ON highlights(created_by);

-- Highlight responses table
CREATE TABLE highlight_responses (
  id TEXT PRIMARY KEY,
  highlight_id TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT,
  created_by TEXT,
  created_at INTEGER,
  FOREIGN KEY (highlight_id) REFERENCES highlights(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_highlight_responses_highlight_id ON highlight_responses(highlight_id);

-- Removed highlights archive
CREATE TABLE removed_highlights (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  original_id TEXT NOT NULL,
  highlight_data TEXT NOT NULL,
  removed_by TEXT,
  removed_at INTEGER,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (removed_by) REFERENCES users(id)
);
```

## Usage

### Creating a Highlight

```javascript
// Via UI: Click and drag on PDF to create area selection
// Or programmatically:
const response = await fetch('/api/highlight', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    review_id: 'reviewId',
    page_number: 1,
    content: 'Selected text',
    comment: 'My question',
    type: 'text',
    position: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 }
  })
});
const highlight = await response.json();
```

### Resolving a Highlight

```javascript
// Mark as resolved
const response = await fetch(`/api/highlight/${highlightId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resolved: true })
});
```

### Adding Responses

```javascript
// Add response to query
const response = await fetch('/api/highlight_response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    highlight_id: highlightId,
    content: 'Response text'
  })
});
```

### Retrieving Highlights for a Review

```javascript
// Get all highlights for a review
const response = await fetch(`/api/highlight?review_id=${reviewId}`);
const highlights = await response.json();

// Filter by page
const page1Highlights = highlights.filter(h => h.page_number === 1);

// Filter by resolution status
const unresolvedCount = highlights.filter(h => !h.resolved).length;
```

## Permissions

**Access Control Matrix:**

| Action | Partner | Manager | Clerk | Client |
|--------|---------|---------|-------|--------|
| View highlights | ✓ | ✓ | ✓ | ✗ |
| Create highlight | ✓ | ✓ | ✓ | ✗ |
| Edit highlight | ✓ | ✓ | ✗ | ✗ |
| Add response | ✓ | ✓ | ✓ | ✗ |
| Resolve highlight | ✓ | ✓ | ✗ | ✗ |
| Delete/Archive | ✓ | ✗ | ✗ | ✗ |

## Features

### Current Implementation

✅ **Text Selection Highlights**
- Select text on PDF to create queries
- Position stored as normalized coordinates (0-1)
- Text content captured

✅ **Area Selection Highlights**
- Draw rectangular areas on PDF
- Position stored with width/height
- Optional image capture

✅ **Resolution Tracking**
- Mark highlights as resolved
- Track resolver and resolution timestamp
- Partial resolution support for in-progress items

✅ **Response Management**
- Add multiple responses to each highlight
- Track response creator and timestamp
- Optional attachments support

✅ **Collaboration**
- Display creator name and timestamp
- Thread-like response conversations
- Team-only vs. public visibility

✅ **Visual Feedback**
- Color coding (unresolved yellow, resolved green)
- Selected highlight highlighting
- Crosshair cursor during selection
- Expandable details view

### PDF Display

- **Page Navigation:** Previous/Next buttons
- **Zoom Controls:** 50% to 300% (25% increments)
- **Page Counter:** "Page X of Y"
- **Placeholder Rendering:** Displays file path when actual PDF not loaded
- **Responsive Sizing:** Scales to container width
- **Loading State:** Spinner while loading

### Future Enhancements

⏳ **Potential Features:**
- PDF.js integration for actual PDF rendering
- Full-text search across highlights
- Comment threading with nested replies
- @mentions for notifications
- Highlight filtering and sorting
- Export highlights to PDF report
- Bulk operations (resolve multiple, add tags)
- Version comparison (compare PDFs)
- OCR for scanned PDFs
- Digital signature capture

## Performance Considerations

### Optimization Strategies

**Highlight Rendering:**
- Highlights are filtered by page (only render current page)
- Position uses percentage-based CSS (absolute positioning)
- No re-rendering on unrelated state changes

**API Calls:**
- Paginate large highlight sets (limit/offset)
- Filter at API level (page_number, review_id)
- Use single GET request to load all highlights per review

**Database:**
- Indexes on `review_id` and `created_by` for fast queries
- `position` stored as JSON string (not separate columns)
- `created_at` ascending, `updated_at` descending queries use indexes

### Caching

Currently no caching layer. Future optimization could include:
- Redis caching of highlight lists per review
- 5-minute TTL on highlight queries
- Invalidate on POST/PUT/DELETE

## Troubleshooting

### Issue: Highlights Not Appearing
**Diagnosis:**
1. Verify PDF is loaded (`fileUrl` prop is set)
2. Check browser console for errors
3. Verify highlights exist: `GET /api/highlight?review_id=X`
4. Confirm page_number matches current page

**Solution:**
- Ensure `fileUrl` is valid
- Check network tab for API failures
- Verify database has highlight records

### Issue: Selection Not Working
**Diagnosis:**
1. Check if `onHighlight` callback is passed to PDFViewer
2. Verify user has `highlight.create` permission
3. Check browser console for mouse event errors

**Solution:**
- Pass `onHighlight` function if enabled
- Verify user role has creation permission
- Check for JavaScript errors in console

### Issue: Foreign Key Constraint Error on Delete
**Diagnosis:**
- Trying to delete highlight with existing responses
- Database integrity constraint prevents orphaning responses

**Solution:**
- Delete or archive responses first
- Use soft-delete archive approach instead

## Testing

### API Test Cases

```javascript
// Test 1: Create highlight
POST /api/highlight with valid review_id, page, content

// Test 2: List highlights
GET /api/highlight?review_id=X returns array

// Test 3: Update highlight
PUT /api/highlight/:id sets resolved=true

// Test 4: Add response
POST /api/highlight_response links to highlight

// Test 5: Filter by page
GET /api/highlight?review_id=X&page_number=1 filters correctly

// Test 6: Permission check
POST /api/highlight as clerk should succeed if role includes 'clerk'
```

### UI Test Cases

```javascript
// Test 1: Page navigation
Click next/prev buttons changes currentPage state

// Test 2: Zoom
Zoom buttons change scale in 0.25 increments

// Test 3: Highlight creation
Click and drag creates new highlight in HighlightLayer

// Test 4: Highlight selection
Click highlight in list selects and highlights on PDF

// Test 5: Response submission
Type in textarea and submit adds response to highlight

// Test 6: Resolution
Click resolve button updates highlight.resolved status
```

## Migration & Deployment

### Database Migration
No migration needed - schema created on startup via auto-migration system.

### Environment Variables
No special environment variables required for PDF system.

### Dependencies
- React 19.x (for hooks and rendering)
- Mantine UI 7.x (for components and styling)
- lucide-react (for icons)

### Deployment Checklist
- [ ] Database has `highlights` and `highlight_responses` tables
- [ ] Indexes created on `review_id` and `created_by`
- [ ] User roles have appropriate permissions defined
- [ ] API routes registered and accessible
- [ ] ReviewDetail component properly imports AddChecklistDialog
- [ ] PDFViewer receives fileUrl prop
- [ ] Environment variables set correctly

