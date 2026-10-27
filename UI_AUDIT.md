# Study interface audit — 27 October 2026

Scope: the dashboard and all 36 catalogued HTML study tools, including direct
entry links and embedded study pages. Existing questions, storage keys, module
IDs and progress adapters remain the source of truth.

## Changes

- Shared typography, restrained surfaces, consistent spacing, readable metadata,
  clear navigation icons and larger answer controls across the separate apps.
- One study header provides home, searchable library, account access, sync status,
  focus mode and reading appearance. Embedded study fills the workspace, avoiding
  duplicate dashboard navigation.
- Light, dark, sepia and system themes; reading size, line spacing and width are
  saved with the signed-in account and reused by all study tools.
- Corrected mobile grid overflow, scrollable tables and navigation, fixed sidebar
  heights and the vocabulary app's mobile navigation. Offscreen sidebars are inert.
- Added control names, visible keyboard focus, a skip link, keyboard activation
  for clickable chapter/topic cards, native modal dialogs and an account focus
  trap. Ctrl/Cmd+K opens the library; Alt+Shift+F toggles focus mode.
- Corrected hardcoded light/dark colour combinations and low-contrast metadata.
- Updated outdated local-only storage guidance to explain device persistence,
  account cloud sync and backups accurately.
- Removed the TFP 502 tutor's invented ten-hour exam deadline. An unset date asks
  the learner to choose one; selected local date/time survives render unchanged,
  and clearing it works safely. Existing saved dates remain intact.

## Verification

- All 37 pages initialize with the shared interface without runtime errors.
- All 37 pass themes, persisted reader settings, tool search, focus and account
  workflow checks in an isolated browser test environment.
- 12 browser progress integration checks pass, including account isolation,
  migration, hydration, cloud sync, offline retry and backup/restore.
- 9 Node progress and catalog regression tests pass.
- Embedded application/json study datasets compare unchanged against the
  published baseline. The remaining inline-script changes are limited to heads,
  storage/help wording, a study-insight label and the exam date correction.
- Desktop 1280px and mobile 390px default views are screened for overflow,
  unnamed controls and text below 12px. Light/dark default views receive computed
  text-contrast screening after transitions settle. Intentional horizontal tables
  and navigation are recognized as scroll regions.
- The final 37-page scan reports zero runtime errors, unnamed controls, text
  below 12px, unintended overflow or detected contrast failures in those views.
- Manually checked Bengali chapter navigation with Enter, library keyboard search,
  reading appearance, focus mode and answer reveal in an isolated local account.

## Limits

This is a UI and workflow audit, not an examination-content fact check or a WCAG
certification. Automated contrast screening skips gradients and translucent
backgrounds and covers default views, not every possible quiz, modal, status or
content combination. Firebase writes use a local QA double; production progress
was not edited for testing. Course-specific study workflows remain distinct.

Contrast and control guidance: [WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Run `python tests/qa_server.py` and visit `/tests/ui-audit.html`,
`/tests/study-ui.html` and `/tests/integration.html`. This test server rewrites
Firebase only in local HTTP responses and must never be used for production.
