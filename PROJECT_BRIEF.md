# Project brief — My Job Preparation

This is a static study workspace hosted on GitHub Pages at
https://pothikroy.github.io/myjobpreparation/ from the main branch, repository root.
Firebase Authentication and Firestore provide the existing Google sign-in,
owner approval flow and account-specific progress storage.

## Unified workspace

- index.html, dashboard.css and dashboard.js provide the overview, searchable
  library, embedded study workspace, review queue and combined progress record.
- study-catalog.js is the shared inventory of all 36 study tools: 32 BCS, 2 bank,
  2 TFP. Preserve stable IDs and paths when adding or moving content.
- shared-progress.js contains read-only adapters for the different progress
  schemas. Original module data remains the source of truth.
- progress-store.js handles account-specific browser storage, cloud hydration,
  offline retry, study activity and full-site JSON backup/restore.
- auth-gate.js retains sign-in, owner approval and account controls. It waits for
  account selection and initial cloud hydration before activating module scripts.
- firebase-config.js is the existing public Firebase web configuration. Never
  put GitHub tokens, service-account keys or other server secrets in site files.

## Persistence and migration

Browser storage for managed study keys is namespaced by Firebase UID. The
first account to migrate the old unscoped records claims those legacy records;
the originals are retained locally as a migration backup. Exam Simulator uses
an account-specific IndexedDB database with the original object-store schema.

Cloud records stay at users/{uid}/progress/{moduleId}, with their original data
maps. Shared activity and settings use the same collection's _hub document.
Local edits retry every 25 seconds, on reconnect and when leaving a page.
The dashboard reads all cloud records on sign-in; Progress record > Sync now
also retrieves remote changes. An active module's in-memory state is protected
from background hydration. Simultaneous edits on different devices use the
newer module snapshot; avoid editing the same module on two devices at once.

Each module's executable inline scripts use type="text/x-study-script" so they
cannot initialize or write defaults before the account's progress has loaded.
The shared store activates them in original order, including DOMContentLoaded
initializers. Keep data scripts with application/json unchanged.

Combined accuracy is weighted by recorded answers. Cumulative counters retain
repeated attempts; modules that only store the latest result count once per
question. History is used only where it does not duplicate question counters.
Mastery and due counts come from explicit statuses and saved dates. No global
completion percentage is inferred across questions, books, words and topics.
Activity time starts with this version and counts focused, recently active study
windows. The exam date is a personal setting, not an assumed official date.

## Backups

Progress record > Export all progress includes every persisted module, original
notes/bookmarks/schedules, all Exam Simulator stores and workspace settings.
Restore validates the file before writing, downloads the current backup first,
and rolls back if storage fails. Imported modules replace their current records.
Export files contain personal progress; keep them private.

## Adding a study tool

1. Add it to study-catalog.js with a stable ID, path, labels and exact storage spec.
2. Include the existing Firebase SDKs, firebase-config.js, AG_PAGE, shared catalog,
   shared-progress.js, progress-store.js and auth-gate.js using correct relative paths.
3. Defer executable inline scripts with type="text/x-study-script". Keep AG_PAGE
   executable before auth-gate.js; preserve JSON data script types.
4. Add an explicit adapter in shared-progress.js for any new progress schema.
5. Bump shared script cache versions across all pages when changing shared code.

## Verification and publishing

No dependency installation or build is required. Run `node --test tests/*.test.cjs`
(or npm test with Node on PATH). For an ordinary preview run
`python -m http.server 4173 --bind 127.0.0.1`.

For isolated browser checks run `python tests/qa_server.py`, then visit
http://127.0.0.1:4173/tests/browser.html and /tests/integration.html. That server
replaces Firebase only in its HTTP responses with a local test double. It never
changes production sources or contacts the real backend. Never use it for hosting.

Publish verified changes through GitHub using the connected account or authorized
session credentials. Never store credentials in files, Git remotes or commits.
The main branch is the existing GitHub Pages deployment target.
