# ProofPoint

> **Proof, not just photos.**

ProofPoint is an AI-powered impact and sustainability media platform for turning environmental field imagery into searchable, comparable, and provenance-aware evidence. Teams can ingest images and MP4 video, preserve the record around each asset, inspect metadata, identify potential duplicates, analyze images, connect observations over time, and publish evidence-grounded reports and public Impact Stories.

Built for **Code Cubicle 6.0**.

## Why ProofPoint?

Environmental work is often documented as a folder of photos: difficult to search, hard to compare, and easy to separate from the context that makes each frame meaningful. A photo may have a timestamp, coordinates, a source, or a useful before/after relationship—but those signals are rarely brought together in one workflow.

ProofPoint treats media as an evidence record. It keeps the original context visible, makes automated checks inspectable, separates derived observations from verification status, and gives reviewers a way to move from a field frame to a comparison, report, map, or shareable story.

```text
FIELD MEDIA
     ↓
INGEST
     ↓
METADATA + DUPLICATE CHECK
     ↓
AI ANALYSIS
     ↓
VERIFICATION
     ↓
SEARCH / COMPARE / MAP / REPORT / STORY
```

## What Makes ProofPoint Different?

1. **Evidence Verification** — Each asset receives checks for available GPS, claimed-location proximity, EXIF timestamps, date alignment, perceptual duplicates, and completed image analysis. The result is a score and one of `VERIFIED`, `NEEDS_REVIEW`, or `FLAGGED`.
2. **AI Understanding of Field Media** — Gemini vision analysis produces a conservative caption, tags, activity description, and a small structured metric set for images. MP4 video can be ingested, but automated visual breakdown is currently skipped for video assets.
3. **Natural-Language Evidence Search** — Search combines Gemini text embeddings and a keyword bonus over captions, tags, activity, location, and project text, then ranks matching evidence.
4. **Before / After Comparison** — Suggested pairs are grouped by project, nearby GPS coordinates or matching location names, and chronology. Gemini comparison plus stored metrics presents observed changes with a confidence label where available.
5. **Evidence → Impact Story** — Selected evidence can become a report with a factual narrative, metrics summary, provenance links, and a public `/story/:slug` page. Reports preserve limitations instead of turning incomplete evidence into certainty.

## Core Capabilities

| Capability | What the implementation does |
| --- | --- |
| Field media ingest | Authenticated multipart upload of images and MP4 video; up to 15 files per request and 25 MB per file |
| Provenance | Stores upload, analysis, verification, transformation, comparison, source-attribution, and report-link events |
| Metadata inspection | Extracts EXIF GPS, capture timestamp, and camera make/model when present |
| Duplicate detection | Calculates an image dHash and flags close perceptual matches within a project |
| Image intelligence | Gemini returns a factual caption, lowercase tags, activity, and metrics for trees, waste, water clarity, vegetation, and people count |
| Embeddings | Stores 768-dimensional text embeddings derived from evidence context for search |
| Verification | Computes a multi-check score and assigns `VERIFIED`, `NEEDS_REVIEW`, or `FLAGGED` |
| Search | Ranks evidence with cosine similarity plus matching terms from indexed evidence text |
| Pairing and comparison | Suggests chronological, spatially related image pairs and compares stored metrics and image observations |
| Spatial context | Displays evidence with GPS data on the map view |
| Reporting | Creates evidence-linked reports with verified percentage, metric summaries, and a public slug |
| Impact Stories | Publishes report-backed, shareable public pages with attribution and limitations |

## How It Works

```text
Capture → Ingest → Verify → Analyze → Search → Pair → Compare → Report → Publish
```

- **Capture** — Bring field images or supported MP4 video into a project with a location and capture date.
- **Ingest** — The server stores media, creates responsive derivatives, records metadata, and appends a provenance event.
- **Verify** — EXIF, location claims, dates, dHash, and analysis availability contribute to the evidence score.
- **Analyze** — Images are analyzed with Gemini when configured; video analysis is skipped. Offline fallbacks keep the demo usable.
- **Search** — Ask for evidence in natural language and receive ranked assets with matched terms or semantic context.
- **Pair** — The pairing service groups images by project and spatial/location context, then orders them by time.
- **Compare** — Review image observations and metric deltas as analysis, not absolute ground truth.
- **Report** — Select evidence and optional before/after assets to create a report.
- **Publish** — Open the report through its public Impact Story slug.

## Product Flow

```text
Landing
  → Login
  → Overview
  → Evidence / Gallery
  → Search
  → Compare
  → Reports
  → Public Story
```

Implemented application routes also include `/app/upload`, `/app/assets/:id`, `/app/map`, and `/story/:slug`.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│ React + Vite client                                                 │
│ React Router · Axios · Tailwind · Motion · Leaflet · React Three Fiber│
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP + credentials
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Node.js + Express API                                               │
│ auth · projects · assets · search · pairs · compare · reports        │
│ EXIF / dHash verification · upload processing · provenance           │
└───────────────┬───────────────────────┬───────────────────┬─────────┘
                │                       │                   │
                ▼                       ▼                   ▼
        MongoDB / Mongoose       Cloudinary             Gemini API
        projects, assets,        media + derivatives    vision, embeddings,
        users, reports           (local fallback)       comparison, narrative
```

## Technology Stack

### Frontend

- React 19 with Vite
- React Router
- Axios with credentialed requests
- Tailwind CSS, Motion, Lucide React
- Leaflet / React Leaflet for maps
- React Three Fiber / Drei / Three.js for 3D presentation
- `react-compare-slider` for before/after viewing

### Backend

- Node.js 20+
- Express
- Mongoose
- Multer in-memory upload handling
- Sharp and Exifr for image processing and metadata extraction

### AI / Intelligence

- `@google/genai`
- Gemini vision analysis with `GEMINI_MODEL`
- Gemini embeddings with `GEMINI_EMBED_MODEL`
- Cosine similarity search with keyword matching
- dHash and Hamming distance for perceptual duplicate checks

### Storage / Infrastructure

- MongoDB for projects, assets, users, reports, verification, embeddings, and provenance
- Cloudinary for uploaded media and responsive/watermarked derivatives
- `mongodb-memory-server` when a configured MongoDB URI is unavailable
- Local data-URI media fallback when Cloudinary credentials are unavailable

### Authentication

- Google Identity Services in the browser
- `google-auth-library` for server-side ID-token verification
- JWT-backed, HTTP-only `proofpoint_session` cookies
- Server-controlled roles and protected application mutations

## Project Structure

```text
.
├── client/
│   ├── src/
│   │   ├── api/          # Axios API client
│   │   ├── components/   # Layout, navigation, protected route
│   │   ├── context/      # Auth and project state
│   │   └── pages/        # Landing, app views, reports, public Story
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/       # MongoDB connection and auto-seed
│   │   ├── controllers/  # API behavior
│   │   ├── middleware/   # Auth and security middleware
│   │   ├── models/       # Project, Asset, User, Report schemas
│   │   ├── routes/       # Express route modules
│   │   ├── services/     # Gemini, Cloudinary, EXIF, hashing, verification
│   │   └── utils/
│   ├── scripts/seed.js   # Curated public-source seed command
│   ├── seed-images/
│   ├── .env.example
│   └── package.json
├── package.json          # Root install, dev, build, and lint scripts
└── package-lock.json
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- MongoDB 7+ locally or a reachable MongoDB deployment for persistent storage
- Cloudinary credentials for production media storage
- Gemini API key for live image analysis, embeddings, comparisons, and AI narratives
- Google OAuth 2.0 Web Application client ID for Google sign-in

### Clone and install

```bash
git clone <repository-url>
cd ProofPoint
npm run install:all
```

Windows PowerShell:

```powershell
git clone <repository-url>
Set-Location ProofPoint
npm run install:all
```

### Environment setup

macOS / Linux:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Fill the placeholders described below, then start both applications:

```bash
npm run dev
```

The API listens on port `5001` by default. Vite normally serves the client on port `5173` (or its next available port).

Run them separately when needed:

```bash
npm run server
npm run client
```

## Environment Variables

The templates are [server/.env.example](server/.env.example) and [client/.env.example](client/.env.example).

### Server

| Variable | Purpose |
| --- | --- |
| `PORT` | Express API port |
| `CLIENT_URL` | Allowed frontend origin |
| `MONGO_URI` | MongoDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth audience used by the server |
| `JWT_SECRET` | Secret used to sign session JWTs |
| `COOKIE_SAMESITE` | Session cookie policy, such as `Lax` or production `None` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Gemini vision/narrative model override |
| `GEMINI_EMBED_MODEL` | Gemini embedding model override |

### Client

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL, including `/api` |
| `VITE_GOOGLE_CLIENT_ID` | Browser Google client ID; match the server audience |

`.env` files must never be committed. Keep `.env.example` limited to placeholders, and store secrets only in local or production environment configuration. Never put Gemini, Cloudinary, JWT, MongoDB, or OAuth secrets in the client environment.

## Authentication

The login page uses **Google Identity Services**. The browser sends the Google ID token to `POST /api/auth/google`; the server verifies its signature, audience, issuer, expiry, subject, and verified email before creating or updating the user.

ProofPoint then issues a JWT-backed, HTTP-only session cookie. `/app/*` is protected by the client route guard and protected server operations require that session. Roles are assigned and read on the server rather than trusted from browser input. A guest/demo sign-in endpoint is also available for local demonstration.

## AI Pipeline

Gemini is used in bounded, evidence-grounded steps:

- **Image analysis** — Returns a factual one-sentence caption, 6–10 lowercase tags, an activity description, and structured observations for trees, waste, water clarity, vegetation, and people count.
- **Embeddings** — Builds a 768-dimensional vector from the caption, tags, activity, location, and project context.
- **Semantic search** — Embeds the query, calculates cosine similarity against stored vectors, and adds a small keyword-match bonus.
- **Comparison** — Sends paired image media to Gemini for a summary, observed changes, and `low` / `medium` / `high` confidence, then combines that with stored metric deltas.
- **Report narrative** — Generates a headline, evidence-grounded narrative, and social caption when live Gemini is available. Public-source reports use a special attribution-preserving narrative path.

If Gemini is unavailable, the server returns a visible unavailable state where appropriate and has deterministic local fallbacks for the demo. These fallbacks are not a substitute for live model analysis.

## Verification & Provenance

Verification is an auditable set of signals—not a claim that AI can prove a real-world event with certainty.

- **EXIF** — Reads GPS coordinates, capture timestamp, and camera information when embedded in the file.
- **GPS** — Compares EXIF coordinates with a supplied claimed location using a 2 km threshold.
- **Timestamp** — Checks for an internal capture time and compares it with the supplied capture date within a 2-day threshold.
- **Duplicate detection** — Uses image dHash and a Hamming-distance threshold of 5 within the project.
- **Evidence score** — Weights available GPS, location/date checks, uniqueness, and completed AI analysis.
- **Verification state** — Assigns `VERIFIED`, `NEEDS_REVIEW`, or `FLAGGED`.
- **Provenance** — Keeps a timeline of ingestion and derived actions attached to the asset.

The UI and data model distinguish:

- **Automatically derived evidence** — EXIF fields, perceptual hashes, stored scores, embeddings, and model observations.
- **Evidence requiring review** — Missing metadata, failed checks, duplicate matches, unavailable analysis, or lower scores remain reviewable rather than silently passing.
- **Public-source demo evidence** — Seed records retain source credit, license, URL, context, and a `public_source_demo` label.

## Semantic Search

Try queries such as:

- “cleared plastic debris near river”
- “newly planted trees”
- “vegetation after restoration”

The server embeds the query, compares it with stored evidence embeddings, adds keyword matches from captions/tags/activity/location/project text, and returns the highest-scoring assets. Search results are relevance signals for investigation, not a replacement for reviewing the source frame and its provenance.

## Before / After Comparison

ProofPoint suggests image pairs that belong to the same project, share a GPS cluster within 100 metres or the same location name, and are at least one day apart. The earliest and latest images in a cluster become the suggested before/after pair.

The Compare view combines Gemini's paired-image observations with stored AI metric values such as tree count, waste, water clarity, and vegetation level. Results should be treated as evidence and analysis to review—not absolute ground truth or causal proof.

## Demo Dataset

The repository includes a curated **Watts Branch Stream Restoration — Public Source Demo** under `server/seed-images/watts-branch-demo`. The records are attributed to Mark Secrist / U.S. Fish & Wildlife Service and preserve their public-source URLs, dates, context, and license metadata.

> **DEMO — EVIDENCE REQUIRES REVIEW**
>
> **PUBLIC-SOURCE DATA**
>
> **NOT ORIGINAL NGO FIELD EVIDENCE**

This dataset is demonstration material. It was not collected by ProofPoint, and it must not be presented as original ProofPoint or NGO field evidence. Seed it with:

```bash
npm run seed --prefix server
```

The server also auto-seeds its demo workspace when an empty database is initialized.

## Judge Demo Flow

1. Open ProofPoint.
2. Authenticate with Google or the local demo sign-in.
3. Show the evidence overview and Watts Branch records.
4. Inspect metadata, verification checks, and provenance.
5. Search naturally for an environmental observation.
6. Open the suggested before/after pair.
7. Run the comparison.
8. Generate a report.
9. Open its public Impact Story and keep the demo/source labels visible.

## Security

The current server implementation includes:

- Helmet security headers
- Explicit CORS allow-list with credentialed requests
- Trusted-origin checks for state-changing methods
- Global API rate limiting and a tighter limiter for expensive operations
- HTTP-only session cookies, with production `Secure` behavior
- Server-side Google token verification and role assignment
- Mongoose ObjectId validation on relevant routes
- Protected upload, delete, re-analysis, comparison, search, and report mutations
- JSON and URL-encoded body limits of 20 MB
- Upload filtering for images and MP4 video, with a 15-file and 25 MB-per-file limit

The demo workspace is intentionally single-tenant: resources do not currently carry an owner field, so authenticated users share the configured evidence workspace. Do not treat it as tenant isolation.

## Local Demo / Fallback

ProofPoint can remain demonstrable without every production service configured:

- Without a usable `MONGO_URI`, the server starts a local `mongodb-memory-server` instance.
- Without Cloudinary credentials, uploaded media is represented with local data-URI storage and local transformation references.
- Without a Gemini key, deterministic analysis, embeddings, comparison, and narrative fallbacks keep the local demo path usable.

Local fallback media is for demonstration only. It is not equivalent to production Cloudinary storage, delivery, or durability.

## Deployment

A production deployment requires:

1. A reachable MongoDB deployment configured with `MONGO_URI`.
2. Cloudinary cloud name, API key, and API secret for media storage and derivatives.
3. A Gemini API key plus appropriate model configuration.
4. A Google OAuth Web Application client ID configured for the exact frontend origin.
5. Server variables set in the backend environment and `VITE_API_URL` / `VITE_GOOGLE_CLIENT_ID` set at client build time.
6. `CLIENT_URL` set to the exact production frontend origin.
7. HTTPS, especially when using `COOKIE_SAMESITE=None` and secure cross-site cookies.
8. A production check of `/api/health`, login, logout, upload, and a protected request.

ProofPoint does not prescribe a hosting provider; deploy the client and server wherever your operational environment supports these requirements.

## Testing / QA

The repository exposes these checks:

```bash
npm run build
npm run lint
```

For a server syntax check:

```bash
node --check server/src/index.js
node --check server/src/controllers/authController.js
```

On Windows PowerShell, the same checks can be run without changing the working directory:

```powershell
npm run build
npm run lint
node --check server\src\index.js
node --check server\src\controllers\authController.js
```

The frontend build includes mapping and 3D dependencies, so a bundle-size warning may be reported without failing the build.

## Design Philosophy

ProofPoint is designed to feel like an **evidence workstation**, a **field report system**, and a **documentary environmental-intelligence platform**—not a generic AI dashboard.

Its visual and interaction language prioritizes documentary imagery, evidence hierarchy, provenance, spatial context, timelines, restrained motion, readable data, and transparent verification states. The interface should make a reviewer more curious about the source record, not less.

# 🏆 Built for Code Cubicle 6.0

## ProofPoint

**AI-powered Impact & Sustainability Media Platform**

> Anyone can organize photos.
>
> ProofPoint helps prove what they show.
