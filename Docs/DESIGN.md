# DESIGN.md: ProofPoint visual direction

This file OVERRIDES every visual instruction elsewhere (dark theme, sidebar, aurora, spotlight, bento, glow, count-up, stagger animations, emerald tokens). Data logic and API stay as in CONTEXT.md.

## Concept: "field report"
The product should look like something an environmental survey team or a documentary photo desk built for itself: paper, ink, rules, contact sheets, ledgers, stamps. It must NOT look like a SaaS template. Photos are the visual hero. Everything else is quiet, typographic and precise.

## Never do (audit against this list)
- Dark UI with neon/emerald/teal glow; any gradient (especially purple, blue, teal); aurora, mesh, blob or particle backgrounds
- Glassmorphism, backdrop-blur cards, glowing borders, big soft drop shadows
- Cursor-follow spotlight effects, bento grids of equal rounded tiles, gradient text
- Icons inside colored circles above feature titles; emoji as icons; sparkle icons; "AI" badges as decoration
- Three-equal-column feature rows; centered hero with two pill buttons; pill badges everywhere
- Border radius above 4px on cards/buttons/inputs; fully rounded buttons
- Stagger fade-in on every list; count-up numbers; typing animations; scroll-jacking
- Lorem ipsum, "John Doe", stock people, illustrations, 3D shapes
- Marketing verbs and filler: unlock, elevate, seamless, supercharge, revolutionize, leverage, empower, next-gen, "AI-powered" as a headline

## Palette (light, warm, one accent)
- paper (page bg): #F5F2EB
- surface (panels): #FBF9F4
- ink (text): #1B221D
- ink-muted: #5F6A61
- rule (all borders/dividers, 1px): #D8D2C4
- accent (forest, links, primary buttons): #2F5D46, hover #244A38
- status only (never decorative): verified text #2F6B4A on #E4EEE7; needs review #9A6B12 on #F4E9CF; flagged #A63A2B on #F3DAD5
- No gradients. No box-shadows (use 1px rules). Focus ring: 2px solid accent, 2px offset.

## Type
- Headings and story body: "Newsreader" (serif)
- UI text: "IBM Plex Sans"
- IDs, coordinates, timestamps, metric labels, table headers: "IBM Plex Mono"
- Sizes: 12 / 14 / 16 / 20 / 28 / 40 / 64. Headline leading 1.05 to 1.15, letter-spacing -0.01em. Numbers use tabular-nums.
- Sentence case everywhere. Mono labels uppercase at 11 to 12px with letter-spacing 0.06em.

## Shape and layout
- Radius 2px on images, 4px on inputs/buttons/panels. Borders are 1px rule color. Sections separated by hairline rules with a small mono label (e.g. "01 / EVIDENCE").
- Top bar instead of sidebar: wordmark left ("ProofPoint" in Newsreader semibold), text nav (Overview, Upload, Gallery, Search, Compare, Map, Reports) with a 2px ink underline on the active item, project selector as a plain text dropdown on the right. On mobile the nav becomes a simple menu sheet.
- 12-column grid, max width 1360px, left-aligned text, asymmetric splits (7/5, 8/4). Generous whitespace. No centered layouts except empty states.
- Buttons: primary = solid accent, square-ish (4px), sentence case, no icon unless it carries meaning. Secondary = 1px ink border, transparent. Tertiary = underlined text link.
- Use shadcn/ui only as unstyled-behavior primitives (select, dialog, tabs, tooltip, toast). Restyle them to these tokens. Do not ship their default look.

## Signature elements
- Verification stamp: rectangular, 1px border in the status color, tinted background, mono uppercase 11px text like "VERIFIED 92/100". Not a pill, not rotated.
- Frame IDs: every asset shows a short mono ID like PP-0142 (use a per-project counter or the last 4 chars of _id).
- Contact-sheet gallery: tight 8px gutters, photo first, one mono caption line under it (ID, place, date), verification stamp in the caption row, not overlaid on the photo.
- Specimen sheet: asset metadata as a definition list with hairline rules between rows.
- Ledger: chain of custody and verification checks are plain tables (time / event / detail; check / result / detail), not fancy timelines.
- AI numbers always carry a small mono tag "AI ESTIMATE".

## Motion (functional only)
- Images fade in on load (200ms). Links underline on hover. Compare slider is draggable. Accordions open/close (150ms). Filter changes may animate layout with `motion` layout prop, nothing else.
- No page-load animations, no stagger, no parallax. Respect prefers-reduced-motion.

## Imagery
- Real photos only (the user's seeded field photos). If there are none yet, show a plain text empty state, never a stock or generated picture.
- Map tiles: CartoDB Positron (light). Markers: small squares colored by status. Popups: plain card, thumbnail + ID + caption.
- Charts: flat, 1.5px lines, no gradient fill, hairline grid, mono axis labels, direct labels instead of legends, one accent color. Use Bklit UI only if it installs cleanly and can be restyled flat; otherwise draw simple SVG/recharts charts.

## Copy rules
Plain, specific, numbers over adjectives. Examples:
- Good: "214 photos, 71% verified." / "No GPS in this file, so location could not be checked." / "Open the platform"
- Bad: "Unlock powerful insights" / "Seamlessly verify your media" / "Something went wrong :("

## Pages

**Landing (/)**: top bar with wordmark and one text link "Open the platform". Hero, left-aligned on 8 columns: headline (Newsreader 64px desktop / 40px mobile) "Proof for the work you did in the field." One plain sentence under it: "Upload field photos. ProofPoint checks where and when they were taken, catches duplicates, measures what changed and turns the verified set into a report." One primary button "Open the platform" and one text link "Read a sample report". On the right 4 columns or below on mobile: a real before/after compare slider using the top suggested pair from the seeded data (omit if no data). Section "How a photo becomes evidence": four numbered rows (mono numerals 01 to 04) in a two-column editorial layout with hairlines: Upload / Check / Compare / Publish, each with 1 to 2 plain sentences. Section "What we check": a ruled list (GPS present, location matches claim, timestamp, date matches claim, duplicate detection). Minimal footer: project name, hackathon name, repo link.

**Overview (/app)**: page title "Overview" and one-line summary. Four key figures as large Newsreader numbers separated by vertical hairlines (no cards): photos, verified percent, projects, reports, each with a mono label. Two columns below: left "Recent frames" contact-sheet strip (6 items), right "Suggested before/after pairs" as a ruled list with tiny thumbnails, days apart, distance. One flat chart "Uploads over time".

**Upload (/app/upload)**: 7/5 split. Left: dashed 1px rule dropzone with plain text, then selected files as a ruled table (name, size, remove). Right: form fields (project, location, capture date, optional "set location on map" with a small light map). On submit, replace the form with a ruled progress table: each file with stages Uploading, Reading metadata, Analyzing, Verifying, Done, and a final link "View in gallery".

**Gallery (/app/gallery)**: filter row of plain selects/inputs (project, location, status, dates) with a "Clear" text link; status counts as text ("142 verified, 51 needs review, 21 flagged"). Contact-sheet grid, 4 columns desktop, 2 mobile. Grid/Table toggle (table shows ID, thumb, caption, place, date, status).

**Asset (/app/assets/:id)**: 8/4 split. Left: the photo large, with a tab row "Original / Optimized / Watermarked". Right: specimen sheet definition list (ID, project, location, claimed date, captured date, GPS, camera, verification score), then AI section: caption, tags as plain text separated by commas, metrics as a definition list with AI ESTIMATE tags. Below full width: "Verification checks" ledger and "Chain of custody" ledger (Cloudinary public ID in mono with a copy link, transformations listed, reports that used this asset as links).

**Search (/app/search)**: large single-line input with a bottom rule (no box), placeholder rotates plainly through 3 example queries, results as contact-sheet grid with match percentage in mono under each item and a one-line "matched on: tags" hint.

**Compare (/app/compare)**: top "Suggested pairs" as a ruled list with tiny thumbnails; selecting one loads it. Main: compare slider with mono corner labels "BEFORE 12 MAR 2025" / "AFTER 9 JUN 2025". Right column or below: AI summary paragraph (with AI ESTIMATE), changes as a ruled list with arrows (text: improved / worsened / neutral in status colors), metric deltas as a small table. Button: "Add to report".

**Map (/app/map)**: full-width light map, square status markers, a plain time range slider under the map with a Play text button, and a ruled list of visible frames beside/below.

**Reports (/app/reports)**: table (thumbnail, title, project, date, verified %, link). "New report" opens a 3-step form: 1 project and frames (checkbox contact sheet, verified preselected), 2 before/after (prefilled from suggestion), 3 review and generate.

**Story (/story/:slug)**: light editorial page, no app chrome. Full-bleed hero photo, headline in Newsreader 48px, mono dateline (project, place, date range), then the narrative in 20px serif at 680px measure. "Key figures" as 3 to 4 large numbers with rules. Before/after slider. Evidence section: contact sheet with stamps. Appendix "How this was verified": ledger table of checks with counts. Share caption box with a "Copy" link. Print stylesheet: hide chrome, page breaks between sections, black on white.

## Audit checklist (run before finishing any page)
1. Squint test: does it look like a generic dashboard template? If yes, remove decoration and increase typographic contrast.
2. Any gradient, glow, blur, pill, circle-icon, or radius > 4px? Remove.
3. Any centered text block outside empty states? Left-align.
4. Any placeholder or marketing filler copy? Rewrite plainly.
5. Photos dominate; UI chrome recedes.
6. Works at 375px and 1440px; no horizontal scroll; focus states visible; images have alt text.
