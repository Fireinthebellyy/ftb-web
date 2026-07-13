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
  - `mentorsHeading` (custom title for Mentors section).
  - `featuresHeading` (custom title for "What You Get" section).
  - `sessionsHeading` (custom title for "Cohort Sessions & Curriculum" section).
  - `testimonialsHeading` (custom title for "Testimonials" section).
  - `whoIsThisForHeading` and `whoIsThisForBullets` (heading and custom target audience bullet list for the "Who Is This For?" section).
  - Linked `toolkitId`.

### `cohort_sessions`
- Represents curriculum sessions shown week-by-week.
- Contains `priceDelta` column. If `priceDelta` > 0, the session is treated as an individual purchasable add-on in the checkout apply drawer.

### `cohort_tiers`
- Bundle package options (e.g. Basic, VIP). Contains `price` (in INR).

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

### Single vs. Duo (Buddy) Pricing Formula
When a buyer enters a **Buddy Email Address** during checkout, the base prices for the selected bundle tier (and/or individual sessions) are dynamically converted from a single-ticket rate to a discounted Duo rate on-the-fly:

1. **Duo Reference Price** (Strike-through price shown to user):
   $$\text{Reference} = \text{Math.ceil}\left(\frac{\text{Single Price} \times 2 + 1}{100}\right) \times 100 - 1$$
   *(e.g., Single price of $499 \times 2 = 998 \rightarrow 999$)*

2. **Duo Final Price** (Actual price charged for 2 people):
   $$\text{Final} = \text{Math.round}\left(\frac{\text{Reference} \times 0.8}{10}\right) \times 10 - 1$$
   *(e.g., $999 \times 0.8 = 799.2 \rightarrow \text{rounded to nearest ending in 9} \rightarrow 799$)*

3. **Per-Head Subtext**: Displays estimated rate per head:
   $$\text{Per Head} = \text{Math.round}\left(\frac{\text{Final}}{2}\right)$$
   *(e.g., $\approx \text{₹400 per person}$)*

This formula runs dynamically and synchronously on both the client (for real-time updates) and the server (for secure Razorpay order validation).

### Access Rights (Authorization)
Access to the cohort page and its linked toolkit contents is granted to a user if:
1. **Primary Buyer**: They purchased it (`userId` matches logged-in user).
2. **Buddy Referral**: They were referred by a buyer (`buddyEmail` matches logged-in user's email).

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
- **Orders Log**: Only lists orders with status `"paid"` to keep the log clean and exclude abandoned checkouts.

---

## 5. Troubleshooting & Bug Resolution

### Bug: "Banner image fails to upload"
- **Reason**: The S3/R2 domain was set to `"opportunity-images"`, which may have incorrect bucket configurations or permissions compared to `"ungatekeep-images"`.
- **Fix**: The upload handler has been updated to use the fully verified `"ungatekeep-images"` domain matching the mentors uploads.

### Bug: "Cover image order shifts on reload"
- **Reason**: Incomplete array structures allowed index holes (e.g. `[undefined, "url"]`) which were filtered out by backend saves.
- **Fix**: The admin editor now guarantees `coverImageUrls` is always initialized with exactly 3 indices.
