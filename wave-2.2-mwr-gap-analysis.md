# WAVE-2.2: MyWorkReview Gap Analysis

## Feature Matrix Summary

| Category | EXISTS | PARTIAL | MISSING | Total |
|----------|--------|---------|---------|-------|
| Review CRUD & List | 5 | 3 | 2 | 10 |
| PDF Viewer & Highlights | 1 | 4 | 5 | 10 |
| Sections & Resolution | 2 | 3 | 3 | 8 |
| Collaborators | 3 | 2 | 2 | 7 |
| Checklists | 3 | 2 | 2 | 7 |
| Tender Management | 2 | 3 | 2 | 7 |
| Notifications | 3 | 3 | 2 | 8 |
| Permissions (CASL) | 2 | 3 | 3 | 8 |
| Settings & Config | 3 | 4 | 3 | 10 |
| Integrations & Scheduled Jobs | 4 | 4 | 4 | 12 |
| **TOTAL** | **28** | **31** | **28** | **87** |

## 1. Review CRUD & List

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Create review | Full dialog with template, team, name, year, PDF upload | POST /api/mwr/review with basic fields | PARTIAL | Missing: PDF upload to Google Drive, template association, team assignment in create flow |
| List reviews | DataGridPremium with grouping, sorting, pagination, star/unstar | GET /api/mwr/review with pagination, domain filter | PARTIAL | Missing: DataGrid features (grouping, column reorder), star/priority toggle |
| Tabs (Active/Priority/History/Archive) | Full tab filtering with counts | Tab rendering in review-renderer.js | EXISTS | Implemented in review-renderer.js |
| Search reviews | Text search across name, tags, flags | Not implemented | MISSING | No search endpoint or UI |
| Archive review | Move to archive tab with confirmation dialog | PATCH status change | PARTIAL | Missing: confirmation dialog, archive-specific validation |
| Delete review | Soft delete with Firestore | DELETE /api/mwr/review/:id | EXISTS | Implemented |
| Template choice | Dialog to select template before create | reviewTemplateChoiceDialog in review-dialogs.js | EXISTS | Implemented |
| Flags dialog | Separate tender vs standard flags with date rules | reviewFlagsDialog in review-dialogs.js | EXISTS | Implemented |
| Tags dialog | Add/remove tags from configurable list | reviewTagsDialog in review-dialogs.js | EXISTS | Implemented |
| Context menu | Right-click actions on review row | reviewContextMenu in review-dialogs.js | MISSING | No context menu implementation |

## 2. PDF Viewer & Highlights

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| PDF rendering | react-pdf-highlighter with PdfLoader | No PDF viewer component | MISSING | Core gap: no PDF rendering in browser. MWR uses react-pdf-highlighter library |
| Create highlight | Click-drag on PDF, ScaledPosition with boundingRect, rects[], pageNumber | POST /api/mwr/review/:id/highlights (basic) | PARTIAL | API exists but missing: position data (boundingRect, rects, pageNumber, usePdfCoordinates), highlight type (text/area) |
| Highlight types | Text highlight + Area highlight (rectangle) | Not differentiated | MISSING | No type distinction in API or UI |
| Highlight responses | Thread of responses per highlight with datetime, user | Not implemented | MISSING | No response/thread model or API |
| Highlight resolution | Resolved/partial-resolved/manager-resolved/partner-resolved states | status field only | PARTIAL | Missing: partialResolved, resolvedBy role distinction, resolvedDate tracking |
| Highlight numbering | Auto-increment per review, displayed on PDF | Not implemented | MISSING | No highlight numbering system |
| Highlight color palette | Color-coded by type/status | Color palette in mwr-core-engines.js | EXISTS | Palette defined but no UI to render it |
| PDF zoom | Zoom in/out with coordinate recalculation | Not implemented | MISSING | No zoom controls or coordinate transform |
| PDF editor (canvas drawing) | Brush-based PDF annotation with undo/save | Not implemented | MISSING | PdfEditor.tsx has canvas drawing, brush sizes, undo, save modified PDF |
| PDF comparison | Side-by-side view with synced scroll | Not implemented | MISSING | PdfComparison.tsx with GeneralCommentsDrawer and usePdfScrollSync |

## 3. Sections & Resolution

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Sections accordion | Expandable sections with highlight counts | Sections view in review-renderer.js | PARTIAL | Server-rendered HTML exists but lacks interactive accordion behavior |
| Section items | Items within sections with mandatory flag | Checklist items model | EXISTS | Mapped to checklist_item table |
| Section resolution tracking | Per-section resolved/total/partial counts | Not implemented | MISSING | No aggregation of resolution status per section |
| Mandatory section validation | Block status change if mandatory sections unresolved | Not implemented | MISSING | checkIfMandatorySectionsResolved from FileReviewCalcs.tsx has no equivalent |
| Section report | Printable section report view | Section report in review-renderer.js | EXISTS | Implemented |
| Highlight calculation functions | getHighlightsResolved, getHighlightsPartiallyResolved, getHighlightsManagerResolved, getHighlightsPartnerResolved, checkIfHighlightsResolved | Not implemented | MISSING | FileReviewCalcs.tsx functions have no Moonlanding equivalent |
| Resolve all highlights | Bulk resolve action with permission check | Not implemented | PARTIAL | Permission defined (mark_all_resolved) but no bulk action endpoint |
| Attachment per highlight | File attachment on individual highlights | Not implemented | PARTIAL | IHighlight.attachment field has no equivalent |

## 4. Collaborators

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Add permanent collaborator | Select user, permanent access | POST /api/mwr/review/:id/collaborators | EXISTS | Implemented |
| Add temporary collaborator | Select user, expiry days from settings | POST with expiry_days | EXISTS | Implemented with expiry_days |
| Remove collaborator | Remove with email notification | Not fully implemented | PARTIAL | No removal notification email |
| Collaborator email notifications | Different emails for add/remove/permanent/temporary | Notification templates exist | PARTIAL | Templates defined in notification-engine.js but not wired to collaborator changes |
| Collaborator role service | Role-based access per collaborator | collaborator-role.service.js | EXISTS | Implemented |
| Temp collaborator auto-cleanup | PubSub scheduled job removes expired temp collaborators | Not implemented | MISSING | pubSub_temporaryReviewAccessScheduler has no equivalent cron job |
| Collaborator change detection | processCollaboratorChanges detects added/removed | Not implemented | MISSING | collaboratorReviewChanges.js logic not ported |

## 5. Checklists

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Create checklist | Name, section_items, mandatory, managerApprove, emailChecklist | POST /api/mwr/review/:id/checklists | EXISTS | Implemented |
| Checklist items CRUD | Add/edit/delete items with completion tracking | Checklist engine in mwr-core-engines.js | EXISTS | addItem, completeItem, progress implemented |
| Checklist management page | List, filter, bulk actions | ChecklistsManagement.tsx | EXISTS | Route exists |
| Email checklist PDF | Weekly Puppeteer-generated PDF emails to assigned users | generate-checklist-pdf.js exists | PARTIAL | Service file exists but scheduled job not wired |
| Manager approval workflow | managerApprove flag triggers approval step | Not implemented | MISSING | No approval workflow in checklist engine |
| Checklist templates | Save checklist as reusable template | Not implemented | MISSING | No template-to-checklist creation flow |
| Attach checklist to review | Link checklist to review with permission check | attach_checklist permission defined | PARTIAL | Permission exists but attach action not implemented |

## 6. Tender Management

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Tender details dialog | deadline_date, announcement_date, contact_person, contact_number, email, address, price, winning_price | GET /api/mwr/review/:id/tender/:tenderId | PARTIAL | API returns data but no create/update endpoints, no dialog UI |
| Tender deadline calculation | days_remaining, is_overdue, status | Tender engine in mwr-core-engines.js | EXISTS | Implemented with deadline calc, status, autoClose |
| Tender flags (special) | Open/Missed/Declined/Won/Lost/Awaiting Adjudication with date-based rules | Flag dialog exists | EXISTS | Tender-specific flags in review-dialogs.js |
| Tender validation | Deadline must be future, announcement after deadline, price required | Not implemented | MISSING | TenderDetailsDialog.tsx validation rules not ported |
| Tender deadline notifications | 7-day and same-day deadline notifications via PubSub | Notification templates exist | PARTIAL | Templates defined (tender_deadline_7days, tender_deadline_today) but no scheduler |
| Tender missed deadline auto-flag | Auto-flag reviews past deadline | Not implemented | MISSING | checkTenderReviewsMissedDeadline PubSub has no equivalent |
| Tender auto-close | Auto-close tenders past deadline threshold | autoClose in tender engine | PARTIAL | Logic exists but no trigger mechanism |

## 7. Notifications

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Send notification dialog | Select recipients from team+collaborators, custom message | Not implemented as UI | MISSING | FileReviewNotificationDialog.tsx has no equivalent UI |
| Review created notification | Firebase onCreate trigger | Notification template exists | PARTIAL | Template defined but no create trigger wired |
| Review status change notification | Firebase onUpdate trigger | Notification template exists | PARTIAL | Template defined but no update trigger wired |
| Collaborator added/removed emails | Separate emails for add/remove/permanent/temporary | Templates exist | PARTIAL | Templates defined, not wired to collaborator changes |
| Tender deadline notifications | 7-day and same-day via PubSub | Templates exist | PARTIAL (same as 6.5) | Templates defined, no scheduler |
| Weekly checklist PDF email | Puppeteer PDF generation + email to assigned users | generate-checklist-pdf.js + notification template | PARTIAL | Service exists but not scheduled |
| Notification recipient resolvers | team, collaborator, client, single, list, static | Defined in notification-engine.js | EXISTS | Fully implemented |
| Email transport | Nodemailer with SMTP | Notification engine with email | EXISTS | Implemented |
| Push notifications | Not implemented in MWR | Not implemented | N/A | Neither system has push notifications |

## 8. Permissions (CASL)

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Role-based permissions | CASL @casl/ability with defineAbility | master-config.yml permission templates | PARTIAL | Config-based roles exist but no CASL runtime enforcement |
| mark_all_resolved | Permission to bulk-resolve highlights | Defined in config | PARTIAL | Permission defined but no enforcement point |
| change_status | Permission to change review status | Defined in config | PARTIAL | Permission defined but no enforcement point |
| collaborators permission | Permission to manage collaborators | Not in config | MISSING | Not defined in master-config.yml |
| private permission | Permission to set review as private | Not in config | MISSING | Not defined in master-config.yml |
| attach_checklist permission | Permission to attach checklists | Not in config | MISSING | Not defined in master-config.yml |
| Settings permissions | new_flags, teams.add, users.add | Partial in config | PARTIAL | Some settings permissions exist, not all |
| Permission management UI | PermissionsHome.tsx, PermissionDetails.tsx | Not implemented | MISSING | No permissions management page |

## 9. Settings & Config

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Settings page | Tabbed settings: templates, checklists, integrations, teams, users, permissions, file reviews | settings-renderer.js | PARTIAL | Settings renderer exists but limited sections |
| Temporary access period | Configurable days for temp collaborator expiry | Not in settings UI | MISSING | Setting not exposed in UI |
| Review flags configuration | Add/edit/remove review flags | Not in settings UI | MISSING | Flags hardcoded or config-only |
| Tender flags configuration | Separate tender flag list | Not in settings UI | MISSING | Tender flags not configurable via UI |
| Flags managers | Users who receive flag change notifications | Not implemented | MISSING | flags_managers setting not ported |
| Teams management | CRUD teams with members | TeamsHome route exists | EXISTS | Implemented |
| Users management | CRUD users with roles | Users route exists | EXISTS | Implemented |
| Templates management | CRUD review templates with sections | Templates route exists | EXISTS | Implemented |
| Integrations (API key) | Private API key generation for Friday | Not implemented | MISSING | SettingsIntegrations.tsx API key gen not ported |
| File review settings | temp_review_access_period, flags, tender_flags | Partial in config | PARTIAL | Some in master-config.yml but not UI-configurable |

## 10. Integrations & Scheduled Jobs

| Feature | MWR | Moonlanding | Status | Gap Detail |
|---------|-----|-------------|--------|------------|
| Google Drive PDF storage | Upload, replace, fetch PDFs from Drive | File API exists | PARTIAL | /api/files routes exist but Drive integration unclear |
| Google Drive folder creation | Auto-create folders per engagement/review | Not implemented | MISSING | No folder management |
| Drive caching layer | Cache Drive responses for performance | Not implemented | MISSING | No caching layer |
| Friday cross-system auth | Custom token exchange for Friday SSO | Not implemented | MISSING | generate-custom-token endpoint not ported |
| Friday data sync | Fetch clients, teams, engagements from Friday | /api/friday routes exist | EXISTS | Friday API routes implemented |
| Daily user sync | PubSub job syncs users from Friday | Not implemented | MISSING | pubSub_dailyUserSync has no equivalent |
| Daily backup | PubSub job creates Firestore backup | backup.js exists | EXISTS | Backup engine implemented |
| Temp collaborator cleanup | PubSub scheduled removal of expired temp access | Not implemented | MISSING | No cleanup cron job |
| Tender deadline check | PubSub checks upcoming deadlines | Not implemented | MISSING | No deadline check cron |
| Tender missed deadline check | PubSub auto-flags missed deadlines | Not implemented | MISSING | No missed deadline cron |
| Weekly checklist emails | PubSub generates PDF + emails weekly | generate-checklist-pdf.js exists | PARTIAL | Service exists but no scheduler |
| Review onCreate trigger | Firebase trigger sends notification on new review | Not implemented | PARTIAL | Notification templates exist but no trigger |

## Missing Review API Endpoints

The following MWR API endpoints have no Moonlanding equivalent:

1. `POST /api/upload-file` - Upload PDF to Google Drive with folder creation
2. `POST /api/replace-drive-file` - Replace existing Drive file
3. `GET /api/fetch-review-cached` - Cached review fetch for performance
4. `POST /api/send-notification` - Send notification to selected users
5. `POST /api/push-mwr-checklist` - Push checklist to review
6. `POST /generate-custom-token` - Friday SSO token exchange
7. `GET /api/friday-get-reviews` - Cross-system review fetch
8. Highlight responses CRUD (no endpoint exists)
9. Highlight bulk resolve (no endpoint exists)
10. Review search (no endpoint exists)
11. Tender create/update (only GET exists)
12. Settings CRUD for flags, temp_access_period, flags_managers
13. Collaborator removal with notification
14. Review priority star/unstar toggle

## Missing Review UI Pages

1. **PDF Viewer page** - The core review experience. MWR uses react-pdf-highlighter for in-browser PDF rendering with highlight creation, click-to-navigate, zoom, and area highlights. Moonlanding has no PDF viewer.
2. **PDF Editor page** - Canvas-based drawing/annotation on PDF with brush sizes, undo, save modified PDF.
3. **PDF Comparison page** - Side-by-side PDF comparison with synced scroll and general comments drawer.
4. **Highlight sidebar** - Scrollable list of highlights with response threads, resolve actions, section grouping, attachments, and highlight detail expansion.
5. **Send notification dialog** - Select recipients from team + collaborators, compose custom message, send.
6. **Permissions management page** - CRUD permission sets with role-based CASL rules.
7. **Integrations settings page** - API key generation for Friday integration.
8. **Review search UI** - Search across reviews by name, tags, flags with results display.

## Missing Review Workflows

1. **Highlight response thread** - Users add responses to highlights; each response has user, datetime, text. Responses form a conversation thread visible in sidebar.
2. **Highlight resolution cascade** - Resolve → partial resolve → manager resolve → partner resolve. Each level tracked with user and date. Mandatory sections block status change.
3. **Collaborator change detection** - Detect added/removed collaborators on review save, send appropriate emails (different for permanent/temporary/removed).
4. **Temp collaborator lifecycle** - Create with expiry → scheduled cleanup removes expired → email notification on removal.
5. **Tender deadline lifecycle** - Set deadline → 7-day warning notification → same-day notification → missed deadline auto-flag → auto-close after threshold.
6. **Weekly checklist PDF generation** - Scheduled job generates PDF from Handlebars template via Puppeteer → emails to assigned users with attachment.
7. **Review creation flow** - Template choice → team selection → name/year → PDF upload to Drive → tender details (if tender template) → create review with all associations.
8. **Friday SSO flow** - User authenticates in Friday → token exchange → custom MWR token → cross-system session.

## Firestore to SQLite Data Model Mapping

| MWR Firestore | Moonlanding SQLite | Transformation |
|---------------|-------------------|----------------|
| reviews collection (embedded highlights[], sections[], collaborators[]) | reviews table + highlights table + review_sections table + review_collaborators table | Denormalize embedded arrays to separate tables with FK |
| highlight.responses[] (embedded array) | highlight_responses table (FK: highlight_id) | New table needed |
| highlight.position (ScaledPosition object) | highlight position columns or JSON column | Store boundingRect, rects, pageNumber, usePdfCoordinates |
| review.tender_details (embedded object) | tender table (FK: review_id) | Already exists as separate table |
| review.flags[] (string array) | review_flags table or JSON column | Normalize or store as JSON |
| review.tags[] (string array) | review_tags table or JSON column | Normalize or store as JSON |
| review.attachments[] (embedded array) | review_attachments table (FK: review_id) | New table needed |
| checklist.section_items[] (embedded array) | checklist_item table (FK: checklist_id) | Already normalized |
| user.permissions (CASL rules object) | permissions table with role-based lookup | Already has permission model |

## Priority Implementation Order

### P0 - Core Experience (Blocks Everything)
1. PDF viewer component (react-pdf-highlighter or equivalent)
2. Highlight CRUD with full ScaledPosition data model
3. Highlight response threads
4. Highlight resolution states (resolved/partial/manager/partner)
5. Sections accordion with resolution tracking

### P1 - Essential Workflows
6. Review creation flow with PDF upload
7. Collaborator change detection and email notifications
8. Tender details create/update endpoints
9. Tender deadline notification scheduler
10. Permission enforcement at API level (CASL equivalent)

### P2 - Feature Completeness
11. PDF editor (canvas drawing)
12. PDF comparison (side-by-side)
13. Send notification dialog
14. Weekly checklist PDF email scheduler
15. Temp collaborator cleanup scheduler
16. Review search
17. Mandatory section validation

### P3 - Settings & Admin
18. Settings UI for flags, temp_access_period, flags_managers
19. Permissions management page
20. Integrations page (API key generation)
21. Friday SSO token exchange
22. Daily user sync scheduler

## Moonlanding Architectural Advantages

Despite gaps, Moonlanding has structural advantages over MWR:

1. **Normalized data model** - SQLite tables with proper FK constraints vs Firestore embedded arrays. Enables efficient queries, joins, and referential integrity.
2. **Server-side rendering** - Zero-JS-framework pages load faster than MWR React SPA. Progressive enhancement possible.
3. **Unified permission model** - master-config.yml with role-based templates is more maintainable than scattered CASL definitions.
4. **Notification engine** - Comprehensive recipient resolvers and 20+ templates already defined. Just needs trigger wiring.
5. **Generic entity API** - createCrudHandlers pattern reduces boilerplate vs MWR's hand-written endpoints.
6. **Migration framework** - Built-in migration toolkit for Firestore to SQLite data transfer.
7. **Hot-reloadable architecture** - tsx runtime with module reload vs MWR's full rebuild cycle.
