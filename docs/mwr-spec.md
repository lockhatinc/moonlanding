# My work review

## Overview
MWR: PDF review/collab platform for audit workflows. React/TS frontend (Netlify), Firebase Functions backend (Node/Express), Firestore DB, Firebase Storage + Google Drive.

**Routes:**
- `/` Home | `/login` Google OAuth | `/filereview/:id` PDF viewer | `/settings/*` Admin | `/forbidden` Access denied
- Settings: `/settings/` home | `templates/*` `checklists/*` `teams/*` `users/*` `permissions/*` (Partner only) | `filereviews/*` `integrations/*`
- FileReview: `/filereview/:id` main | `/sections` | `/comparison`

## Architecture
```
React(Netlify) → Firebase Functions → Firestore
     ↓              ↓                    ↓
Firebase Auth   Google Drive API    Firebase Storage
     ↓
Friday App (Token Exchange)
```

## Tech Stack
**Frontend:** react@18.2.0, react-router-dom@6.14.0, typescript@4.9.5, @mui/material@5.14.4, @mui/x-data-grid-premium@5.17.26, react-pdf@7.3.3, pdfjs-dist@2.16.105, pdf-lib@1.17.1, firebase@10.1.0, @casl/ability@6.5.0, framer-motion@11.3.17, axios@1.4.0, moment@2.29.4, uuid@10.0.0, workbox-*

**Backend:** firebase-admin@11.10.1, firebase-functions@4.4.1, express@4.18.2, googleapis@126.0.1, busboy@1.6.0, nodemailer@6.9.5, handlebars@4.7.8, puppeteer-core@10.4.0

## Auth System
1. Google OAuth → 2. Check user in `myworkreview/users/list` → 3. Verify status="active" → 4. Update UID → 5. Fetch role/permissions → 6. Setup AuthContext

**User fields:** email(unique), name, photo, uid, role(ref), teams[], status(active|inactive), authProvider("google"), priorityReviews[]

## Roles & Permissions

### Role Hierarchy
| Role | Access Level |
|------|-------------|
| Partner | Full - all settings, templates, checklists, teams, users, flags, tags, WIP, deadlines, archive, delete attachments, remove checklists, ML queries |
| Manager | Mid - reviews, flags, tags, WIP, collaborators, resolve own highlights. NO: deadlines, delete attachments, remove checklists, ML toggle |
| Clerk | Basic - view/comment, respond to checklists. NO: settings, flags, tags, WIP, archive, resolve highlights, add checklists |

### Permission System
CASL-based + inline checks. Resources: checklists, reviews, settings, templates, teams, users
Types: add, mark_all_resolved, change_status, collaborators, private, attach_checklist, new_flags, temporary_access_period, manage, all

**Important:** Many inline checks hardcoded (can't change via permission table):
- `FileReview.tsx`: checkUserAuthorization() 
- `Home.tsx`: field actions (!isClerk for tags/WIP, isPartner for deadlines)
- `FlexUpView.tsx`: multiple role checks
- `SettingsHome.tsx`: role_name !== "Clerk"
- `FlagHolder.tsx`: isPartner check

## Storage System

### Google Drive (Review PDFs & attachments)
- Upload: `/api/upload-file` → creates review folder + attachments subfolder
- Retrieval: `/api/fetch-review-cached` (recommended, 24h cache in GCS `cached_reviews`) | `/api/fetch-review` (direct)
- Attachments: `/api/upload-attachment-file`, `/api/get-attachment-file`
- Parent folder: `1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG`

### Firebase Storage (Chat attachments)
- Path: `{org}/{reviewId}/{filename}_{timestamp}`
- Friday: `{clientId}/{engagementId}/{rfiId}/{questionId}/{filename}_{timestamp}`
- Uses `uploadBytesResumable`, direct download URLs

## Friday Integration
Dual Firebase apps: MWR(`audit-7ec47`) + Friday(`friday-a372b`)

**Token Exchange:** MWR→Friday ID token→`/generate-custom-token`→verify→custom MWR token

**Endpoints:**
- `/api/push-mwr-checklist`: Friday pushes checklists to MWR
- `/api/friday-get-reviews`: Get review names/years
- `/api/get-checklists`: Get all org checklists

**Chat Sync:** When review linked to Friday engagement (`friday_link`↔`review_link`), both chat collections merged via `onSnapshot()` listeners

## Firebase Config
**MWR:** audit-7ec47 | apiKey: AIzaSyB3hDttJnMDlZr7Vi6OhDQfBPBLQaQxynU
**Friday:** friday-a372b | apiKey: AIzaSyAdtzhTr38NDTj5ATL3EJebHPHusAoAEH0

## Firestore Schema
```
myworkreview/
├── users/list/{email,name,photo,uid,role,teams[],status,authProvider,priorityReviews[]}
├── userGroups/list/{name,roles{},description}
├── teams/list/{name,partners[],users[]}
├── templates/list/{name,template_type,sections[],description}
├── reviews/list/{groupName,financialYear,template{},team{},status,flags[],collaborators[],collaboratorCloudIds[],sections[],highlights[],fileUrl,attachmentFolderURL,attachments[],published,published_date,closed_date,deadline_date,tender_details{},email,user,firstManager,stage,hasEmailChecklist,friday_link?}
├── checklists/list/{name,section_items[{id,question,responses[],resolved}]}
├── apis/list/{key,name}
├── logs/list/{review,message,email,log_time}
├── removedHighlights/list/{reviewId}/[archived highlights]
└── settings/list/{temporary_review_access_period,flags_managers[],tender_flags[]}
```

## Highlight System
Uses PDF.js (pdfjs-dist@2.16.105)

**Process:**
1. Text selection → getBoundingRect/getClientRects → Range object
2. Area selection → react-rnd for resizable rectangles
3. Coords: scaled (0-1 range) relative to page dims
4. Resize: `scaledToViewport(scaled,viewport,usePdfCoordinates)` via ResizeObserver

**Colors:** Default=#B0B0B0 | ScrolledTo=#7F7EFF | Partner=#ff4141 | Resolved=#44BBA4

**Scroll to highlight:** scrollTo()→scrollPageIntoView()→viewport calc→10px margin→set scrolledToHighlightId→clear after 2-3s

**Storage:** highlights[] in review doc with {id,position{boundingRect,rects[],pageNumber,usePdfCoordinates},comment{text,emoji},content{text?,image?},email,resolved,responses[]}

**Deletion:** CANNOT delete highlights - archived to `removedHighlights/list/{reviewId}` via Firestore trigger. Responses cannot be deleted. Only Partners can delete attachments.

## Template-Checklist System
- Template has `default_checklists[]` (checklist IDs)
- On review creation: fetch checklists → copy to review `sections[]` → init items (empty responses, unresolved)
- Adding: Managers+ can add | Only Partners can remove
- Friday templates require `friday_link` to engagement (bidirectional)

## Backend Functions

### HTTP Endpoints (Base: `https://us-central1-audit-7ec47.cloudfunctions.net`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/hello | GET | Health check |
| /generate-custom-token | POST | Friday token exchange |
| /api/friday-get-reviews | POST | Get reviews for Friday |
| /api/get-checklists | POST | Get all checklists |
| /api/push-mwr-checklist | POST | Push checklist from Friday |
| /api/upload-file | POST | Upload review PDF to Drive |
| /api/replace-drive-file | POST | Replace existing Drive file |
| /api/fetch-review | POST | Fetch PDF (no cache) |
| /api/fetch-review-cached | POST | Fetch PDF (with cache) |
| /api/get-attachment-file | POST | Get attachment from Drive |
| /api/upload-attachment-file | POST | Upload attachment to Drive |
| /api/delete-attachment-file | POST | Delete attachment from Drive |
| /api/send-notification | POST | Send custom email notification |
| /api/send-bug-report | POST | Send bug report email |

**highMemoryApi:** 4GB, 540s timeout, max 10 instances

### Pub/Sub Functions
| Function | Topic | Schedule | Purpose |
|----------|-------|----------|---------|
| pubSub_temporaryReviewAccessScheduler | temporary-access | Daily | Remove expired temp collaborators |
| pubSub_dailyUserSync | daily-user-sync | Daily 2AM | Sync users from Google Workspace |
| pubsub_dailyBackup | daily-backup | Daily 3AM | Firestore backup to `gs://mwrdailybackups` |
| pubSub_generateChecklistPDFEmails | generate-checklist-pdf | Mon 8AM | Weekly checklist PDF reports (1GB mem, 540s) |
| checkTenderReviewNotificationsDue | daily-tender-notifications | Daily 9AM | Notify 7 days before tender deadline |
| checkTenderReviewsMissedDeadline | daily-tender-missed-deadline | Daily 10AM | Set "Missed" flag for overdue tenders |

### Firestore Triggers
| Trigger | Collection | Purpose |
|---------|-----------|---------|
| newReviewerTriggerNotification | reviews/list onCreate | Email team partners on new review |
| updatedReviewTriggerNotification | reviews/list onUpdate | Archive removed highlights, notify status/collaborator changes |

## Daily User Sync
Script URL: `https://script.google.com/macros/s/AKfycbyqQp6ZLZn_vSNi4dxZxWHa1yEoFEcKMoWunP3Mytx2sXL9N0g/exec`
Auth: `USER_EMAIL_SYNC_KEY` query param

Returns: `[{name,email,photo}]` (trimmed, lowercase email)

Process: Compare with Firestore → Add new (default role=Clerk `A3KQ4WpdhLj2Vo2oSS2x`) → Remove missing (delete from teams, delete Auth) → Update changed

## Features Summary
- PDF review with highlights/comments/annotations/drawing
- Checklists with responses/attachments/resolution
- Collaborators (permanent/temporary with expiry)
- Chat sync with Friday engagements
- Templates (standard/tender/friday types)
- Teams/Users management
- Flags/Tags/WIP values
- Tender deadline tracking
- Priority reviews
- PDF comparison (sync scroll)
- ML query consolidation
- General comments (fileId="general")
- Partial resolution (partialResolved, partialResolvedBy, partialResolvedDate)
- Push queries to Friday RFI
- PWA with offline support

## Environment Variables

**Backend (functions/.env):**
```
MWR_SERVER_KEY=<server-to-server API key>
AUDIT_EMAIL_PASS=<Gmail app password>
USER_EMAIL_SYNC_KEY=<Google Apps Script auth key>
```

**Frontend (client/.env):**
```
REACT_APP_MUI=<MUI Premium license>
REACT_APP_FRIDAY_ROLE_PARTNER=<Friday Partner role ID>
REACT_APP_FRIDAY_ROLE_MANAGER=<Friday Manager role ID>
```

## Security
- Server-to-server: `x-server-server` header + `Authorization: Bearer {MWR_SERVER_KEY}`
- CORS: allowedOrigins whitelist (localhost:3000, myworkreview.netlify.app, fridayinc.netlify.app, Firebase function URLs)
- App-level auth (no Firestore/Storage security rules files)
- Service accounts: `serviceAccountKey.json`(MWR), `serviceAccountKeyFriday.json`(Friday), `serviceAccountCloud.json`(Drive/GCS)

## Deployment
**Frontend:** Netlify | Build: `npm run build` | Obfuscated: `npm run build:prod` (javascript-obfuscator)
**Backend:** `firebase deploy --only functions`

## Project Structure
```
myworkview/
├── client/src/{components/,globalFunctions/,hooks/,lib/,style/,App.tsx,firebase.tsx}
├── functions/{index.js,collaboratorReviewChanges.js,emailFunctions.js,weeklyChecklistEmails.js,userUtils.js,serviceAccount*.json}
├── firebase.json, .firebaserc
```

## Key Components
| Component | Purpose |
|-----------|---------|
| App.tsx | Root, routing, auth, global state |
| Home.tsx | Review list/management dashboard |
| FileReview.tsx | PDF viewer/annotations (5280 lines) |
| PdfHighlighter.tsx | PDF.js wrapper, highlight rendering |
| Sidebar.tsx | Review details, highlights list |
| FlexUpView.tsx | Unified review/Friday view |
| FlexUpChat.tsx | Review chat with Friday sync |
| Settings*.tsx | Admin pages |

## Styling
Theme: Poppins font, Primary=#293241, Secondary=#10002b
Libraries: styled-components, @emotion/*, MUI theme overrides
Color files: `styled.container.ts`, component CSS files

## PWA
Manifest: shortName="My Review", display=standalone, theme=#000000
Service Worker: Workbox, precache assets, StaleWhileRevalidate for images/Firebase Storage, NetworkOnly for PDFs
Offline: useOnlineStatus() hook, limited functionality message

## New Environment Setup (Summary)
1. Create Firebase projects (MWR + Friday if needed)
2. Enable: Auth(Google), Firestore, Storage, Functions
3. Create Google Drive parent folder, share with service account
4. Configure OAuth consent screen + authorized domains
5. Create Firestore indexes (status+stage, team.cloud_id+status, etc.)
6. Create GCS buckets: `cached_reviews_*`, `mwr_*_backups`
7. Create service account keys (3 files)
8. Set environment variables
9. Update CORS allowedOrigins
10. Create Google Apps Script (optional for dev)
11. Create Cloud Scheduler jobs
12. Init Firestore: userGroups (Clerk/Manager/Partner), settings, test user
13. Deploy & test

## Troubleshooting
| Issue | Check |
|-------|-------|
| Login fails | User in Firestore, status=active, OAuth config, Auth domains |
| Permission denied | Role ref valid, userGroup roles object, inline checks |
| Can't view review | checkUserAuthorization(), collaborator/team membership, private field |
| File upload fails | Drive API enabled, serviceAccountCloud.json, folder permissions |
| Function timeout | Increase timeout, use highMemoryApi, break into chunks |
| CORS error | Check allowedOrigins array |
| Friday integration | serviceAccountKeyFriday.json, API key in apis collection |
| User sync fails | USER_EMAIL_SYNC_KEY, Apps Script URL accessible |

## Email System
Provider: Gmail/Nodemailer | From: audit@l-inc.co.za
Types: Review creation, status changes, collaborator changes, tender deadlines (7 days + on deadline), weekly checklist PDFs, custom notifications, bug reports (to imimoosa@gmail.com)

## Backup
Daily to `gs://mwrdailybackups` via pubsub_dailyBackup
Restore: `gcloud firestore import gs://mwrdailybackups/{path}`

## Important Notes
- Service account keys: NEVER commit to VCS
- Max function timeout: 9 minutes
- Gmail daily limit applies
- Firestore read/write limits apply
- Large PDFs may load slowly
- Highlights archived, never deleted
- Users synced daily from Google Workspace
- Cache TTL: 24h for PDFs

Last Updated: 7 Nov 2025 | Maintainer: Prolific Solutions
