# Sprint System Architecture & Operational Guide (SPRINT.md)

This document provides an exhaustive, production-grade technical overview of the **Sprint System** built within this repository. It covers all completed features, database models, API route specifications, client interfaces, potential edge cases / bugs with their resolutions, and critical rules that must not be broken.

---

## Table of Contents
1. [Overview & Architectural Vision](#1-overview--architectural-vision)
2. [What Has Been Completed](#2-what-has-been-completed)
3. [Database Schema & Entity Models](#3-database-schema--entity-models)
4. [Complete API Route Directory & Contracts](#4-complete-api-route-directory--contracts)
5. [Frontend Client Pages & UI Components](#5-frontend-client-pages--ui-components)
6. [Payment, Checkout & Registration Lifecycle](#6-payment-checkout--registration-lifecycle)
7. [Session Access & CDN Security Rules](#7-session-access--cdn-security-rules)
8. [Possible Bugs, Edge Cases & How to Resolve Them](#8-possible-bugs-edge-cases--how-to-resolve-them)
9. [Critical Rules: "DO NOT TOUCH AT ANY COST"](#9-critical-rules-do-not-touch-at-any-cost)
10. [Pending & Recommended Next Steps](#10-pending--recommended-next-steps)

---

## 1. Overview & Architectural Vision

The **Sprint System** provides high-intensity, structured short courses and workshops designed to give students actionable skills in days rather than months. It has complete feature and UX parity with the existing **Cohort System**, but is optimized for modular session-by-session video streaming, targeted upgrade packages, dedicated mentor cards, and student registration tracking.

```
[ Visitor / Public Landing ]
         │
         ▼
[ /toolkit/sprints/[id] ] ──(Razorpay Checkout)──► [ /api/sprints/[id]/checkout ]
         │                                                      │
         │ (Success Callback)                                   │
         ▼                                                      ▼
[ /toolkit/sprints/[id]/registration ] ◄────────── [ Payment Verified & Order Logged ]
         │
         │ (Form Submitted)
         ▼
[ /toolkit/sprints/[id]/dashboard ]
  ├── Interactive Session Video Player (Bunny CDN Protected)
  ├── Notes, Downloadable Resources & Mentors
  ├── Live Student-Mentor Q&A System
  └── SprintUpgradeGrid (Targeted Upgrades & Add-ons)
```

---

## 2. What Has Been Completed

### A. Admin Suite (`app/admin/`)
* **`AdminSprintsTable.tsx`**:
  * Full CRUD for Sprints (Title, custom URL slug, base price, active/draft toggle, cover images, descriptions, feature bullets).
  * **Orders Log View**:
    * Status filter pills: `All`, `Paid`, `Pending / Created`, `Failed`.
    * Multi-field search (buyer name, email, Razorpay order ID, payment ID, sprint title).
    * Order verification toggle button (`Verify` / `Unverify`), disabled for unpaid records.
    * Registration completion indicators (`Registered` vs `Not Submitted`).
    * Formula-injection-safe CSV export (`sprint_orders_<timestamp>.csv`).
  * **Registration Details View**:
    * Displays student demographics: Name, College, Course, Year, Learning Expectations, Plan/Upgrade Opted, Selected Sessions, and Individual Sessions.
    * Search bar filtering student name, college, email, course, and plan.
    * Formatted CSV export (`sprint_registrations_<timestamp>.csv`).
    * "Manage Packages" button triggering targeted user package overrides.
* **`SprintSessionManager.tsx`**:
  * Add, edit, delete, and reorder sessions within any sprint.
  * Upload custom video thumbnails and banner images.
  * Manage multiple video content streams (Bunny Stream IDs, CDN URLs, custom video players), session notes, and downloadable resource attachments.
  * Configure session mentors and access locks.
* **`SprintUpgradePlansManager.tsx`**:
  * Clean white card redesign with responsive column grids.
  * Add custom upgrade plans, sections, prices, and feature bullet lists.
* **`SprintMentorManager.tsx`**:
  * White dialog styling, tilt badges, avatar uploads, and social links for sprint mentors.
* **`SprintFaqManager.tsx`**:
  * Manage FAQ items and upload custom FAQ section banner images.
* **`SprintSessionQueriesManager.tsx`**:
  * Review, answer, and manage student doubts/queries submitted from session cards.
* **`ManageUserSprintPackagesModal.tsx`**:
  * Modal interface for administrators to enable or disable targeted upgrade packages for specific students.

### B. Student & Public Experience (`app/toolkit/sprints/[id]/`)
* **`SprintDetailClient.tsx` (Public Landing Page)**:
  * Dynamic curriculum list, interactive preview session cards, pricing tiers, FAQs, mentors, and Razorpay checkout modal trigger.
* **`registration/page.tsx` (Student Onboarding)**:
  * Collects student name, college, course, year, and learning expectations immediately after payment.
* **`dashboard/page.tsx` (Enrolled Student Dashboard)**:
  * Session cards list with lock/unlock status badges, video playback, notes, resource downloads, and live Q&A submission.
* **`dashboard/SprintUpgradeGrid.tsx`**:
  * In-dashboard upgrade plan grid for students wanting to unlock extra sessions or tier upgrades.

### C. Backend API Infrastructure
* Standardized Razorpay checkout initialization, verification, and failure tracking.
* Bunny CDN token-authenticated stream URLs to prevent video expiration (403 errors) while ensuring strict access control.
* User package targeting endpoints (`/api/admin/sprints/[id]/user-targets`).

---

## 3. Database Schema & Entity Models

All models are defined in [`lib/schema.ts`](file:///Users/anchitgoel/Desktop/ftb/lib/schema.ts):

### Key Tables
1. **`sprints`**:
   * Core entity storing title, slug, subtitle, cover images, base price, feature lists, mentors heading, FAQs heading, active status.
2. **`sprintSessions`**:
   * Individual curriculum modules: `sprintId`, `title`, `description`, `orderIndex`, `price`, `isUnlocked` (free preview toggle), `thumbnailUrl`, `duration`.
3. **`sprintSessionContents`**:
   * Video stream metadata: `sessionId`, `videoUrl`, `bunnyVideoId`, `notesHtml`, `contentOrder`.
4. **`sprintSessionResources`**:
   * Downloadable materials: `sessionId`, `title`, `fileUrl`, `fileType`, `fileSize`.
5. **`sprintSessionMentors`**:
   * Assigned mentors per session.
6. **`sprintUpgradePlans`**:
   * Custom upgrade plans: `sprintId`, `title`, `description`, `price`, `sectionLabel`, `isAllInOne`, `includedSessionCount`, `features`.
7. **`userSprintTargetPlans`**:
   * Overrides enabling/disabling specific upgrade packages per user (`userId`, `sprintId`, `planId`, `isEnabled`).
8. **`sprintOrders`**:
   * Purchase logs: `userId`, `buyerName`, `buyerEmail`, `buyerPhone`, `buddyEmail`, `amountPaid`, `razorpayOrderId`, `razorpayPaymentId`, `status` (`created` | `paid` | `failed`), `selectedTierId`, `selectedUpgradePlanId`, `selectedSessionIds`, `selectedAddOnIds`, `registrationName`, `registrationCollege`, `registrationCourse`, `registrationYear`, `registrationExpectations`, `registrationCompletedAt`, `isVerified`.
9. **`sprintSessionQueries` & `sprintSessionQueryReplies`**:
   * Discussion and doubt clearing threads per session.

---

## 4. Complete API Route Directory & Contracts

### Admin Routes
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET`, `POST` | `/api/admin/sprints` | List all sprints / Create new sprint |
| `GET`, `PUT`, `DELETE` | `/api/admin/sprints/[id]` | Fetch, update, or delete a sprint |
| `GET` | `/api/admin/sprints/orders` | Fetch all sprint orders (all statuses) |
| `PATCH` | `/api/admin/sprints/orders/[orderId]/verify` | Toggle `isVerified` on an order |
| `GET`, `POST` | `/api/admin/sprints/[id]/sessions` | List / Create sessions for a sprint |
| `GET`, `PUT`, `DELETE` | `/api/admin/sprint-sessions/[id]` | Get, update, delete session |
| `GET`, `POST` | `/api/admin/sprints/[id]/user-targets` | Get / Update per-user upgrade plan targets |
| `GET`, `POST` | `/api/admin/sprint-session-queries` | Review and reply to student queries |

### Public & Student Routes
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sprints/[id]` | Public sprint details (by slug or ID) |
| `POST` | `/api/sprints/[id]/checkout` | Initialize Razorpay order (or free enrollment) |
| `POST` | `/api/sprints/[id]/checkout/verify` | Verify Razorpay signature & record paid order |
| `POST` | `/api/sprints/[id]/checkout/failed` | Log failed/declined payment attempts |
| `GET` | `/api/sprints/[id]/dashboard` | Fetch student enrollment access & session data |
| `POST` | `/api/sprints/[id]/registration` | Submit student onboarding demographics form |
| `GET` | `/api/sprints/[id]/sessions/[sessionId]` | Fetch authenticated session media/video tokens |
| `POST` | `/api/sprints/[id]/sessions/[sessionId]/queries` | Submit student doubt/query |

---

## 5. Frontend Client Pages & UI Components

### 1. Admin Tables & Managers
- **[`AdminSprintsTable.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/admin/AdminSprintsTable.tsx)**: Main sprint portal containing Sprints table, Orders Log, and Registration Details.
- **[`SprintSessionManager.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/admin/SprintSessionManager.tsx)**: Session builder modal with tabs for details, video content streams, downloadable resources, and mentors.
- **[`SprintUpgradePlansManager.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/admin/SprintUpgradePlansManager.tsx)**: Upgrade plan cards editor.
- **[`SprintMentorManager.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/admin/SprintMentorManager.tsx)** & **[`SprintFaqManager.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/admin/SprintFaqManager.tsx)**: Mentor and FAQ editors.
- **[`ManageUserSprintPackagesModal.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/admin/ManageUserSprintPackagesModal.tsx)**: User package assignment modal.

### 2. Student Interface
- **[`SprintDetailClient.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/toolkit/sprints/[id]/SprintDetailClient.tsx)**: Public landing view with video previews, highlights, pricing plans, and checkout.
- **[`registration/page.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/toolkit/sprints/[id]/registration/page.tsx)**: Onboarding form.
- **[`dashboard/page.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/toolkit/sprints/[id]/dashboard/page.tsx)**: Student learning portal.
- **[`SprintUpgradeGrid.tsx`](file:///Users/anchitgoel/Desktop/ftb/app/toolkit/sprints/[id]/dashboard/SprintUpgradeGrid.tsx)**: Upgrade plan grid component.

---

## 6. Payment, Checkout & Registration Lifecycle

```
[ Student clicks "Enroll Now" / "Upgrade" ]
                    │
                    ▼
       POST /api/sprints/[id]/checkout
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [ Paid Order ]            [ Free Order ]
       │                         │
  Returns Razorpay          Records Order directly
  Order ID + Key            with status: 'paid'
       │                         │
       ▼                         ▼
  Razorpay Modal Popup      Redirects to /registration
       │
  ┌────┴──────────────────────────┐
  │                               │
[ Success ]                   [ Failed / Dismissed ]
  │                               │
  ▼                               ▼
POST /checkout/verify         POST /checkout/failed
  │                               │
  ▼                               ▼
Records status: 'paid'        Records status: 'failed'
  │                           Visible in Admin Orders Log
  ▼
Redirects to /registration
  │
  ▼
POST /api/sprints/[id]/registration
  │
  ▼
Updates registrationName, College, Year, Expectations, registrationCompletedAt
  │
  ▼
Redirects to /toolkit/sprints/[id]/dashboard
```

---

## 7. Session Access & CDN Security Rules

1. **Free / Preview Sessions**:
   * Sessions with `isUnlocked = true` are viewable by all logged-in users regardless of purchase.
2. **Paid Base Plan Students**:
   * If a student purchased the base plan or bundle (`isBundleUser = true`), they get access to all standard curriculum sessions.
3. **Targeted / Add-on Sessions**:
   * If a student purchased individual sessions or targeted plans, the backend checks `sprintOrders.selectedSessionIds`, `sprintOrders.selectedAddOnIds`, and `userSprintTargetPlans`.
4. **Bunny CDN Authentication**:
   * Direct CDN MP4/HLS URLs must never be exposed without server-signed tokens.
   * Signed URLs are generated per-request with short-lived tokens, avoiding token expiration on the client while keeping media protected.

---

## 8. Possible Bugs, Edge Cases & How to Resolve Them

### Bug 1: Razorpay Payment Configuration Error on Checkout
* **Symptom**: Clicking "Enroll Now" or "Upgrade" displays a toast: *"Razorpay key not found"* or *"Payment configuration error"*.
* **Root Cause**: Environment variables for Razorpay (`RAZORPAY_KEY_ID` vs `NEXT_PUBLIC_RAZORPAY_KEY_ID`) missing or not resolved in the server route.
* **Resolution**: In [`lib/razorpay.ts`](file:///Users/anchitgoel/Desktop/ftb/lib/razorpay.ts) and `/api/sprints/[id]/checkout/route.ts`, always use the fallback:
  ```typescript
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  ```

### Bug 2: Video Player Returns 403 Forbidden After a Few Hours
* **Symptom**: Videos play upon initial addition, but fail with `403 Forbidden` later.
* **Root Cause**: Hardcoding pre-signed CDN query tokens into the database or video URL strings.
* **Resolution**: Store the clean video path or Bunny Video GUID in `sprintSessionContents.videoUrl` / `bunnyVideoId`. Sign the streaming URL dynamically in `/api/sprints/[id]/sessions/[sessionId]` when the student accesses the player.

### Bug 3: Free / Zero-Amount Checkout Razorpay Modal Failure
* **Symptom**: Sprints priced at `₹0` attempt to initialize Razorpay and fail because Razorpay requires minimum `₹1.00`.
* **Root Cause**: Checkout route not checking `if (finalAmount <= 0)`.
* **Resolution**: Handled in `/api/sprints/[id]/checkout/route.ts`:
  ```typescript
  if (finalAmount <= 0) {
    // Create paid order immediately and return { success: true, free: true }
  }
  ```

### Bug 4: Admin Orders Log Only Showing Paid Records
* **Symptom**: Pending or failed checkouts do not appear in the admin order logs.
* **Root Cause**: Query having `.where(eq(sprintOrders.status, "paid"))`.
* **Resolution**: Query all orders without hardcoded status filters in `app/api/admin/sprints/orders/route.ts` and allow the client table to filter via status pills (`All`, `Paid`, `Pending`, `Failed`).

### Bug 5: CSV Export Vulnerability to Formula Injection
* **Symptom**: Student inputs beginning with `=`, `+`, `-`, or `@` causing spreadsheet calculation execution when exported.
* **Root Cause**: Raw string concatenation in CSV export.
* **Resolution**: Handled in `exportOrdersCSV` and `exportRegistrationsCSV` via `sanitizeCSV`:
  ```typescript
  const sanitizeCSV = (val: string): string => {
    if (/^[=+\-@]/.test(val)) return `\t${val}`;
    return val;
  };
  ```

---

## 9. Critical Rules: "DO NOT TOUCH AT ANY COST"

1. **Do NOT Modify the Order Verification API Schema**:
   * [`app/api/admin/sprints/orders/[orderId]/verify/route.ts`](file:///Users/anchitgoel/Desktop/ftb/app/api/admin/sprints/orders/[orderId]/verify/route.ts) toggles `isVerified`. The field must remain a boolean on `sprintOrders`.
2. **Do NOT Remove the Razorpay Key Fallback in `lib/razorpay.ts`**:
   * Next.js App Router environment variable loading differs across client and server runtimes. Always preserve `process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. **Do NOT Store Signed Tokens in Database Video Content Records**:
   * Storing raw Bunny tokens in `sprintSessionContents.videoUrl` causes video playback failure after token expiration. Dynamic generation in the session route is mandatory.
4. **Maintain Strict Symmetrical Parity Between Cohorts and Sprints**:
   * Any change made to `AdminCohortsTable.tsx` / `CohortDetailClient.tsx` (e.g. order filters, registration demographics, package management) must be mirrored in `AdminSprintsTable.tsx` / `SprintDetailClient.tsx`.
5. **Preserve Registration Field Names in `sprintOrders`**:
   * `registrationName`, `registrationCollege`, `registrationCourse`, `registrationYear`, `registrationExpectations`, and `registrationCompletedAt` are shared across CSV exporters, admin tables, and student dashboards.

---

## 10. Pending & Recommended Next Steps

1. **Automated Certificate Generation**:
   * Add a certificate trigger once a student marks all sprint sessions completed on `/toolkit/sprints/[id]/dashboard`.
2. **Live Session Reminders / WhatsApp Notifications**:
   * Integrate webhook triggers on `sprintOrders.status = "paid"` to send calendar invites or WhatsApp confirmation messages.
3. **Sprint Completion Analytics**:
   * Add a completion percentage column to the Registration Details tab to track student video watch progress.
