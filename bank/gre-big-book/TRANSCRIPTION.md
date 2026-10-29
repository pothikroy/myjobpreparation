# Typed GRE study workspace

Updated 29 October 2026. The primary interface is native HTML question text,
choices, passages, comparison tables and topic lessons. It does not load PDF
images or PDF.js. The supplied PDF is an optional source reference; previous
section drafts remain accessible through `reader.html` using the same account.

## Coverage and honest quality labels

- All 5,020 original question IDs and answer keys remain indexed.
- 69 items have edited question text and original editorial learning notes:
  Test 1 Section 1 Q1–8, Q13, Q17–23, Q28–38;
  Section 2 Q1–25; Section 3 Q1–11, Q15–17,
  Q20, Q26–27. (The precise list is `reviewed: true` in the generated data.)
- 2,316 items contain structurally recovered, unproofread transcription drafts.
- 2,635 items require checks: damaged text, incomplete boundaries, shared
  context, mathematical notation, or figures and chart data not reconstructed.
  This group includes incomplete items; it is not a count of complete typed
  questions. The site does not claim full-book transcription is finished.

The reviewed set spans sentence completion, analogies, antonyms, reading,
critical reasoning, grouping, routes, arithmetic, algebra, percentages and
geometry. Data interpretation, ratios and rates also have editorial lessons;
not every topic currently has an edited question set. Mathematical drawings in
selected edited questions are restated as explicit conditions in words. Some
edited prompts shorten the source wording for screen reading, without changing
the tested relation, original choices or keyed answer. Line-number references
are described by paragraph/model instead of retaining broken scan line wraps.
The explanatory notes are newly authored, not an ETS worked-solutions manual.

## Practice and progress

Scored sets include edited items or items whose full text and shared context the
learner has explicitly checked against the source. Draft quality is not silently
promoted by the presence of five detected choice labels. An item with missing
text/choices cannot be admitted. The learner's confirmation is personal progress,
not an editorial change to the published transcription.

Native-text sessions use `typedSession` in `gre_big_book_v1`. Answers are graded
under the existing `tNN-sN-qNN` IDs, so notes, bookmarks, due dates and cumulative
correct/wrong counts remain compatible with the dashboard and cloud backups.
The legacy section-draft map is retained. Checking and submitting share an
idempotent grading record. Timed answers remain hidden until submission and a
wall-clock deadline persists across reloads.

## Research and curriculum mapping

Research date: 29 October 2026. References are linked in `curriculum.js` and the
Exam map & sources view. DU IBA's official MBA notices identify language,
mathematics and analytical ability with qualification in each area. The dated
68th-batch notice is retained, with the official 60th-batch notice as a readable
historical cross-check. No Karachi IBA, Delhi University, DU BBA or Executive MBA
syllabus is substituted for DU IBA regular MBA.

The Bangladesh Bank recruitment portal rejected automated access. The broad
AD study map is therefore explicitly supported by a secondary preparation guide
updated 2 August 2026, not presented as a verified current official blueprint.
Online guides give different year-dependent marks, so no exact AD distribution,
negative-marking rule, current cutoff or future test date is hardcoded. Both
tracks explain GRE's coverage gaps and distinguish a suggested learning routine
from an official mock examination.

## Rebuilding

`scripts/build_gre_typed.py` reads the positioned pdfplumber word cache and the
layout text generated from the exact supplied scan. It separates columns,
recovers numbered items and explicit options, links shared stimuli, retains
typed source-page references and flags questionable text instead of guessing.
`scripts/gre_reviewed.py` applies the explicit editorial corrections and checks
every edited explanation's selected letter against the original key.

The source OCR cache lives in ignored `.qa/`; no API keys or OCR service are
needed at runtime. To reconstruct that cache, extract `page.extract_words` with
pdfplumber (x_tolerance=2, y_tolerance=3), recording text, x0, x1, top and bottom
as t/x/r/y/b for each of the 1,089 pages. Generate layout text with pdftotext.
The resulting `typed-data.js` is checked in for buildless GitHub Pages hosting.

## Validation

Node regressions validate all source IDs/keys, topic tags, edited choice counts,
quality gating, cross-section grading, repeated submission, timed persistence,
notes and the shared storage schema. The isolated browser workflow checks
native text (no PDF assets), lessons, search, comparison tables, reading passage,
draft confirmation, Bengali notes, cloud backup, timers, mobile layout and user
isolation. QA uses mock Firebase; it does not modify real learning records.
