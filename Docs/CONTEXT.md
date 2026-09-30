# ProofPoint: Project Context & Architecture

## Product
ProofPoint is an AI-powered media-intelligence, verification, and impact platform for NGOs and sustainability organizations (Code Cubicle 6.0, Problem Statement 2: AI-Powered Impact & Sustainability Media Platform using Cloudinary).
Core idea: "Anyone can organize photos. We prove they're real, measure the change, and turn it into a story donors can trust."

Field teams upload photos/videos. ProofPoint:
1. Stores media securely with Cloudinary with optimized responsive & watermarked transformations.
2. Extracts EXIF metadata (GPS lat/lng, camera model, exact timestamp).
3. Evaluates claimed vs. observed metadata, verifies timestamps and location (<2km haversine).
4. Computes perceptual image hash (dHash 64-bit) to flag duplicate/recycled evidence.
5. Analyzes imagery with Google Gemini for factual captions, tags, activity, and structured estimates (trees, waste, water clarity, vegetation, people).
6. Computes a multi-factor Verification Score (0-100) and status: VERIFIED, NEEDS REVIEW, FLAGGED with an audit ledger of checks.
7. Produces vector embeddings for semantic natural language search ("riverbank after cleanup", "flooded road near school").
8. Automatically clusters and suggests Before/After pairs based on GPS spatial proximity (<100m) and temporal baseline.
9. Compares before/after pairs with Gemini vision and computes metric deltas with direction ("improved", "worsened", "neutral").
10. Generates publication-ready, factual Impact Stories and Reports with public URLs, interactive comparison sliders, interactive maps with timeline scrubbing, and complete chain-of-custody provenance.

## Visual & Aesthetic Direction
- Identity: FIELD REPORT + DOCUMENTARY PHOTOGRAPHY + ENVIRONMENTAL RESEARCH + GEOSPATIAL EVIDENCE + $10,000 DIGITAL INTERACTION.
- Color Palette:
  - Paper (page bg): `#F5F2EB`
  - Surface (panels/cards): `#FBF9F4`
  - Ink (text/headings): `#1B221D`
  - Muted Ink (subtext/meta): `#5F6A61`
  - Rule (hairline dividers/borders): `#D8D2C4`
  - Forest Accent: `#2F5D46` (hover: `#244A38`)
  - Status Verified: text `#2F6B4A`, bg `#E4EEE7`, border `#2F6B4A`
  - Status Needs Review: text `#9A6B12`, bg `#F4E9CF`, border `#9A6B12`
  - Status Flagged: text `#A63A2B`, bg `#F3DAD5`, border `#A63A2B`
- Typography:
  - Editorial Headlines & Story Prose: `Newsreader` (serif)
  - UI Text, Labels & Form Elements: `IBM Plex Sans`
  - Technical Identifiers, GPS, Timestamps, Ledger headers: `IBM Plex Mono`
- Motion & 3D:
  - Three.js / React Three Fiber geospatial environmental visualization in the hero.
  - Motion (motion/react) for smooth layout transitions, scroll-driven storytelling, tactile comparison sliders, and refined micro-interactions.
  - No neon, no purple AI gradients, no glowing orbs, no generic SaaS templates.

## Tech Stack
- Server: Node.js 20+, Express, Mongoose, Multer (memoryStorage), Cloudinary (v2), exifr, sharp, @google/genai, cors, dotenv.
- Client: React 19 (Vite), Tailwind CSS v4, shadcn/ui primitives, motion/react, react-router-dom, axios, lucide-react, leaflet & react-leaflet, react-compare-slider, three, @react-three/fiber, @react-three/drei.

## Repository Layout
- `server/`
  - `src/index.js` (Express entry point)
  - `src/config/db.js` (MongoDB connection)
  - `src/models/` (Project.js, Asset.js, Report.js)
  - `src/services/` (cloudinaryService.js, gemini.js, exifService.js, hashService.js, verifyService.js)
  - `src/routes/` (projectRoutes.js, assetRoutes.js, searchRoutes.js, pairRoutes.js, compareRoutes.js, reportRoutes.js)
  - `src/controllers/` (projectController.js, assetController.js, searchController.js, pairController.js, compareController.js, reportController.js)
  - `src/utils/` (asyncHandler.js, cosine.js, haversine.js)
  - `scripts/seed.js`
- `client/`
  - `src/` (main.jsx, App.jsx, index.css, api/client.js, components/, pages/, context/)
- `docs/` (CONTEXT.md, UI_SYSTEM.md, refs/)

## Data Models
1. **Project**:
   - `name`: String, required
   - `description`: String
   - `location`: String, required
   - `startDate`: Date
   - `createdAt`, `updatedAt`

2. **Asset**:
   - `project`: ObjectId (ref 'Project'), required
   - `projectName`: String
   - `locationName`: String, required
   - `capturedDate`: Date, required
   - `kind`: "image" | "video", default "image"
   - `cloudinary`: { publicId, url, secureUrl, width, height, format, bytes, resourceType }
   - `transformations`: { thumb, medium, watermarked, poster }
   - `ai`: { caption, tags: [String], activity, metrics: { trees, waste, waterClarity, vegetationLevel, peopleCount }, analyzedAt } | null
   - `exif`: { lat: Number, lng: Number, takenAt: Date, camera: String, hasGps: Boolean }
   - `claimedGeo`: { lat: Number, lng: Number }
   - `verification`: {
       status: "verified" | "needs_review" | "flagged",
       score: Number,
       checks: [{ name: String, passed: Boolean, detail: String }]
     }
   - `phash`: String (16-char hex)
   - `duplicateOf`: ObjectId (ref 'Asset')
   - `embedding`: [Number] (indexed; excluded in list projections via .select("-embedding"))
   - `provenance`: [{ event: String, at: Date, detail: String }]
   - `usedInReports`: [ObjectId (ref 'Report')]

3. **Report**:
   - `title`: String, required
   - `slug`: String, unique, required
   - `project`: ObjectId (ref 'Project'), required
   - `assetIds`: [ObjectId (ref 'Asset')]
   - `heroAssetId`: ObjectId (ref 'Asset')
   - `beforeAssetId`: ObjectId (ref 'Asset')
   - `afterAssetId`: ObjectId (ref 'Asset')
   - `headline`: String
   - `narrative`: String (150-250 words, factual arc)
   - `socialCaption`: String (<280 chars, hashtags)
   - `metricsSummary`: [{ label: String, before: String|Number, after: String|Number, change: String, direction: String }]
   - `verifiedPercent`: Number
   - `createdAt`, `updatedAt`

## API Endpoints
- `GET /api/health` -> `{ ok: true, timestamp, env: { mongo: boolean, cloudinary: boolean, gemini: boolean } }`
- `GET /api/projects`, `POST /api/projects`
- `POST /api/assets` (multipart: `files[]`, `projectId`, `locationName`, `capturedDate`, optional `lat`, `lng`)
- `GET /api/assets?projectId=&locationName=&status=&from=&to=&page=&limit=`
- `GET /api/assets/:id`
- `DELETE /api/assets/:id`
- `POST /api/assets/:id/reanalyze`
- `POST /api/search` (`{ query, limit }`)
- `GET /api/pairs?projectId=`
- `POST /api/compare` (`{ beforeId, afterId }`)
- `POST /api/reports` (`{ title, projectId, assetIds[], beforeId?, afterId? }`)
- `GET /api/reports`, `GET /api/reports/:slug`

## Design & Verification Principles
- Always label AI observations as `AI ESTIMATE`.
- Transparent verification: Every check detail is published in the audit ledger.
- Real public domain/curated seed data with honest metadata and attribution; no falsified GPS or forged evidence.
- Graceful offline/demo fallback mode if Gemini or Cloudinary keys are not yet configured.
