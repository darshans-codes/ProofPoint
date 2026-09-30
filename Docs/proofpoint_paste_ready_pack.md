# PASTE-READY PACK (ProofPoint)

Reality check: no AI-generated code is guaranteed error-free. These prompts reduce errors by pinning exact commands and giving the agent the correct SDK code, so it doesn't guess. Test after every paste. If something breaks, use the debug prompt at the bottom.

---

## STEP 0: Do this yourself first (10 min, before any AI)

Requirements: Node 20+, a MongoDB Atlas free cluster (Network Access: allow 0.0.0.0/0), Cloudinary account, Gemini key from https://aistudio.google.com/apikey

```bash
mkdir proofpoint && cd proofpoint
git init
mkdir -p docs/refs server
npm create vite@latest client -- --template react
```

Create `docs/CONTEXT.md` and paste the content from **SECTION A** below into it.
Put 4 to 6 reference screenshots (Dribbble / Inspo AI) into `docs/refs/` named: `dashboard.png`, `gallery.png`, `map.png`, `compare.png`, `story.png`, `landing.png`.
Create `server/.env` with: MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, GEMINI_API_KEY, GEMINI_MODEL=gemini-2.5-flash, GEMINI_EMBED_MODEL=gemini-embedding-001, PORT=5000, CLIENT_URL=http://localhost:5173

(If Gemini says a model name is not found, open AI Studio and use a model name it lists; only the .env changes.)

---

## SECTION A: docs/CONTEXT.md (save this file; the agent reads it every task)

```
# ProofPoint: project context

## Product
AI media-intelligence platform for NGOs/sustainability orgs (Code Cubicle 6.0, Problem Statement 2, Cloudinary). Users upload field photos/videos. Stored on Cloudinary, analyzed by Gemini, VERIFIED (EXIF GPS/time + duplicate detection), organized by project/location/timeline, searchable by meaning, auto-paired as before/after, compared with measured change, and published as shareable Impact Story reports. Every asset is traceable (chain of custody).
Pitch: "Anyone can organize photos. We prove they're real, measure the change, and turn them into a story donors can trust."

## Stack (JavaScript only, ES modules, Node 20+)
server/: express, mongoose, multer (memory storage), cloudinary (v2), exifr, sharp, @google/genai, cors, dotenv, nodemon (dev)
client/: React (Vite), react-router-dom, axios, Tailwind CSS v4 (@tailwindcss/vite), shadcn/ui, motion (import from "motion/react"), lucide-react, react-leaflet + leaflet, react-compare-slider

## Repo layout
server/src/{index.js, config/, models/, routes/, controllers/, services/, utils/}, server/scripts/seed.js
client/src/{main.jsx, App.jsx, index.css, api/, components/, pages/, lib/}
docs/{CONTEXT.md, refs/}

## Data models
Project: { name, description, location, startDate }
Asset: { project(ref), projectName, locationName, capturedDate, kind("image"|"video"),
 cloudinary:{publicId,url,secureUrl,width,height,format,bytes,resourceType},
 transformations:{thumb,medium,watermarked,poster},
 ai:{caption,tags[],activity,metrics:{trees,waste,waterClarity,vegetationLevel,peopleCount},analyzedAt} | null,
 exif:{lat,lng,takenAt,camera,hasGps}, claimedGeo:{lat,lng},
 verification:{status:"verified"|"needs_review"|"flagged",score,checks:[{name,passed,detail}]},
 phash, duplicateOf(ref), embedding:[Number] (never returned by list APIs; use .select("-embedding")),
 provenance:[{event,at,detail}], usedInReports:[ref] }
Report: { title, slug(unique), project, assetIds[], heroAssetId, beforeAssetId, afterAssetId, headline, narrative, socialCaption, metricsSummary[], verifiedPercent, createdAt }

## API (prefix /api, JSON errors as { error: string })
GET /health
GET /projects, POST /projects
POST /assets (multipart: files[], projectId, locationName, capturedDate, lat?, lng?)
GET /assets?projectId&locationName&status&from&to&page&limit
GET /assets/:id, DELETE /assets/:id, POST /assets/:id/reanalyze
POST /search {query, limit}
GET /pairs?projectId=
POST /compare {beforeId, afterId}
POST /reports {title, projectId, assetIds[], beforeId?, afterId?}
GET /reports, GET /reports/:slug

## Design system
Mood: "field-evidence lab": dark, calm, trustworthy, nature accent. One wow element per page; everything else quiet.
Tokens: bg #0B0F0E, surface #121917, surface-2 #17201D, border #24312D, text #E8F0ED, muted #8FA39C, primary #34D399, accent #2DD4BF, warning #F59E0B, danger #F87171.
Fonts: Inter (UI), JetBrains Mono (coordinates, IDs, metadata). Radius 12px cards / 8px inputs. 8px spacing grid. Motion 150-400ms, respect prefers-reduced-motion.
Public Story page (/story/:slug): warm LIGHT editorial theme (off-white #FAF8F3, serif headline e.g. "Fraunces", large photos), print stylesheet for PDF.
AI numbers are always labeled "AI estimate".

## Design references (open these pages when a task names a component)
- Base components: shadcn/ui https://ui.shadcn.com
- Animated backgrounds, text effects, count-up, spotlight cards: https://reactbits.dev
- Bento grid, timeline, compare slider, effects: https://ui.aceternity.com
- Polished cards/inputs: https://kokonutui.com and https://skiper-ui.com
- Animation library: https://motion.dev
- Charts (shadcn registry): https://bklit.com/docs/installation  (install: npx shadcn@latest add @bklit/area-chart)
- Hero/section prompt ideas: https://motionsites.ai
- Layout references: images in docs/refs/ (named by page)

## Rules for the agent
- Do only the current task. Never rewrite unrelated files. Keep files small.
- async/await + asyncHandler + central error middleware. Validate inputs. No hardcoded secrets.
- Every UI data view has loading (skeleton), empty, and error states.
- After each task print: files changed, how to run, how to test.
```

---

## PASTE #1 (backend part 1): foundation, upload, Cloudinary, Gemini

```
Read docs/CONTEXT.md fully. Task: build the backend in server/ (Node 20, ES modules). Do only this task.

1. In server/: npm init -y, set "type":"module", scripts {"dev":"nodemon src/index.js","start":"node src/index.js"}. Install: express mongoose multer cloudinary cors dotenv exifr sharp @google/genai ; dev: nodemon. Create .env.example (same keys as .env, no values) and .gitignore (node_modules, .env).

2. src/index.js: dotenv/config, express.json, cors({origin: process.env.CLIENT_URL}), routes under /api, GET /api/health -> {ok:true}, 404 handler, central error middleware returning {error}. Connect to Mongo via config/db.js before listen.

3. Models exactly as in CONTEXT.md (Project, Asset, Report) with timestamps and indexes.

4. utils/asyncHandler.js, utils/cosine.js (cosine similarity).

5. services/cloudinaryService.js — use EXACTLY this pattern for upload:
   const result = await new Promise((resolve, reject) => {
     cloudinary.uploader.upload_stream({ folder, resource_type: "auto" }, (err, r) => err ? reject(err) : resolve(r));  // then call .end(buffer) on the returned stream
   });
   buildTransformations(publicId, projectName, resourceType) using cloudinary.url(publicId, {secure:true, resource_type, transformation:[...]}):
   - thumb: [{width:400,height:300,crop:"fill",gravity:"auto"},{quality:"auto",fetch_format:"auto"}]
   - medium: [{width:1000,crop:"limit"},{quality:"auto",fetch_format:"auto"}]
   - watermarked: medium + {overlay:{font_family:"Arial",font_size:28,text: sanitizedProjectName},color:"white",opacity:60,gravity:"south_east",x:20,y:20}. sanitizedProjectName must contain only letters, numbers and spaces (strip everything else) so the URL never breaks.
   - For videos: poster = cloudinary.url(publicId,{resource_type:"video",secure:true,format:"jpg",start_offset:"0"}); use poster as thumb/medium too.

6. services/gemini.js — use EXACTLY this API shape:
   import { GoogleGenAI } from "@google/genai";
   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
   analyzeImage(buffer, mimeType):
     const res = await ai.models.generateContent({ model: process.env.GEMINI_MODEL, contents:[{role:"user",parts:[{inlineData:{mimeType,data:buffer.toString("base64")}},{text:PROMPT}]}], config:{responseMimeType:"application/json",temperature:0.2} });
     return JSON.parse(res.text);
   PROMPT: "You analyze field photos for NGO/sustainability projects. Return ONLY JSON: {\"caption\":string (one factual sentence),\"tags\":string[] (6-10 lowercase),\"activity\":string,\"metrics\":{\"trees\":number,\"waste\":\"low\"|\"medium\"|\"high\",\"waterClarity\":\"good\"|\"fair\"|\"poor\"|\"n/a\",\"vegetationLevel\":\"low\"|\"medium\"|\"high\",\"peopleCount\":number}}. Be conservative; do not invent details."
   embedText(text):
     const r = await ai.models.embedContent({ model: process.env.GEMINI_EMBED_MODEL, contents: text, config:{outputDimensionality:768} });
     return r.embeddings[0].values;
   Both wrapped in try/catch with 3 attempts and exponential backoff (1s, 2s, 4s); on final failure return null (never throw). Use a simple queue so at most 2 Gemini calls run at once.

7. services/exifService.js: exifr.gps(buffer) for lat/lng and exifr.parse(buffer, ["DateTimeOriginal","Make","Model"]) for the rest, each in its own try/catch (missing EXIF is normal, not an error). Return {lat,lng,takenAt,camera,hasGps}.

8. Routes/controllers: projects (GET with asset counts via aggregate, POST). Assets:
   POST /api/assets: multer.memoryStorage, limits {files:15, fileSize:25*1024*1024}, accept image/* and video/mp4. For each file (max 3 at a time): read EXIF from the buffer FIRST, upload to Cloudinary, analyze with Gemini (images only; videos get ai:null), embed caption+tags+activity+locationName, build transformations, save Asset, add provenance events (uploaded, analyzed, transformed). If Gemini returned null, still save with ai:null and provenance event "analysis_failed". Return array of created assets (without embedding).
   GET /api/assets (filters + pagination, .select("-embedding")), GET /api/assets/:id (without embedding), DELETE /api/assets/:id (also cloudinary.uploader.destroy with the right resource_type), POST /api/assets/:id/reanalyze (re-fetch image from secureUrl via fetch, analyze, re-embed).

9. Do NOT implement verification, search, pairs, compare, reports yet.

Finish by printing run/test instructions and a curl command to upload 2 images.
```

**Test before continuing:** `cd server && npm run dev`, open http://localhost:5000/api/health, upload 2 photos via the curl or Postman, confirm the response has `cloudinary.secureUrl`, `ai.caption`, `exif`. Then `git add . && git commit -m "backend part 1"`.

---

## PASTE #2 (backend part 2): verification, search, pairs, compare, reports

```
Read docs/CONTEXT.md. Task: add these to the existing backend without changing part 1 behavior.

1. services/hashService.js: dHash(buffer): sharp(buffer).grayscale().resize(9,8,{fit:"fill"}).raw().toBuffer(); compare each pixel with its right neighbor per row -> 64 bits -> 16-char hex. hamming(a,b) on the bit strings.
2. services/verifyService.js: verifyAsset({exif, claimedGeo, capturedDate, phash, ai}, existingAssetsInProject) -> {status, score, checks[]}. Checks and weights: GPS present 20; location matches claim (haversine < 2km, only if claimedGeo exists, else pass with detail "no claimed location") 25; timestamp present 15; date within +/-2 days of capturedDate (if both exist) 20; not a duplicate (hamming <= 5 vs project assets; set duplicateOf) 15; AI analysis present 5. Missing data = failed check with clear detail text. status: score>=80 verified, 50-79 needs_review, <50 or duplicate flagged.
3. Hook into POST /assets after analysis: store phash + verification, add provenance "verified" with score. Accept optional lat/lng body fields as claimedGeo.
4. POST /api/search {query, limit=12}: embed query, cosine vs all assets that have embeddings, add +0.05 if query words appear in tags/caption, return assets (no embedding) with `score`.
5. GET /api/pairs?projectId=: among image assets with GPS in the project, group by haversine < 100m (fallback: same locationName); in each group sort by exif.takenAt or capturedDate; suggest {before: earliest, after: latest, distanceMeters, daysBetween, confidence} only if at least 2 assets and >= 1 day apart. 
6. POST /api/compare {beforeId, afterId}: fetch both images (secureUrl) as buffers, send both in ONE Gemini request (two inlineData parts + text), JSON: {summary (2-3 factual sentences), changes:[{aspect,before,after,direction:"improved"|"worsened"|"neutral"}], confidence:"low"|"medium"|"high"}. Also compute deltas from stored ai.metrics. Add provenance "compared" on both. If Gemini fails return 502 {error}.
7. Reports: POST /api/reports creates slug (8 random chars), asks Gemini for JSON {headline, narrative (150-200 words, factual, before/after arc), socialCaption (<280 chars, 2-3 hashtags)}, computes metricsSummary and verifiedPercent from assets, adds provenance "added_to_report" and usedInReports. GET /api/reports and GET /api/reports/:slug (populate assets, exclude embedding).
8. scripts/seed.js: reads images from server/seed-images/<projectFolder>/*.jpg, creates projects, calls the same service functions as the upload route (no HTTP), 1 file at a time. Add "seed" script.

Print curl examples to test each endpoint.
```

**Test:** upload the same photo twice (second must be `flagged`), search "trees", `/api/pairs`, `/api/compare`, `/api/reports`. Commit.

---

## PASTE #3 (frontend setup): do these commands yourself, then paste the prompt

```bash
cd client
npm i react-router-dom axios lucide-react motion react-leaflet leaflet react-compare-slider
npm i tailwindcss @tailwindcss/vite
npm i -D @types/node
```
(Vite's React template is React 19, which react-leaflet v5 needs.)

Replace `client/vite.config.js` with:
```js
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```
Create `client/jsconfig.json`:
```json
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } }, "include": ["src"] }
```
Replace `client/src/index.css` with `@import "tailwindcss";`
Create `client/.env` with `VITE_API_URL=http://localhost:5000/api`
Then run:
```bash
npx shadcn@latest init
npx shadcn@latest add button card input select tabs dialog tooltip badge skeleton sonner
```
(Accept defaults; if asked for a base color pick Neutral. If the init complains about the alias, recheck jsconfig.json and vite.config.js.)

```
Read docs/CONTEXT.md. Task: frontend foundation in client/ (React + Vite + Tailwind v4 + shadcn already installed). Do only this.

1. index.css: keep @import "tailwindcss" and shadcn variables; set the dark theme tokens from CONTEXT.md as CSS variables (background, card, border, primary, accent, muted, destructive) so shadcn components match. Import fonts Inter + JetBrains Mono (+ Fraunces for the story page) in index.html via Google Fonts. Force dark class on <html> for the app; the Story page uses its own light wrapper.
2. import "leaflet/dist/leaflet.css" once in main.jsx and fix the default Leaflet marker icon issue (set icon URLs explicitly).
3. src/api/client.js: axios instance (baseURL import.meta.env.VITE_API_URL) + helper functions for every endpoint in CONTEXT.md.
4. Layout: left sidebar (240px, collapses to a hamburger drawer on mobile) with nav: Dashboard(/app), Upload(/app/upload), Gallery(/app/gallery), Search(/app/search), Compare(/app/compare), Map(/app/map), Reports(/app/reports). Topbar with page title + global project selector (React context) + "Upload evidence" button. Routes with react-router-dom: "/" = placeholder Landing, "/app/*" inside the layout, "/story/:slug" without layout, and a 404 page.
5. Shared components: VerifyBadge (verified/needs review/flagged, tooltip shows score+checks), MetricChip, AssetCard (uses transformations.thumb, badge overlay, caption 2-line clamp, location/date in mono muted text), StatCard, EmptyState, Skeleton grid, AiEstimateTag.
6. Each page is a placeholder with title for now. The app must run with `npm run dev` with no console errors and look good at 375px and 1440px.
```

**Test, commit.** Then continue with the page prompts **7a to 7g and 8** from `antigravity_prompts.md` (each starting with the prefix below), then **U2, U3, U4, U5, U6** from `antigravity_upgrade_prompts.md`.

---

## Prefix to add at the top of every UI page prompt
```
Follow docs/CONTEXT.md. Layout reference: docs/refs/<name>.png (match layout/spacing/hierarchy, use our colors). Open <component page URL>, install the component with the command shown, and use it for <purpose>. Do not change data logic or other pages.
```

## Debug prompt
```
Error: <paste the full error and terminal output>. File/route: <where>. Find the root cause, fix it with the smallest possible change, and tell me in 2 lines what was wrong. Do not refactor or touch unrelated files.
```

## Order of work (with your time)
1. Step 0 (10 min) -> Paste #1 -> test -> Paste #2 -> test -> commit + push (teammates can now run the API)
2. Paste #3 (setup + foundation) -> pages 7a, 7b, 7c
3. Deploy the core. Hand off to teammates: seed photos, 7d to 7g, U2 to U6.
