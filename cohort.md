# Cohort Program Architecture & Documentation

This document explains the technical architecture, business logic, checkout flow, referral rules, and troubleshooting guidelines for the Cohort Program module.

---

## 1. Schema & Data Model

The cohort program is managed using the following database tables (defined in `lib/schema.ts`):

### `cohorts`
- Represents the cohort program itself.
- Contains:
  - `title`, `slug`, `startDate`.
  - `coverImageUrl` (legacy sync cover URL) and `coverImageUrls` (array storing up to 3 banner images for the hero carousel).
  - `cardImageUrl` (shown on the cohort catalog card).
  - `highlights` (text array displaying all card features/bullets without limits).
  - `isBestSeller` and `isFillingFast` (boolean flags to render corner tags on catalog cards).
  - `hasEarlyBird` (boolean toggle flag to show/hide the continuous scrolling early bird offer marquee banner on cohort detail and checkout screens).
  - `mentorsHeading` (custom title for Mentors section).
  - `featuresHeading` (custom title for "What You Get" section).
  - `sessionsHeading` (custom title for "Cohort Sessions & Curriculum" section).
  - `testimonialsHeading` (custom title for "What Members Say About Our Ecosystem" section).
  - `whoIsThisForHeading` and `whoIsThisForBullets` (heading and custom target audience bullet list for the "Who Is This For?" section).
  - Linked `toolkitId`.

### `cohort_sessions`
- Represents curriculum sessions shown week-by-week.
- Contains `price` (final/offer price when sold individually) and `originalPrice` (strikethrough price shown to user) columns. If `price` > 0, the session is treated as an individual purchasable add-on in the checkout apply drawer.

### `cohort_tiers`
- Bundle package options (e.g. Basic, VIP). Contains `price` (final/offer price in INR) and `originalPrice` (strikethrough price shown to user).

### `cohort_orders`
- Stores all purchase history.
- Key Columns:
  - `status`: `"pending"` or `"paid"`.
  - `userId`: Buyer's account identifier.
  - `buddyEmail`: Optional email of a referred friend.
  - `selectedTierId`: Selected package.
  - `selectedAddOnIds`: Array of selected individual session IDs.
  - `selectedToolkitIds`: Array of extra toolkits purchased as add-ons.

---

## 2. Business & Pricing Logic

The checkout pricing system supports three distinct categories:
1. **Bundle Offers**: Preset packages mapped from `cohort_tiers`.
2. **Individual Sessions**: Selected from curriculum sessions (`cohort_sessions`).
3. **Toolkit Add-ons**: Pulled directly from the toolkit management registry.

### Selection Rules & Validation
- **Bundle Offer vs. Individual Sessions**: A user **must select at least one** category but **cannot select both**. They must choose exactly a Bundle Offer (Tier) OR one or more Individual Sessions.
- **Toolkits**: Toolkits are completely optional add-ons that can be added to either selection.

### Duo (Buddy) Pricing & Referral Formula
When a buyer enters a **Buddy Email Address** during checkout, they get a flat 20% discount on the cohort offer price:

1. **Buddy Discount (20% off)**:
   - Applied **ONLY** to the selected Bundle Offer (Tier price) or the sum of selected Individual Sessions.
   - **EXCLUDES** Toolkit Add-ons (toolkits are always paid at full price).
   - Formulas:
     - `finalTierPrice = Math.round(tierPrice * 0.8)`
     - `finalAddonsTotal = Math.round(addonsTotal * 0.8)`

2. **Total Payable**:
   - `payable = finalTierPrice + finalAddonsTotal + toolkitsTotal - couponDiscount`

This logic is validated on the client side (for real-time totals) and strictly checked on the server inside `app/api/cohorts/[id]/checkout/route.ts` before creating the Razorpay order.

### Access Rights (Authorization & Buddy Limits)
- **Primary Buyer**: Gets access to the cohort program, its sessions, and all selected toolkit add-ons.
- **Buddy Referral**: The referred buddy (`buddyEmail`) gets access **ONLY** to the cohort program and its main linked `toolkitId`.
- **Buddy Limit**: The buddy **does not** get access to any additional purchased toolkit add-ons (`selectedToolkitIds`).

---

## 3. UI Layout & Section Sequence

The public cohort details page (`app/toolkit/cohorts/[id]/page.tsx`) renders sections in this exact sequence:
1. **Hero Banner Carousel**: Animated, auto-playing Framer Motion carousel cycling through up to 3 banner images with manual navigation arrows and dot indicators.
2. **Mentors**: Customizable header containing active mentors with ordering controls.
3. **Cohort Sessions & Curriculum**: Customizable header showing week-by-week sessions.
4. **What You Get (Features)**: Checklist grid showing inclusions.
5. **Who Is This For?**: Clean responsive grid listing target audiences using numbered custom orange circular tags.
6. **Buddy Program Referral Banner**: Highlights ungatekeep 20% duo off banner with custom copy.
7. **Testimonials**: Custom header showing user feedback quotes.

*Note: The floating WhatsApp widget is conditionally hidden on all routes starting with `/toolkit/cohorts/` to keep detail pages clutter-free.*

---

## 4. Admin Management Controls

Admins manage cohort details under the `Cohort Management` board:
- **General Fields**: General properties (Title, Slug, Start Date description, and Switch toggles for **Best Seller** / **Filling Fast** card tags).
- **Banner Slots**: Supports 3 explicit slots for cover images. Each slot accepts direct local file uploads (saved to R2 `ungatekeep-images`) or pasting image URLs.
- **Section Headers**: Editable inputs for Mentors, Features, Curriculum, Testimonials, and target audience headings.
- **Card Highlights**: Dynamically grows/shrinks; all added features are displayed on catalog cards with no length restrictions.
- **Curriculum & Pricing**: Allows admins to add sessions, set individual session Offer Prices and Original Prices, reorder sessions, and toggle the **Early Bird Offer** scrolling marquee.
- **Orders Log**: Only lists orders with status `"paid"` to keep the log clean and exclude abandoned checkouts.

---

## 5. Troubleshooting & Bug Resolution

### Bug: "Banner image fails to upload"
- **Reason**: The S3/R2 domain was set to `"opportunity-images"`, which may have incorrect bucket configurations or permissions compared to `"ungatekeep-images"`.
- **Fix**: The upload handler has been updated to use the fully verified `"ungatekeep-images"` domain matching the mentors uploads.

### Bug: "Cover image order shifts on reload"
- **Reason**: Incomplete array structures allowed index holes (e.g. `[undefined, "url"]`) which were filtered out by backend saves.
- **Fix**: The admin editor now guarantees `coverImageUrls` is always initialized with exactly 3 indices.
