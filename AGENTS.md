# AGENTS.md

## Cursor Cloud specific instructions

FestRecipe is a **client-only SPA** (Vite + React 19 + TypeScript + Tailwind v4). There is no
backend server: all festival/artist/playlist data is served as static JSON from `public/data/`
and fetched at runtime. See `README.md` and `docs/PRODUCT.md` for the product overview, and
`package.json` `scripts` for the canonical dev/lint/build/preview commands.

### Testing / artifacts
- This is a mobile-first product. **Always capture screenshots and screen recordings in a mobile
  viewport** (e.g. a phone-sized/emulated device such as ~390×844, DevTools device toolbar, or a
  narrow browser window), not a wide desktop layout.

### Running the app
- Node 22 is preinstalled and works with Vite 8. Dependencies are installed by the update script.
- Dev server: `npm run dev` → serves at `http://localhost:5173`. This is the only service needed
  to develop or test the product end to end.
- Preview a production build: `npm run build` then `npm run preview`.

### Data loading architecture (non-obvious)
- SSOT for all data is `public/data/**` (collector output + statically served). But the small
  initial-critical data — `festivals/index.json`, `festivals/*.json`, `artists.json`,
  `playlists/index.json` (~50KB total) — is **bundled at build time** via `src/data/staticData.ts`
  (`import.meta.glob` + JSON imports from `public/data`), so Home and the festival page render
  synchronously with no fetch/spinner/waterfall. Read this data through `src/data/staticData.ts`
  (or `FestivalService.*Sync()` / `useMobileFestival`), not `fetch`.
- Only the large per-artist playlists (`playlists/{artistId}.json`, ~700KB total) stay lazily
  `fetch`-ed on demand (`loadJson.fetchPlaylistJson` / `FestivalService.getPlaylistForArtist`).
- When adding a festival, update `festivals/index.json` + the festival JSON as before; the bundler
  picks them up on rebuild (Vite HMR in dev). No runtime fetch wiring needed.

### Secrets / env (not required)
- The app runs and is fully functional with **no secrets**. `.env.example` documents optional
  `VITE_FIREBASE_*` (GA4 analytics only) and `YT_API_KEY` (collector only) variables.
- Missing `VITE_FIREBASE_*` does **not** crash the app — `src/lib/firebase.ts` initializes
  analytics lazily/defensively and no-ops when `VITE_FIREBASE_MEASUREMENT_ID` is unset. Do not
  treat missing Firebase env as a blocker.

### Lint / build gotchas (non-obvious)
- `npm run lint` currently reports **pre-existing** errors on a clean checkout — mostly in the
  dormant `src/services/setlistCollector*.ts` CLI scripts and `src/mobile/ui/MobileWallpaperStudio.tsx`.
  A non-zero `eslint` exit on the untouched tree is expected and is not a setup problem.
- `npm run build` = `tsc -b && vite build && node scripts/generate-sitemap.js`. The final step
  writes tracked `public/sitemap.xml` (it regenerates identically today, so the working tree stays
  clean). `dist/` is gitignored.

### Verifying the "내 라인업" (my lineup) feature
- The user's saved lineup is persisted to `localStorage` under key `festrecipe.myLineup.v1`
  (per-festival `artistIds[]`), with no backend. To verify saves objectively, read that key in the
  DevTools console before/after clicking an artist's ☆ star (e.g. it goes from `null` to
  `{"artistIds":["<id>"]}`).

### Optional pieces (not needed to run the app)
- `collector/` is a Python pipeline (`ytmusicapi`) that regenerates the `public/data/` JSON. Its
  output is already committed, so it is not required to run/test the app. Setup: `pip install -r
  collector/requirements.txt` (see `collector/README.md`).
- `src/services/setlistCollector*.ts` are dormant standalone CLI scripts (need `yt-dlp` + Firestore
  creds) and are not imported by the web app.
- Firebase Hosting + Firestore are deploy/CI-only (`.github/workflows/firebase-hosting-*.yml`).
