# ProofPoint Design & UI System

This document specifies the authoritative design tokens, visual hierarchy, interaction models, and component guidelines for ProofPoint.

---

## 1. Design Philosophy
ProofPoint is designed as a **Digital Field Office and Documentary Archive**.
It communicates credibility, institutional memory, environmental stewardship, and objective verification.

It consciously rejects:
- Generic "AI startup" visual tropes (purple gradients, glowing blobs, neon cards, dark mode with bright cyan borders).
- Generic SaaS templates (identical 3-card feature columns, centered heroes with two rounded pill buttons).
- Decorative animations that distract from the primary subject: **the photographic and spatial evidence**.

It embraces:
- **Warm paper and deep ink** tactile palette.
- **Editorial typographic hierarchy** (classic serif headlines paired with precise technical monospaced labels).
- **Hairline rules and ledger grids** that organize evidence cleanly.
- **Verification stamps** that look like official documentary stamps rather than decorative badges.
- **Purposeful motion** (tactile drag sliders, scroll-linked storytelling transitions, and scientific geospatial 3D visualization).

---

## 2. Color Palette & Tokens

### Base Foundation
- **Paper (Page Background)**: `#F5F2EB`
- **Surface (Panels / Cards / Modals)**: `#FBF9F4`
- **Surface Hover**: `#F0ECE1`
- **Ink (Primary Text / Headings)**: `#1B221D`
- **Muted Ink (Secondary Text / Captions)**: `#5F6A61`
- **Subtle Ink (Borders & Inactive elements)**: `#8E9890`
- **Rule (Dividers & Hairlines)**: `#D8D2C4` (1px solid)

### Primary Accent
- **Forest (Brand / Primary Action)**: `#2F5D46`
- **Forest Hover**: `#244A38`
- **Forest Active / Focus Ring**: `#1C3A2C`
- **Forest Tint (Background highlight)**: `#E8EFEA`

### Verification Status Indicators
Status indicators are strictly informational, never decorative. They always include text labels and numeric scores where applicable.
- **VERIFIED**:
  - Text & Border: `#2F6B4A`
  - Background Tint: `#E4EEE7`
- **NEEDS REVIEW**:
  - Text & Border: `#9A6B12`
  - Background Tint: `#F4E9CF`
- **FLAGGED**:
  - Text & Border: `#A63A2B`
  - Background Tint: `#F3DAD5`

---

## 3. Typography Hierarchy

### Font Families
- **Newsreader** (Serif): Hero titles, section titles, story narratives, large metric counters.
- **IBM Plex Sans** (Sans-serif): Body text, form controls, navigation, UI labels, button text.
- **IBM Plex Mono** (Monospace): Asset IDs (`PP-0142`), GPS coordinates, timestamps, ledger headers, verification stamps, status checks.

### Scale & Rhythms
- **Display / Hero**: `64px` desktop / `40px` mobile, line-height `1.08`, tracking `-0.02em`
- **Section Heading (H1/H2)**: `40px` / `32px`, line-height `1.15`, tracking `-0.01em`
- **Feature / Subhead (H3)**: `28px` / `24px`, line-height `1.2`
- **Editorial Narrative**: `20px`, line-height `1.6`, measure `680px` max
- **Body Regular**: `16px`, line-height `1.5`
- **UI Small / Captions**: `14px`, line-height `1.4`
- **Technical Monospace Labels**: `11px` to `12px`, uppercase, tracking `0.06em`, tabular figures (`font-variant-numeric: tabular-nums`)

---

## 4. Layout & Grid Architecture

- **Max Container Width**: `1360px` with responsive padding (`24px` mobile, `48px` desktop).
- **Grid Splits**: Asymmetric editorial composition:
  - 8 / 4 column split for Hero and Asset detail views.
  - 7 / 5 column split for Evidence intake (Upload) desk.
  - 4-column contact sheet for Gallery on desktop (`gap: 12px`), 2-column on mobile.
- **Spacing Grid**: Multiples of `8px` (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`).
- **Dividers**: `1px solid #D8D2C4` hairlines with uppercase section identifiers (e.g., `01 / EVIDENCE RECORD`).

---

## 5. Signature Components

### 1. Verification Stamp (`<VerificationStamp status score size />`)
- Shape: Rectangular stamp with `1px solid` border in status color.
- Border radius: `2px`.
- Padding: `4px 8px`.
- Typography: IBM Plex Mono `11px`, bold, uppercase.
- Format: `VERIFIED 92/100` | `NEEDS REVIEW 65/100` | `FLAGGED 30/100`.
- Hover: Displays tooltip with audit summary.

### 2. Evidence Frame (`<AssetCard asset />`)
- Documentary contact sheet feel.
- Image ratio: `4:3` or original aspect.
- Caption strip: Asset ID (`PP-0842`), Location, Date, Verification Stamp.
- Hover behavior: Subtle `1.015` zoom on photo, hairline border contrast transition, metadata highlight.

### 3. Ledger Table (`<Ledger data columns />`)
- Used for Chain of Custody, Verification Checks, and Change Detection tables.
- Hairline horizontal rows (`1px solid #D8D2C4`), no vertical borders.
- Header: IBM Plex Mono `11px` uppercase with tracking.
- Row hover: subtle background tint `#F5F2EB`.

### 4. Comparison Viewer (`<CompareViewer before after />`)
- Side-by-side or split slider using `@react-compare-slider` or custom tactile range.
- Floating mono stamps: `BEFORE [DATE]` and `AFTER [DATE]`.
- Spatial metadata: distance between coordinates and elapsed days.

### 5. AI Estimate Tag (`<AiEstimateTag />`)
- Rectangular badge: `AI ESTIMATE` in IBM Plex Mono `10px`.
- Subdued neutral border `#D8D2C4`, text `#5F6A61`.
- Mandatory on all Gemini-derived values (trees, waste level, water clarity, vegetation).

### 6. Geospatial 3D Visualization (`<ProofPointTerrain />` / `<EvidenceGlobe />`)
- Built with Three.js / React Three Fiber / Drei.
- Topographic wireframe / earth terrain in muted dark forest (`#1B2E24`), slate ink (`#2A3630`), and parchment highlights.
- Interactive coordinates for verified project clusters.
- Gentle idle rotation with mouse-tilt parallax.
- Respects `prefers-reduced-motion` and falls back gracefully on low-power devices.

---

## 6. Motion & Interaction Standards

### Level 1: Micro-interactions (150ms - 200ms)
- Button hover background transitions: `ease-out`.
- Text links underline growth from left to right.
- Inputs focus: `2px solid #2F5D46` with `2px offset`.

### Level 2: Component Interactions (250ms - 350ms)
- Compare slider tactile drag feedback.
- Contact sheet filter layout reordering (`layout` transitions via Motion).
- Accordion & modal disclosures.

### Level 3: Storytelling & Scroll Choreography
- Sticky scroll narrative on the landing page (Upload -> Check -> Compare -> Publish).
- As user scrolls, the specimen sheet updates interactively.
- Hero typography and 3D globe coordinate lock.

### Prohibited Motion
- No cursor trails or particle fields.
- No text typing or scrambling effects.
- No bouncing bouncy buttons or decorative spinning shapes.
- No scroll-jacking or blocking wheel events.

---

## 7. Accessibility & Quality Rules
- WCAG AA contrast ratio (> 4.5:1 for normal text, > 3:1 for large text).
- Visible keyboard focus on all interactive elements.
- Accessible ARIA labels on icon buttons and sliders.
- All images have descriptive alt text derived from caption or project name.
- Responsive breakpoints tested at `375px`, `768px`, and `1440px`.
