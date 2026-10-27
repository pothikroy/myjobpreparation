# Project brief — My Job Preparation

This is a static study workspace hosted on GitHub Pages at
https://pothikroy.github.io/myjobpreparation/ from the main branch, repository root.
Firebase Authentication and Firestore provide the existing Google sign-in,
owner approval flow and account-specific progress storage.

## Unified workspace

- index.html, dashboard.css and dashboard.js provide the overview, searchable
  library, embedded study workspace, review queue and combined progress record.
  The sidebar has a scrollable middle section and a pinned account footer. Its
  close button and top-bar navigation toggle support every viewport; desktop
  hiding is remembered on this device using study_sidebar_collapsed. Mobile
  navigation also closes on backdrop click or Escape. Account/sign out remains
  available in the top bar, alongside an owner-only Approvals shortcut.
- study-catalog.js is the shared inventory of all 37 study tools: 32 BCS, 3 bank,
  2 TFP. Preserve stable IDs and paths when adding or moving content.
- shared-progress.js contains read-only adapters for the different progress
  schemas. Original module data remains the source of truth.
- progress-store.js handles account-specific browser storage, cloud hydration,
  offline retry, study activity and full-site JSON backup/restore.
- auth-gate.js retains sign-in, owner approval and account controls. It waits for
  account selection and initial cloud hydration before activating module scripts.
  AG_OPEN_ACCOUNT opens account/sign-out controls; AG_OPEN_APPROVALS is exposed
  only on the owner's admin-enabled homepage and focuses the existing request
  list. Firestore authorization and the owner/guest access flow are unchanged.
- study-ui.css and study-ui.js add the shared study header, searchable tool
  switcher, focus mode, readable typography, mobile fixes and reading appearance.
  They initialize after study-ready, preserving native module events and data.
  Reader preferences live in the account's _hub.reader map. Keep semantic study
  statuses and original progress schemas independent of appearance settings.
- bank/gre-big-book is a source-page reader and practice lab for the supplied
  GRE Big Book: 27 tests, 162 indexed sections, 5,020 keyed questions. It has BB AD
  and IBA MBA study routes, timed/untimed drafts, mistake notes, vocabulary and
  revision. gre-core.js owns grading; gre_big_book_v1 uses the shared store.
  SOURCE.md records scan exceptions, provenance, PDF.js licensing and scoring.
  Preserve original PDF pages rather than rewriting OCR-corrupted math or prose.
- firebase-config.js is the existing public Firebase web configuration. Never
  put GitHub tokens, service-account keys or other server secrets in site files.

## Persistence and migration

Browser storage for managed study keys is namespaced by Firebase UID. The
first account to migrate the old unscoped records claims those legacy records;
the originals are retained locally as a migration backup. Exam Simulator uses
an account-specific IndexedDB database with the original object-store schema.

Cloud records stay at users/{uid}/progress/{moduleId}, with their original data
maps. Large GRE records use cloud-records.js to split the transport into bounded
immutable sibling documents; a manifest commits only after every part succeeds.
The same store reassembles the original state before activation. Backups keep
the original schema. Other modules retain their existing cloud representation.
Shared activity and settings use the same collection's _hub document.
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
   shared-progress.js, cloud-records.js, progress-store.js and auth-gate.js using correct relative paths.
3. Defer executable inline scripts with type="text/x-study-script". Keep AG_PAGE
   executable before auth-gate.js; preserve JSON data script types.
4. Add an explicit adapter in shared-progress.js for any new progress schema.
5. Bump shared script cache versions across all pages when changing shared code.
6. Include study-ui.css and deferred study-ui.js after the module's styles and
   shared store scripts. Use the shared Inter/Noto Sans Bengali font link.

## Verification and publishing

No dependency installation or build is required. Run `node --test tests/*.test.cjs`
(or npm test with Node on PATH). For an ordinary preview run
`python -m http.server 4173 --bind 127.0.0.1`.

For isolated browser checks run `python tests/qa_server.py`, then visit
http://127.0.0.1:4173/tests/browser.html and /tests/integration.html. That server
replaces Firebase only in its HTTP responses with a local test double. It never
changes production sources or contacts the real backend. Never use it for hosting.

The same QA server also serves /tests/ui-audit.html (all 38 desktop/mobile views,
light/dark contrast screening) and /tests/study-ui.html (reading preferences,
navigation, focus, account controls and exam date regression checks). QA identities
are isolated from each other and the live backend. See UI_AUDIT.md for scope and
limitations; these checks do not certify complete WCAG conformance.

/tests/navigation-account.html checks desktop collapse persistence, short-screen
sidebar scrolling, mobile dismiss controls at 320/390px, top-bar account access,
owner/guest approval visibility, local test approval and sign out back to sign-in.
It uses synthetic accounts and never approves or signs out a live user.

/tests/gre-book.html covers the new book’s PDF rendering, draft recovery,
answer grading, expiry, shared/cloud/backup records, vocabulary, mobile panes and
account isolation. Run sync/restore scenarios sequentially: the local mock’s
offline switch is shared across test tabs. The production Firebase is never used.

Publish verified changes through GitHub using the connected account or authorized
session credentials. Never store credentials in files, Git remotes or commits.
The main branch is the existing GitHub Pages deployment target.

/tests/gre-cloud.html verifies large Unicode round-trips, interrupted uploads,
manifest hydration, backup fidelity, obsolete-part cleanup and incomplete-snapshot
protection. Run it separately from tests that toggle the mock offline switch.
