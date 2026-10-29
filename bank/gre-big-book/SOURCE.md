# GRE Big Book Lab — source and implementation notes

The primary experience was replaced by the typed topic workspace on 29 October
2026. See [TRANSCRIPTION.md](TRANSCRIPTION.md) for current coverage, quality
labels and curriculum research. The original reader described below is now an
optional legacy view for source checking and previous section drafts.

Source: the user-supplied `9.GRE_big_book.pdf`, ETS, 1996, 1,089 PDF pages.
`gre-big-book.pdf` is an unchanged copy. Its SHA-256 is stored in `book-data.js`
and checked by the regression suite. Printed page numbers are generally PDF page
minus two; the reader labels both and links to the original PDF.

The scan contains 27 tests, two sections per ability per test, and 5,020 keyed
questions across 162 sections. Tests use different section orders and sometimes
skip a section number. The library preserves those numbers rather than assuming
that, for example, every Section 2 is quantitative.

## Answer index

`scripts/build_gre_book.py` uses the scan’s existing OCR and the answer tables’
column positions. Question pages are displayed as original PDF pages, preserving
formulas, diagrams and passages. OCR text is available as an optional reading aid
and may contain errors; it is not substituted for the original question.

Run the generator with pdfplumber and layout text from `pdftotext -layout`:

```text
python scripts/build_gre_book.py --pdf supplied-book.pdf --text extracted-layout.txt
```

The generator validates every test/section boundary, six answer columns per test,
answer counts, allowed choices and the total. In answer cells only, common OCR
glyphs `0`/`O` are normalized to D and `8` to B. Other scan exceptions were
visually inspected against the rendered original pages:

- Test 6, Section 1, question 14: D (the scan has a mark through the character).
- Test 10, Section 1, question 3: C (OCR reads G).
- Test 21, Section 6, question 2: C (OCR reads 6).
- Test 23, Section 2, question 22: D (OCR loses the character).
- Test 24, Section 2: discard an extra OCR I between questions 22 and 23.
- Test 3, Section 3 contains 37 questions and 37 key entries.
- Test 21, Section 6 ends at question 37 with 37 key entries, despite a heading
  that says 38. The app follows the actual questions and answer key.

The original key page remains one click away for checking. The test sections do
not include new worked solutions; the learner’s own reasoning and error notes
are saved separately.

## Preparation mapping

The BB AD and IBA routes are suggested skill-practice routines, not claims about
current paper formats, marks, exam dates or cut-offs. The IBA source is the
[official MBA 2025–26 notice](https://iba-du.edu/upload_images/MBA68thBatch.pdf),
which lists English Language & Communication, Mathematics and Analytical Ability
and requires qualification in each area. Consult the current intake’s notice.
The [Bangladesh Bank recruitment portal](https://erecruitment.bb.org.bd/) is
linked for the current post’s requirements. It rejected automated access during
preparation; no current BB exam marks or syllabus allocation is asserted.

Historical GRE score conversions and examinee percentages are not used to
estimate BB AD or IBA results. The app reports raw accuracy and skipped answers.

## State and privacy

`gre_big_book_v1` uses the shared store’s Firebase UID namespace and cloud
hydration. Questions retain cumulative correct/wrong counts, notes, bookmarks
and review dates. Each section has an independent resumable draft. A timed draft
retains its deadline through refresh and while away. Blank responses are skipped;
checking and submitting the same response cannot count it twice.

Vocabulary cards contain the learner’s definitions and examples. Confidence
ratings change mastery/review dates without altering answer accuracy. The module
is included in the shared dashboard and full-site backup/restore.

Large GRE cloud snapshots use immutable text parts in the same user progress
collection. The manifest commits after all parts succeed; incomplete uploads
leave the preceding snapshot intact. Local state and export files keep the
original schema. This avoids Firestore’s single-document size limit as the
5,020-question record grows. Other study modules keep their existing format.
See the [official Firestore document limits](https://firebase.google.com/docs/firestore/quotas#collections_documents_and_fields).

Quantitative comparison questions 1–15 use choices A–D, as directed on all 54
quantitative section opening pages. Later quantitative questions use A–E.

## PDF reader

Mozilla PDF.js 6.4.299 is vendored from the official `pdfjs-dist` npm package.
See `vendor/pdfjs/LICENSE` for Apache-2.0 licensing and the bundled font/wasm
licenses. The viewer and worker use local assets. The original PDF loads only
when opening a reading or practice page; the home dashboard does not download it.
