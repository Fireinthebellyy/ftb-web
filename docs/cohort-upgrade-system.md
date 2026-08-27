# Cohort Upgrade System — Rules & Logic

> Last updated: August 2026
> Branch: `k/cohort-upgrade-targeting`

---

## Overview

The Cohort Upgrade System allows admins to configure upgrade plans for a cohort, target specific plans to specific users, and surface those plans to users as a horizontal card carousel inside an upgrade modal on the cohort session page.

---

## Database Schema

### `cohort_upgrade_plans`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `cohort_id` | UUID | FK → `cohorts.id` (cascade delete) |
| `title` | text | Display title on card |
| `description` | text | Short subtitle |
| `price` | integer | Price in ₹ |
| `original_price` | integer | Optional strikethrough price |
| `included_session_count` | integer | Max sessions user can pick (session-based); `null` for custom plans |
| `included_session_ids` | jsonb | Pinned session IDs (`string[]`); empty for free-choice or custom |
| `is_all_in_one` | boolean | If true, unlocks all cohort sessions |
| `badge_text` | text | Corner ribbon label (e.g. "Most Popular") |
| `features` | jsonb | Bullet-point feature list (`string[]`) |
| `order_index` | integer | Display order (lower = first) |
| `is_active` | boolean | Controls visibility to users |
| `created_at` | timestamp | Auto-set |

### `user_cohort_target_plans`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | text | References `user.id` |
| `cohort_id` | UUID | References `cohorts.id` |
| `plan_id` | UUID | References `cohort_upgrade_plans.id` |
| `is_enabled` | boolean | `true` = show; `false` = hide for this user |

---

## Plan Types

### 1. Session-Based Package
- `isAllInOne = false`
- `includedSessionCount` is set (e.g. `3`)
- `includedSessionIds` may be empty (free choice) or populated (pinned sessions)

**Behaviour:**
- Pinned sessions → user gets those specific sessions
- No pinned sessions → user picks any N sessions via the session picker dialog

### 2. Full Cohort Pass
- `isAllInOne = true`
- Unlocks ALL sessions, recordings, and resources

**Behaviour:** Goes directly to checkout. No session picker.

### 3. Custom / General Plan
- `isAllInOne = false`
- `includedSessionCount = null`
- `includedSessionIds = []`

**Behaviour:** Not tied to cohort sessions. Direct to checkout. No session picker.
Can represent: mentorship, bootcamp, product, certificate, etc.

---

## Button Label Decision Table

| Condition | Button Label |
|---|---|
| Processing payment | `"Processing..."` |
| `isAllInOne = true` | `"Upgrade Plan"` |
| Custom plan (no session count, no pinned sessions) | `"Upgrade Plan"` |
| Session-based, pinned sessions, user owns some | `"Swap Owned Sessions & Upgrade"` |
| Session-based, `includedSessionCount` set, no pinned sessions | `"Select Sessions & Upgrade"` |
| Session-based, pinned sessions, user owns none | `"Upgrade Plan"` |

---

## handleCardClick Flow

```text
1. isAllInOne?
   → handleUpgrade(plan, [])

2. isCustomPlan (no isAllInOne, no includedSessionIds, no includedSessionCount)?
   → handleUpgrade(plan, [])

3. includedSessionIds populated?
   a. User already owns some of those sessions?
      → Pre-fill session picker with unowned + replacement candidates
      → Open session picker dialog
   b. No overlap?
      → handleUpgrade(plan, includedSessionIds) directly

4. No pinned sessions (free choice, includedSessionCount set)?
   → Pre-fill picker with up to N unpurchased sessions
   → Open session picker dialog
```

---

## Session Picker Dialog Rules

- **Required count** = `min(targetCount, totalUnpurchasedSessions)`
- User must select **exactly** `requiredCount` sessions to enable pay button
- Already-unlocked sessions shown as disabled/pre-checked
- Selecting more than `requiredCount` shows an error toast
- On confirm → `handleUpgrade(plan, selectedSessionIds)`

---

## Payment Flow (`handleUpgrade`)

```text
1. POST /api/cohorts/[id]/checkout
   Body: { selectedUpgradePlanId, selectedAddOnIds, price, isAllInOne }

2. response.data.free === true?
   → toast.success → onUpgradeSuccess()

3. Else → load Razorpay SDK dynamically

4. Open Razorpay modal

5. On payment success:
   POST /api/cohorts/[id]/checkout/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

6. Verify success → toast.success → onUpgradeSuccess()
7. Dismiss/cancel → toast.info("Upgrade cancelled")
```

---

## Admin: Plan Management (`CohortUpgradePlansManager`)

**File:** `app/admin/CohortUpgradePlansManager.tsx`
**Access:** Admin → Cohorts → "Upgrade Plans" per cohort

### Form Fields

| Field | Required | Description |
|---|---|---|
| Plan Type | ✅ | Session-Based / Full Cohort Pass / Custom |
| Section Label | — | Small orange uppercase text above title on card |
| Plan Title | ✅ | Main heading |
| Short Description | — | Subtitle below title |
| Badge Text | — | Corner ribbon (e.g. "Most Popular") |
| Price (₹) | ✅ | Actual selling price; 0 for free |
| Original Price (₹) | — | Shown as strikethrough |
| Session Count | Session-Based only | How many sessions user can pick |
| Pin Specific Sessions | Session-Based only | Locks package to exact sessions |
| Features List | — | One per line → bullet points on card |
| Order Index | — | Lower = first in carousel |
| Active Toggle | — | Only active plans shown to users |

### Preset Initialization
If no plans exist, admin can click **"Init Presets"** to generate 3 standard plans:
- 3-Session Skill Pack
- Pro Multi-Session Pass
- All-In-One Full Pass

---

## Admin: User Package Targeting (`ManageUserPackagesModal`)

**File:** `app/admin/ManageUserPackagesModal.tsx`
**Access:** Admin → Registration Details → "Manage Packages" column

### Purpose
Enable/disable specific upgrade plans per individual user.

### Rules
- No target records for a user → **all active plans shown** (default)
- Target record with `isEnabled = false` → plan **hidden** for that user
- Target record with `isEnabled = true` → plan shown (explicit opt-in)
- Filtering happens server-side in `GET /api/cohorts/[id]/dashboard`

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/admin/cohorts/[id]/upgrade-plans` | GET | List all plans for cohort |
| `/api/admin/cohorts/[id]/upgrade-plans` | POST | Create plan (or `init_presets`) |
| `/api/admin/cohorts/[id]/upgrade-plans/[planId]` | PUT | Update plan |
| `/api/admin/cohorts/[id]/upgrade-plans/[planId]` | DELETE | Delete plan |
| `/api/admin/cohorts/[id]/user-targets` | GET | Get targeting state for all users |
| `/api/admin/cohorts/[id]/user-targets` | POST | Set `isEnabled` for a user+plan pair |
| `/api/cohorts/[id]/dashboard` | GET | Returns sessions + filtered upgrade plans |
| `/api/cohorts/[id]/checkout` | POST | Initiates Razorpay order |
| `/api/cohorts/[id]/checkout/verify` | POST | Verifies Razorpay payment signature |

---

## User-Facing Upgrade Modal

**Files:** `page.tsx` + `CohortUpgradeGrid.tsx` under `app/toolkit/cohorts/[id]/dashboard/`

### Trigger
Orange **"Upgrade"** button in the top-right of the cohort session page header (visible to all users).

### Card Carousel Rules
- Always horizontal scroll (`overflow-x-auto`, `snap-x snap-mandatory`) — no grid at any breakpoint
- Card width: `280px` mobile / `300px` sm+
- First card = **Current Plan** (read-only; shows what user already paid)
- Remaining cards = active upgrade plans from API, filtered per user
- Featured ring (orange) on plans where `badgeText` includes "popular" or `isAllInOne = true`

### Current Plan Card Shows
- Amount paid (₹)
- Plan summary: All-in-one pass OR N of M sessions unlocked

---

## Design Rules

- No AI/sparkle/star/emoji decorative icons anywhere in this feature
- Clean, minimal, professional style
- Orange (`#ea580c`) = primary accent, featured plans, CTAs
- Emerald = Full Cohort Pass badges
- Blue = Custom plan type badges (admin list only)

---

## File Map

```text
app/
├── admin/
│   ├── CohortUpgradePlansManager.tsx     # Create/edit/delete upgrade plans
│   └── ManageUserPackagesModal.tsx        # Per-user plan targeting toggles
├── api/admin/cohorts/[id]/
│   ├── upgrade-plans/route.ts             # GET/POST
│   ├── upgrade-plans/[planId]/route.ts    # PUT/DELETE
│   └── user-targets/route.ts             # GET/POST targeting
├── api/cohorts/[id]/
│   ├── dashboard/route.ts                 # Returns plans filtered per user
│   └── checkout/route.ts                 # Razorpay order init + verify
└── toolkit/cohorts/[id]/dashboard/
    ├── page.tsx                           # Modal trigger + Upgrade button
    └── CohortUpgradeGrid.tsx             # Card carousel + session picker dialog

lib/schema.ts                              # cohortUpgradePlans + userCohortTargetPlans

migrations/
├── 0066_add_cohort_upgrade_plans.sql
└── 0067_add_user_cohort_target_plans.sql
```
