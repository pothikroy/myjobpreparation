# Auteur Type — typing practice

A static, distraction-free typing trainer built around an essay on **auteur theory**. Every passage is the original text, word for word. It runs entirely in the browser: no server, no build step, no accounts, no API keys, no external files.

## Main features

- **Four ways to practise**
  - *Timed test*: 15 s, 30 s, 60 s, 2 min, 5 min or 10 min; stops automatically at zero.
  - *Passage*: type one complete passage.
  - *Full document*: work through the essay section by section; your place is remembered.
  - *Custom range*: pick a start and end passage and type them as one test.
  - *Mistake practice*: drills built from the words and characters you mistype most.
- **Typing area**: correct, wrong, current and upcoming characters each look different; the current word is highlighted; the text scrolls with you; four caret styles; strict or relaxed mode.
- **Live statistics**: Net WPM, Gross WPM, accuracy, correct and incorrect characters, keystrokes, errors, remaining characters, time elapsed, time left, progress.
- **Results screen**: speed-over-time chart, accuracy ring, correct/incorrect bar, comparison with earlier attempts, mistyped characters, mistyped words, and buttons for *Try again*, *Next passage*, *Practise mistakes* and *Return to dashboard*.
- **Progress tracking**: history, best / average WPM, accuracy, practice time, characters typed, passage completion, daily goal and streak, all saved in your browser.
- **Sound** (generated with the Web Audio API, no audio files): four key-sound profiles, an error sound, a completion chime and optional countdown ticks. Separate volume sliders for typing, errors and alerts, plus a master switch.
- **Extras**: on-screen keyboard that shows the next key and flashes correct/incorrect presses, focus mode, full-screen mode, dark / light / system themes, font family and size settings, export / import of your progress as a JSON file.

## How WPM and accuracy are calculated

- A "word" is 5 characters (the standard typing-test convention).
- **Gross WPM** = all keystrokes ÷ 5 ÷ minutes.
- **Net WPM** = correct characters currently in the text ÷ 5 ÷ minutes. This is the headline "WPM".
- **Accuracy** = correct keystrokes ÷ total keystrokes. A mistake you later fix still counts against accuracy; nothing is hidden.
- Characters are checked by value. A character is only correct if you typed the right one.
- Backspace is not counted as a keystroke.

### Typing modes
- **Relaxed**: a wrong character is recorded and you move on (Backspace to correct it).
- **Strict**: a wrong character does not advance the caret until you type the right one.

### Special characters in the essay
The essay contains a few characters that are awkward on an English keyboard. The text on screen is kept exactly as written, but these are accepted in a friendly way:

| In the text | You can type |
|---|---|
| `é`, `è`, `ç` | `é`/`è`/`ç` *or* plain `e`, `e`, `c` |
| `•` (bullet) | `*` or `-` |
| a tab after list numbers (shown as `⇥`) | `Tab` or `Space` |
| a line break (shown as `↵`) | `Enter` |

### About the text
The passages were cut from your file along its headings, so the library follows the essay's structure. Joined back together, they reproduce the original text exactly. Only two invisible things were normalised: one trailing space at the end of a line, and the final newline of the file.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Start the clock before the first character (while the test has not started) |
| `Tab` | Restart (press twice if a test is under way) |
| `Ctrl` + `Enter` | Restart the current passage |
| `Esc` | Exit the test / return to the dashboard |
| `Backspace`, `Ctrl` + `Backspace` | Delete a character / a word |

The test pauses automatically if you switch tabs or windows. Click or press any key to resume.

## Run it locally

Everything is static, so you can simply **double-click `index.html`**. (Opening the file directly works in Chrome, Firefox and Edge. If you prefer a local server, run `python3 -m http.server` in this folder and open `http://localhost:8000`.)

## Publish it on GitHub Pages

1. Create a GitHub account if you do not have one, then click **New repository**. Name it (for example `typing-test`) and make it **Public**.
2. Upload the contents of this folder to the repository: on the repo page choose **Add file → Upload files**, drag in `index.html`, `style.css`, `script.js`, `passages.js` and `README.md`, then **Commit changes**. (`index.html` must be at the top level of the repository, not inside another folder.)
   - Or use Git:
     ```bash
     git init
     git add .
     git commit -m "Add typing test"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/typing-test.git
     git push -u origin main
     ```
3. In the repository open **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**. Select the **main** branch and the **/ (root)** folder, then **Save**.
5. Wait a minute or two. GitHub shows the address at the top of the Pages screen:

   `https://YOUR-USERNAME.github.io/typing-test/`

All file paths in the project are relative, so it works under that sub-path without changes.

## Where your data is stored

Everything lives in your browser's **localStorage** on your device; nothing is sent anywhere.

| Key | Contents |
|---|---|
| `auteurtype:settings:v1` | Theme, font, caret, typing mode, sound settings, goal, etc. |
| `auteurtype:data:v1` | Test history (latest 300), passage completion, mistake records, practice time, daily minutes |

- Data survives refreshes and restarts, but it is **per browser and per device**, and clearing site data erases it. Use **Progress → Export data** to keep a backup, and **Import data** to restore it elsewhere.
- **Progress → Reset progress** wipes the history (after a confirmation). Settings are kept.
- Private/incognito windows may block or discard localStorage; the app will tell you if saving fails.
- An unfinished test is not saved. Refreshing returns you to the dashboard (the browser asks first if a test is under way).

## Known limitations

- Sound can only start after your first click or key press (browser autoplay rules). The app initialises audio on that first interaction.
- Touch-screen phones: the app works and the on-screen keyboard of the phone can be used, but a physical keyboard gives the most accurate results. Predictive text or auto-correct on some phone keyboards can insert whole words at once.
- The full-screen button is hidden in browsers that do not support the Fullscreen API.

## Files

```
index.html    page structure
style.css     all styling (dark and light themes)
script.js     typing engine, statistics, sound, charts, storage
passages.js   the essay, split into passages (generated from your text file)
README.md     this file
```

> Note: in this site the app is a single page — `passages.js` and `script.js` are inlined into `index.html` so the site\x27s progress sync can start them after login.
