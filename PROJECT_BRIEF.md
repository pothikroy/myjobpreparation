# Project brief — My Job Preparation website

Paste this whole message at the start of a new chat (Claude Sonnet or better, with
the bash/file tools enabled) to resume work on my study site.

## What this is
A personal, password-gated study hub hosted on GitHub Pages. It links out to a
growing set of self-contained interactive HTML study tools (BCS question banks,
vocabulary apps, etc.), gated behind Google Sign-In, with progress synced to the
cloud so it follows me across devices.

## Live site & repo
- Live: https://pothikroy.github.io/myjobpreparation/
- Repo: https://github.com/pothikroy/myjobpreparation (GitHub Pages, branch `main`, root)
- Backend: Firebase project `myjobpreparation-d563b` — Google Sign-In (Authentication)
  + Firestore, free tier.
- Owner login: donyroy9@gmail.com — auto-approved. Anyone else who signs in goes
  into a pending queue I approve/deny from the in-site sidebar admin panel.

## How the site is put together
- `/index.html` — homepage. All navigation is data-driven from a `CATALOG`
  JS array near the bottom of the file: categories (each with an `accent`
  hex colour) → subcategories → items (`{id, bn, en, path}`). **To add a new
  subject, add one entry here — nothing else in index.html needs to change.**
- `/firebase-config.js` — shared Firebase project keys + `OWNER_EMAIL`. Loaded
  by every page.
- `/auth-gate.js` — shared login gate, approval-request flow, and cross-device
  progress sync. Loaded by every page. Also builds the right-edge sidebar tab
  (account info, sign-out, owner-only admin panel) — deliberately NOT a floating
  badge, so it doesn't sit on top of content while studying. Icons in it are
  inline SVG, never Unicode glyphs (a Unicode power icon once rendered broken
  on mobile — don't reintroduce that).
- Subject tools live under folders like `/bcs/question-bank/*.html` and
  `/bank/vocabulary/*.html`.

## The pattern for adding a new subject HTML file
1. Check how the uploaded file stores its own progress: grep it for
   `localStorage`, `LS_KEY` / `STORE_KEY` / `STORAGE_KEY` / `STORAGE_PREFIX`,
   or `indexedDB.open(...)`. Note the exact key name(s), or for IndexedDB the
   DB name/version/object store names.
2. Inject into `<head>`: the three Firebase SDK `<script>` tags, then
   `firebase-config.js`, then a `window.AG_PAGE = {...}` config object with
   `id`, `title`, and a `storage` spec matching what you found in step 1
   (`{type:'keys', keys:[...]}`, `{type:'prefix', prefix:'...'}`, or
   `{type:'indexeddb', dbName, version, stores:[...]}`), then `auth-gate.js`.
3. Inject `<div id="ag-overlay"></div>` right after the opening `<body>` tag.
4. Script `src` paths are relative back to the repo root — match the file's
   folder depth (e.g. two levels deep needs `../../firebase-config.js`).
5. Place the file in the right folder, add one entry to `CATALOG` in
   `index.html` pointing at it.
6. Bump the `?v=N` cache-busting query string on `firebase-config.js` and
   `auth-gate.js` script tags site-wide (every page references them) whenever
   either shared file changes, so browsers don't serve a stale cached copy.

## Deploying changes
I don't have git set up locally — Claude does this via its sandbox. Each time:
1. Generate a fresh **fine-grained GitHub Personal Access Token**
   (github.com → Settings → Developer settings → Fine-grained tokens),
   scoped to the `myjobpreparation` repo only, with **Contents: Read and write**.
2. Paste the repo URL and the token into the chat.
3. Claude commits and pushes the changes, then I revoke/regenerate the token
   once it confirms the push succeeded (tokens are never reused across sessions
   or stored anywhere).

## Design conventions to keep
- Bengali text uses the Kalpurush font (via `fonts.maateen.me`), with
  Baloo Da 2 / Hind Siliguri / Playfair Display as fallback/accent fonts.
- Each top-level category gets its own accent colour, applied via a CSS
  variable (`--cat-accent`) set inline on that category's element.
- No progress dashboard on the homepage — per-subject internal progress
  schemas differ too much to summarize honestly; don't re-add one unless
  I ask for it explicitly.
- The homepage has a live countdown to a placeholder exam date
  (`EXAM_DATE` constant in index.html, currently 2027-01-01) — update that
  one line when I give you the real announced date.
