# My Friday - Engagement Management System (Compressed)

<img width="1893" height="860" alt="image" src="https://github.com/user-attachments/assets/5986ebed-bd3e-483f-b201-32fbb4888f40" />


## 1. Overview
Audit firm engagement mgmt: engagements, RFIs, templates, team collab. Auditor+client users w/ RBAC.

**Capabilities:** Engagement mgmt (6-stage workflow), client/entity mgmt, RFI handling, templates, team collab, email notifs, My Review integration, file mgmt, activity logging, PWA.

## 2. Tech Stack
**Frontend:** React 18.2.0, React Router 6.21.1, MUI 5.15.1, Firebase 10.7.1, Axios 1.6.2, Styled Components 5.3.10, Date-fns 2.30.0, React PDF 7.3.3, Workbox 6.6.0, Moment.js 2.30.1

**Backend:** Firebase Cloud Functions 4.3.1, Express 4.18.2, Firebase Admin 11.11.1, Node.js 20, Nodemailer 6.9.7, Google APIs 131.0.0, Pub/Sub 4.5.0, Moment Timezone 0.5.45

## 3. Project Structure
```
friday/
├─ build/                    # Prod build
├─ functions/                # Cloud Functions
│  ├─ index.js              # Main functions
│  ├─ adminUtils.js         # Admin utils
│  ├─ userUtils.js          # User mgmt
│  ├─ emailUtils.js         # Email utils
│  ├─ clientWeeklyEmails.js # Weekly emails
│  ├─ engagementRecreation.js # Recreate logic
│  ├─ pubSubUtils.js        # Pub/Sub utils
│  └─ serviceAccountKey*.json # Service keys
├─ public/                   # Static assets
├─ src/
│  ├─ components/           # React components
│  ├─ globalFunctions/      # Shared utils
│  ├─ hooks/                # Custom hooks
│  ├─ styles/               # Styled components
│  ├─ sidebar/              # Sidebar
│  ├─ App.js, firebase.js, AuthContext.js, Login.js
│  ├─ EngagementsHome.js, ClientsHome.js, SettingsHome.js
│  └─ [Other features]
├─ firebase.json, package.json, README.md
```

## 4. Auth System
**Methods:** Google Sign-In (`signInWithGoogle`), Email/Password (`logInWithEmailAndPassword`)

**Flow:** Sign in → Firebase Auth → Check `friday/users/list` → Validate status="active" → For auditors: auth w/ My Review → Load to AuthContext

### User Types
**Auditor:** `type:"auditor"`, roles: Partner/Manager/Clerk, Google/Email auth, full access to assigned engagements
```json
{"type":"auditor","role":"KBCSEHD91PdSh4StXOZe","role_name":"Partner","teams":["team-id"],"status":"active"}
```

**Client:** `type:"client"`, roles: admin/user per client, Email auth only, limited to assigned client engagements
```json
{"type":"client","clients":[{"cloud_id":"client-id","name":"Name","role":"admin","status":"active"}],"status":"active"}
```

### Custom Claims (Client Users)
```json
{"type":"client","client_access":["client-id-1","client-id-2"]}
```
Set via `/add-client-user`, updated via `/update-client-user`. Frontend: `user.getIdTokenResult().claims`. Backend: `admin.auth().verifyIdToken()`.

## 5. Firebase Config
**Projects:** Friday (`friday-a372b`), My Review (`audit-7ec47`)

### Firestore Structure
```
friday/
├─ settings/                 # App config
├─ users/{list/,permissions/}
├─ teams/list/
├─ clients/{list/,entity_types/,engagement_types/}
├─ engagements/list/{id}/{sections/,rfis/,last_read_messages/}
├─ templates/list/
└─ logs/list/
```

**Features:** Persistent cache (unlimited), multi-tab sync, real-time listeners, offline support.

### Firebase Storage Paths
| Purpose | Path |
|---------|------|
| RFI Attachments | `{clientId}/{engagementId}/{rfiId}/{questionId}/{fileName}_{timestamp}` |
| Master Files | `LockhatInc/{clientId}/{engagementId}/{fileName}_{timestamp}` |
| User CVs | `Users/{userId}/{fileName}` |
| Email Attachments | `temp_email_attachments/{fileName}` |
| Engagement Details | `EngagementDetails/{engagementId}/{fileName}` |

**Upload:** Frontend uses `uploadBytesResumable` + `getDownloadURL`. Backend uses `createWriteStream` + `getSignedUrl`.

## 6. My Review Integration
**API:** `https://us-central1-audit-7ec47.cloudfunctions.net/api`

**Auth Flow:** Friday ID token → POST `/generate-custom-token` → Custom token → `signInWithCustomToken` to My Review Firebase

**Endpoints:**
- `/get-mwr-checklists` - Get checklists (Bearer: `MWR_SERVER_KEY`, Header: `X-Server-Server:true`)
- `/get-mwr-reviews` - Get reviews
- `/push-mwr-checklist` - Push checklist (401=unauthorized, 501=exists, 500=error)

**Chat Sync:** If `review_link` set, merges `friday/engagements/list/{id}/chat` + `myworkreview/reviews/list/{review_link}/chat`, sorted by datetime, tagged `isFridayMessage`/`isReviewMessage`. Only on main chat tab.

**Review Links:** `review_link` (current), `previous_year_review_link` (preserved on recreation)

**Dependencies:** Service account keys, MWR API key in `friday/settings.keys.mwr`, `MWR_SERVER_KEY` env var, accessible endpoints.

## 7. Google Drive Integration
**Service Account:** `serviceAccountCloudKey.json`
**Scopes:** `drive`, `documents`, `drive.file`
**Folder ID:** `1DcOh90HMoy4Ntm6K7jl0EW-A8S-uIBwG`

**Engagement Letter Flow:** Download .docx → Upload to Drive (convert to Docs) → Replace vars (`{client}`,`{year}`,`{address}`,`{date}`,`{email}`,`{engagement}`) → Export PDF → Stream back → Delete temp file

## 8. PWA & Service Worker
**Location:** `src/service-worker.js`, `src/serviceWorkerRegistration.ts`

**Strategies:** Cache First (static), Network First (API), Stale While Revalidate (dynamic)

**Updates:** `ServiceWorkerUpdateListener.tsx` detects updates, shows snackbar w/ refresh button. Version in `package.json` vs `friday/settings.version`.

**Offline:** Firestore persistent cache, `useOnlineStatus()` hook shows limited functionality notice.

## 9. Backend Functions

### HTTP Endpoints
| Endpoint | Purpose |
|----------|---------|
| POST `/recreate-engagement` | Recreate engagement |
| POST `/upload-engagement-template` | Upload letter template |
| POST `/upload-engagement-details-file` | Upload files |
| POST `/generate-engagement-letter` | Generate letter from template |
| POST `/upload-engagement-letter` | Upload signed letter |
| POST `/upload-post-rfi` | Upload post-RFI docs |
| POST `/create-engagement-files-zip` | Create ZIP archive |
| POST `/delete-engagement` | Delete engagement |
| POST `/add-client-user` | Add client user |
| POST `/update-client-user` | Update client user |
| POST `/delete-client-user` | Delete client user |
| POST `/replace-client-user-engagements` | Replace user across engagements |
| POST `/send-rfi-reminder` | Send RFI reminder |
| POST `/upload-response-attachment` | Upload RFI attachment |
| POST `/get-mwr-checklists` | Get My Review checklists |
| POST `/get-mwr-reviews` | Get My Review reviews |
| POST `/push-mwr-checklist` | Push to My Review |
| GET `/hello` | Health check |
| POST `/generate-custom-token` | Custom token for My Review |
| POST `/upload-user-cv` | Upload CV |
| POST `/reset-password-email` | Password reset |
| POST `/test-client-emails` | Test emails |
| POST `/mail-receive` | Process incoming emails |

### Pub/Sub Functions
| Topic | Schedule | Memory/Timeout | Purpose |
|-------|----------|----------------|---------|
| `daily-backup` | Daily | 512MB | Export Firestore to `gs://fridaydailybackups` |
| `daily-user-sync` | Daily | 512MB | Sync users from Google Apps Script, add/remove users |
| `daily-engagement-check` | Daily | 1GB/540s | Stage transitions, custom notifications |
| `daily-rfi-notifications` | Daily | 1GB/540s | RFI deadline reminders |
| `daily-manager-clerk-notifications` | Daily | 512MB | Consolidated notifications from `client_sent_notifications` |
| `weekly-client-engagement-emails` | Weekly | 1GB/540s | Weekly summaries (individual, admin, master emails) |
| `yearly-engagement-creation` | Yearly | 2GB/540s | Queue yearly recreations |
| `monthly-engagement-creation` | Monthly | 2GB/540s | Queue monthly recreations |
| `process-engagement-batch` | On-demand | 2GB/540s | Process recreation batches |
| `email-content-generation` | On-demand | 1GB/300s | Generate email HTML |
| `email-sending` | On-demand | 512MB/300s | Send via Nodemailer (500/day limit) |

**Email Types:** clientSignup, passwordReset, clientReminder, clientEngagement, engagementInfoGathering, engagementNotification, clerkRfiNotification, rfiDeadlineNotification, clientWeeklyEngagement, clientMasterWeeklyEngagement, engagementFinalization, engagementFiles, bugReportDeveloper

### Engagement Recreation Process
1. Get engagements w/ `repeat_interval: "yearly"/"monthly"`
2. Queue in batches of 20 → `process-engagement-batch`
3. For each: calc new dates, check duplicates, create new engagement (inherits `repeat_interval`), copy sections/RFIs
4. If `recreate_with_attachments=true`: copy files from `{oldId}/files`, responses from `{oldId}/responses`
5. Reset RFI fields: `status:0`, `auditor_status:"Requested"`, `client_status:"Pending"`, clear dates
6. Update original: `repeat_interval:"once"`
7. On error: delete new, revert original, log failure

### Firestore Triggers
| Trigger | Collection | Purpose |
|---------|------------|---------|
| `engagementCreate` | `engagements/list` | Update counts, send initial emails |
| `engagementUpdate` | `engagements/list` | Handle stage/status/date changes, send notifications |
| `engagementDelete` | `engagements/list` | Decrement counts |
| `clientInactiveUpdate` | `clients/list` | Set `repeat_interval:"once"`, delete 0% InfoGathering |
| `rfiUpdateMonitor` | `engagements/list/{id}/rfis` | Create notifications on status/deadline changes |
| `teamUsersUpdateMonitor` | `teams/list` | Remove users from engagements when removed from team |

### Email Receiving
`POST /mail-receive` (Bearer token: `EXPECTED_BEARER_TOKEN`): Parse email → Store attachments in `temp_email_attachments/` → Save to `emails` collection → `allocated:false`. `EmailReceiveDialog` allocates to client/engagement/RFI, marks `allocated:true`.

## 10. Core Features

### Engagements
**Components:** `EngagementsHome`, `EngagementsView` (DataGrid), `EngagementsClientView`, `EngagementDetailView`, `EngagementsEdit`, `EngagementItem`

**Stages:** InfoGathering → Commencement → TeamExecution → PartnerReview → Finalization → CloseOut

| Stage | Auto-Transition | Notes |
|-------|-----------------|-------|
| InfoGathering | → Commencement when date reached | Cannot set if date passed |
| Commencement | From InfoGathering | Sends engagement letter |
| TeamExecution | Manual | Full RFI mgmt |
| PartnerReview | Manual | Partner review |
| Finalization | Manual | Client rating available |
| CloseOut | Partners only | Requires letter "Accepted" or 0% progress |

**Restrictions:** Clerks can't change stage, can't change if Pending, backward allowed: TeamExecution↔Commencement, PartnerReview↔TeamExecution

**Status Fields:**
- `status`: Pending/Active
- `client_status`: Pending/Partially Sent/Sent
- `auditor_status`: Requested/Reviewing/Queries/Received
- `engagement_letter`: client(Pending/Sent), auditor(Pending/Queries/Accepted)
- `post_rfi`: client(Pending/Queries/Accepted), auditor(Pending/Sent)

### RFI Management
**Components:** `RFIHome`, `RFIView`, `EngagementChecklistDialog`, `RFIEngagementItemDialog`, `RFIEngagementPostRFIDialog`, `AttachRFIDialog`, `EditRFIQuestionDialog`

**Status:** `status`: 0=waiting, 1=completed. `rfi_status`: Pending/Active/Inactive

**Status Change Rules:** Only auditors (not clerks), requires files OR responses for completed, sets `date_resolved` when completed.

**Days Outstanding:** `calculateWorkingDays(date_requested, date_resolved || now)`, returns 0 if InfoGathering stage.

### Clients
**Components:** `ClientsHome`, `ClientsView`, `ClientsDetails`, `EntityTypesHome`, `EngagementTypesHome`, `ClientManageUserDialog`

### Templates
**Components:** `TemplatesHome`, `TemplateDetails`

### Settings (Partners/Managers only)
- `SettingsUsers.js` - User mgmt
- `SettingsTeamsView.js` - Team mgmt
- `SettingsEngagementNotifications.js` - Notification config
- `SettingsIntegrations.js` - External integrations
- `SettingsRecreationLogs.js` - Recreation history

### Chat
**Component:** `EngagementChat` - Real-time via Firestore listeners, file attachments, message replies, search, My Review sync when `review_link` set.

### PDF Editor
**Components:** `PDFEditorDialog.tsx`, `pdfEditor/` (PdfHighlighter, Highlight, AreaHighlight, PdfLoader, Tip, Popup, etc.)

### Activity Logging
**RFI:** `engagements/list/{id}/rfis/{rfiId}/activity` - status changes, uploads, responses, flags, deadlines
**Engagement:** `engagements/list/{id}/activity` - field changes, RFI changes, stage changes
**Recreation:** `recreationLogs/list` - status, details, timestamp
**System:** `logs/list` - errors, warnings

**Hook:** `useLogQuestionActivity()` provides `logActivity()`, `logEngagementActivity()`

### Recreation Intervals
`repeat_interval`: yearly/monthly/once. Yearly=Jan 1st, Monthly=1st of month. New engagement inherits interval, original set to "once".

## 11. Database Structure

### Collections
```
friday/users/list: {email,name,type,role,status,uid,authProvider,clients[],cv_url}
friday/users/permissions: {name,key,roles{}}
friday/clients/list: {name,entity_type,status,users[],engagements[]}
friday/engagements/list: {client_id,engagement_type,year,month,commencement_date,completion_date,team,status,stage,users[],client_users[],repeat_interval,progress,client_progress,fee,engagement_letter{},post_rfi{},post_rfi_journal{},feedback{},clerksCanApprove,rfis_linked[]}
friday/engagements/list/{id}/rfis: {key,name,question,date_requested,date_resolved,deadline,deadline_date,status,users[],responses[],files[],filesCount,responseCount,days_outstanding,auditor_status,client_status,flag,ml_query,section_cloud_id,engagement_rfi_cloud_id,recreate_with_attachments}
friday/engagements/list/{id}/rfis/{rfiId}/activity: {message,user_email,dateTime}
friday/engagements/list/{id}/activity: {message,user_email,dateTime}
friday/engagements/list/{id}/sections: {name,key,order}
friday/recreationLogs/list: {engagementId,clientId,engagementTypeId,status,details{},timestamp}
friday/templates/list: {name,sections[]}
friday/emails: {subject,from,to,cc,bcc,date,body,attachmentUrls[],allocated}
friday/settings: {version,keys{mwr}}
friday/logs/list: {log_time,email,review,message}
```

## 12. User Roles & Permissions

### Auditor Roles
| Role | ID | Settings | Clients | Notes |
|------|----|----------|---------|-------|
| Partner | KBCSEHD91PdSh4StXOZe | ✓ | ✓ | Full access |
| Manager | hXbxDR3GfCHtrtjrn2wC | ✓ | ✓ | Limited admin |
| Clerk | xNexLKjl1m3kPTG8BBaF | ✗ | ✗ | View/work assigned only |

### Route Protection
| Component | Purpose | Action |
|-----------|---------|--------|
| `RequireAuth` | Base auth check | → /login |
| `NonClerkRoute` | Block Clerk | → /unauthorized |
| `ManagerPartnerLayout` | Manager/Partner only | → /unauthorized |
| `TeamAuthRoute` | Team-based access | Redirect if not on team |
| `isClientAuthorized` | Client access | Filter data |

### Client User Permissions
| Feature | Admin | User |
|---------|-------|------|
| See all client RFIs | ✓ | ✗ (assigned only) |
| Respond to any RFI | ✓ | ✗ (assigned only) |
| Rate engagement | ✓ | ✗ |
| Master weekly email | ✓ | ✗ |

**RFI Filtering:** Admin sees all; User filtered by `rfi.users.includes(cloud_id)`

### Inline Permission Checks
**Hook:** `useGetUserType()` → `isAuditor`, `isClient`, `isPartner`, `isManager`, `isClerk`, `isClientAdmin(clientId)`, `isClientAuthorized(clientId)`

```js
{isAuditor && !isClerk && <EditButton />}
{isClientAdmin(clientId) && <RatingDialog />}
const canClerkApprove = isAuditor && !isClerk ? true : engagement?.clerksCanApprove;
```

## 13. Environment Variables

### Frontend (.env)
```
REACT_APP_FRIDAY_FIREBASE_API_KEY=
REACT_APP_FRIDAY_FIREBASE_AUTH_DOMAIN=
REACT_APP_FRIDAY_FIREBASE_PROJECT_ID=friday-a372b
REACT_APP_FRIDAY_FIREBASE_STORAGE_BUCKET=friday-a372b.appspot.com
REACT_APP_FRIDAY_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FRIDAY_FIREBASE_APP_ID=
REACT_APP_FRIDAY_FIREBASE_MEASUREMENT_ID=
REACT_APP_MY_REVIEW_FIREBASE_API_KEY=
REACT_APP_MY_REVIEW_FIREBASE_AUTH_DOMAIN=
REACT_APP_MY_REVIEW_FIREBASE_PROJECT_ID=audit-7ec47
REACT_APP_MY_REVIEW_FIREBASE_STORAGE_BUCKET=
REACT_APP_MY_REVIEW_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_MY_REVIEW_FIREBASE_APP_ID=
REACT_APP_MY_REVIEW_FIREBASE_MEASUREMENT_ID=
```

### Backend (functions/.env)
```
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
MWR_SERVER_KEY=
USER_EMAIL_SYNC_KEY=
EMAIL_SENDING_SUBSCRIPTION_NAME=email-sending
EXPECTED_BEARER_TOKEN=7f7d4fa3-ea07-4541-9ed2-b432a6859bb8
```

## 14. New Environment Setup

### Prerequisites
Node.js 20+, Firebase CLI, Google Cloud account, Google Drive access, My Review access

### Steps
1. **Create Firebase Project:** Console → Add Project → Enable Analytics
2. **Enable Services:** Auth (Email/Password + Google), Firestore (production mode), Storage (production mode), Functions (Blaze plan)
3. **Firestore Rules:** Set auth-based rules for users, engagements, rfis
4. **Storage Rules:** Set path-based access rules
5. **Indexes:** Create composite indexes for common queries (team+status+stage, client+status+year, type+status)
6. **Google Drive:** Create folder, create service account, enable APIs (Drive, Docs), grant folder access, save key as `serviceAccountCloudKey.json`
7. **Service Account Keys:** `serviceAccountKey.json` (Friday), `serviceAccountKeyMyReview.json` (My Review), `serviceAccountCloudKey.json` (Google Cloud)
8. **Environment Variables:** Create `.env` files with Firebase config
9. **CORS:** Add domains to `allowedOrigins` in `functions/index.js`
10. **Deploy Functions:** `firebase deploy --only functions`
11. **Pub/Sub Topics:** Create all topics via Console or gcloud CLI
12. **Cloud Scheduler:** Create jobs for each Pub/Sub trigger
13. **Backup Bucket:** Create `gs://{project}-dailybackups`
14. **Initial Data:** Create `friday/settings` (version, keys), permissions docs, teams, entity types, engagement types
15. **Update Hardcoded Values:** Folder ID, bucket names, API URLs

### Cloud Scheduler Jobs
| Job | Schedule | Topic |
|-----|----------|-------|
| daily-backup | 0 2 * * * | daily-backup |
| daily-user-sync | 0 3 * * * | daily-user-sync |
| daily-engagement-check | 0 4 * * * | daily-engagement-check |
| daily-rfi-notifications | 0 5 * * * | daily-rfi-notifications |
| daily-manager-clerk-notifications | 0 6 * * * | daily-manager-clerk-notifications |
| weekly-client-engagement-emails | 0 9 * * 1 | weekly-client-engagement-emails |
| yearly-engagement-creation | 0 0 1 1 * | yearly-engagement-creation |
| monthly-engagement-creation | 0 0 1 * * | monthly-engagement-creation |

## 15. Routing

**Library:** React Router DOM 6.21.1

**Structure:** BrowserRouter (index.js) → App.js → Public (login, password-reset, unauthorized) + Protected (RequireAuth → ProtectedLayout → Routes)

**Public:** `/`, `/login`, `/password-reset`, `/unauthorized`

**Protected (Auditors):** `/app`, `/app/engagements`, `/app/engagements/:team/:id`, `/app/engagements/:team/:id/:engagementId`, `/app/engagements/new`, `/app/clients/*`, `/app/rfi/*`, `/app/templates`, `/app/settings/*`

**Protected (Clients):** `/app/engagements`, `/app/engagements/client/:id/:engagementId`

**Lazy Loading:** `ClientsHome`, `SettingsHome`, `EngagementsHome` via `React.lazy()`

## 16. UI Components

### Layout
`ProtectedLayout`, `ManagerPartnerLayout`, `AuditorLayout`, `PartnerLayout`, `Header`, `NavBar`

### Dialogs
`ConfirmDialog`, `EmailReceiveDialog`, `EngagementChecklistDialog`, `EngagementChat`, `EngagementActivityDialog`, `EngagementRatingDialog`, `EngagementSwitchStageDialog`, `RFIEngagementItemDialog`, `RFIEngagementPostRFIDialog`, `PDFEditorDialog`

### Forms
`InputField`, `SelectField`, `SearchField`, DatePicker (MUI)

### Display
`Loader`, `LoaderStacked`, `EmptyContainer`, `StatusLabel`, `EngagementProgressLabel`, `CircularProgressLabel`, `LinearProgressLabel`, `UserAvatar`

### Files
`ResponseAttachment`, `ResponseAttachmentPreview`, `RFIResponseAttachmentPreview`, `QuickViewAttachment`, `uploadPostRFIFiles`

### RFI
`AttachRFIDialog`, `AttachRFIQuestionDialog`, `EditRFIQuestionDialog`, `AttachRFIClientUserDialog`, `AttachRFIQuestionClientUserDialog`, `AttachBulkDeadlinesRFIDialog`, `RFIItemReminderDialog`

### Engagement
`EngagementItem`, `EngagementCardItem`, `EngagementStageSelection`, `EngagementTeamUsersDialog`, `EngagementSectionOrderDialog`, `EngagementDateChoiceDialog`, `EngagementRatingComponent`

### Other
`ClientManageUserDialog`, `ClientRiskAssessmentDialog`, `ClientTestEmailDialog`, `RFITemplateSelectField`, `SettingsEngagementNotificationTriggerDialog`, `ColorPickerDialog`, `ChooseFilesFromOtherEngagementsDialog`, `ImportReviewQueriesDialog`, `PushMWRDialog`, `EngagementChecklistPushMyReviewDialog`, `GetRFIReport`, `RFIReport`, `AiTool`

### Patterns
- **Data Display:** MUI DataGrid (lists), Custom Cards (items), Tables (checklists)
- **Forms:** Multi-step (engagement creation), Dialog (editing), Inline (DataGrid)
- **Real-time:** Firestore listeners, chat sync, activity feeds
- **Files:** Drag & drop, preview, PDF viewer

## 17. Security

### Auth
Firebase Auth (Google/Email), custom claims, token validation, status check

### API
**CORS:** Whitelist in `allowedOrigins` (localhost:3000, myworkreview.netlify.app, fridayinc.netlify.app, functions URL)
**Bearer Token:** `/mail-receive` requires `EXPECTED_BEARER_TOKEN`

### Data
Firestore rules: user access, client access, team access, status validation
Storage rules: path-based, signed URLs, upload/download permissions
Service account keys: never commit, rotate regularly

## 18. Performance

### Frontend
Code splitting (lazy routes), Firestore cache, service worker precaching, useMemo/useCallback/React.memo, debouncing

### Backend
PQueue (concurrency 5-10), batch operations, indexed queries, unsubscribe listeners

### Network
Batch writes, parallel requests, asset optimization, CDN

## 19. Error Handling

### Frontend
Error boundaries, snackbar notifications, validation errors, console/Firestore logging

### Backend
Try-catch blocks, HTTP status codes (400/401/403/404/500), developer email notifications

### Logging
RFI activity → `rfis/{id}/activity`
Engagement activity → `engagements/{id}/activity`
Recreation → `recreationLogs/list`
System → `logs/list`

## 20. Backup & Recovery

### Automated
Daily backup via Pub/Sub → Firestore export → `gs://fridaydailybackups`

### Manual
```bash
gcloud firestore export gs://fridaydailybackups/export-$(date +%Y%m%d)
gsutil -m cp -r gs://friday-a372b.appspot.com gs://fridaydailybackups/storage-$(date +%Y%m%d)
```

### Restore
`gcloud firestore import`, `gsutil -m cp -r`

## 21. Troubleshooting

### Auth Issues
- Can't login: Check user in `friday/users/list`, status="active", Firebase Auth exists
- Client can't access: Check custom claims, user document, client status
- My Review fails: Check `keys.mwr`, API endpoint, service account key

### Data Issues
- Can't see engagements: Check role, team assignment, client access, status
- Client can't see RFIs: Check `users[]` assignment, admin role
- Upload fails: Check Storage bucket, rules, auth token

### Backend Issues
- Functions not executing: Check deployment, logs, Pub/Sub topics, Scheduler jobs
- Daily sync fails: Check Google Apps Script, `USER_EMAIL_SYNC_KEY`
- Emails not sending: Check SMTP creds, Nodemailer config

### Common Errors
- "Not allowed by CORS": Add origin to `allowedOrigins`
- "No Bearer token": Include `Authorization: Bearer <token>`
- "User not found": Check `friday/users/list`
- "Permission denied": Check role/permissions

## 22. Development

### Install
```bash
git clone <repo>; cd friday
npm install
cd functions; npm install; cd ..
# Create .env files, add service account keys
firebase login; firebase use friday-a372b
```

### Run
```bash
npm start                    # Frontend :3000
cd functions; npm run serve  # Backend emulator
firebase emulators:start     # Full emulator
```

### Build & Deploy
```bash
npm run build                           # Frontend
firebase deploy --only hosting          # Deploy hosting
firebase deploy --only functions        # Deploy functions
firebase deploy --only functions:api    # Deploy specific function
```

## 23. Function Config
Standard: 512MB, 9min timeout
High Memory: 4GB, 9min timeout
PQueue concurrency: 5-10

## 24. Version Info
Version: 1.1.863, React: 18.2.0, Firebase: 10.7.1, Node: 20, Updated: 7 Nov 2025
