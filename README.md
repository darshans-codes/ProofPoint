# ProofPoint

ProofPoint is an environmental evidence platform for ingesting field imagery, checking metadata and duplicates, pairing before/after records, and publishing transparent public Stories. Public-source demonstration records are explicitly labelled and are not treated as ProofPoint-collected field evidence.

## Architecture

- `client/`: React, Vite, React Router, Motion, React Three Fiber, Leaflet
- `server/`: Node.js, Express, MongoDB/Mongoose, Cloudinary, Google Identity Services verification, Gemini
- MongoDB stores projects, assets, users, reports, verification results, and provenance.
- Cloudinary stores uploaded media and responsive derivatives. Gemini is used for bounded visual analysis, embeddings, comparisons, and narrative generation.

## Prerequisites

- Node.js 20 or newer (Node 24 is supported)
- npm
- MongoDB 7+ locally or a reachable MongoDB deployment
- Cloudinary account for real uploads
- Gemini API key for AI analysis (respect the provider's rate limits)
- Google OAuth 2.0 Web Application client ID for login

## Setup

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
npm run install:all
```

Set these variables:

### Server

`PORT`, `CLIENT_URL`, `MONGO_URI`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `COOKIE_SAMESITE`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_EMBED_MODEL`.

Use a long random `JWT_SECRET`. For a genuinely cross-site HTTPS deployment, use `COOKIE_SAMESITE=None`; this requires production HTTPS and automatically enables `Secure`.

### Client

`VITE_API_URL` must point to the deployed API in production, and `VITE_GOOGLE_CLIENT_ID` must match the server Google client ID. Never place API keys or Cloudinary secrets in the client environment.

## Google OAuth

Create a Google OAuth 2.0 **Web Application** client ID. Add these local JavaScript origins:

- `http://localhost:5173`
- `http://localhost:5174`

Add the exact deployed frontend origin before production use. The browser sends a Google ID token to `POST /api/auth/google`; the server verifies the signature, audience, issuer, expiry, and verified email, then issues an HTTP-only ProofPoint session cookie. Roles are server-controlled.

## Local development

```powershell
npm run dev
```

Or separately:

```powershell
npm run server
npm run client
```

The frontend runs on Vite's selected local port, normally `5173`; the API runs on `http://localhost:5000`.

## Demo data

The curated Watts Branch public-source demo is stored under `server/seed-images/watts-branch-demo`. Seeding is idempotent for the approved local public-source records and does not clear the database:

```powershell
npm run seed --prefix server
```

Do not use stock or generated images as environmental evidence. The Watts Branch records retain their source attribution, provenance, and truthful `NEEDS_REVIEW` verification state.

## Authentication and routes

Public routes are `/` and `/story/:slug`. `/login` uses Google Identity Services. `/app/*` requires a valid ProofPoint session. Authenticated users can upload, search, compare, and create reports. Public Stories remain shareable. API reads required by public landing/Stories remain public; state-changing APIs require authentication and trusted origins.

## Build, lint, and QA

```powershell
npm run build
npm run lint
Set-Location server
node --check src/index.js
node --check src/controllers/authController.js
```

The frontend bundle includes the 3D and mapping dependencies and can produce a large-but-non-blocking bundle warning. Avoid repeated Gemini calls during QA; comparisons and analysis are queued, paced, cached, and coalesced.

## Deployment

1. Provision MongoDB, Cloudinary, Gemini, and Google OAuth.
2. Deploy `server/` and set server environment variables.
3. Deploy `client/` with `VITE_API_URL` pointing to the HTTPS API.
4. Set `CLIENT_URL` to the exact frontend origin.
5. Use HTTPS, `NODE_ENV=production`, and `COOKIE_SAMESITE=None` when frontend and API are on different sites.
6. Add the exact frontend origin to Google OAuth.
7. Verify `/api/health`, login, logout, and a protected API call before demo use.

## Security notes

Helmet headers, explicit CORS origins, trusted-origin checks for state changes, bounded JSON/upload limits, Google-auth rate limiting, HTTP-only cookies, server-side role assignment, and malformed ObjectId validation are enabled. Do not log credentials or tokens. The current demo is intentionally single-tenant: authenticated users share the configured evidence workspace because resources do not yet carry an owner field. Do not present it as multi-tenant isolation.

## Judge/demo flow

Open the landing page, sign in with Google, review Overview and the Watts Branch public-source pair, inspect Compare and the evidence ledger, browse Gallery/Map, and open the generated public Story. Keep the public-source attribution and `DEMO — EVIDENCE REQUIRES REVIEW` status visible. If Gemini is rate-limited, the UI must show its unavailable state rather than fabricate analysis.
