# DAILY QUEST

A mobile-first personal fitness progression system built with HTML, CSS, and vanilla JavaScript. It uses local browser storage, follows Asia/Manila dates, and works offline after the first visit.

## Project files

- `index.html`, `styles.css`, `app.js`, and `progression.mjs` — application
- `manifest.webmanifest`, `sw.js`, and icons — installable PWA and offline app shell
- `progression.test.mjs` — progression and persistence tests (Node.js built-in test runner)
- `daily-quest.zip` — distributable source package

## Run locally

Serve this folder over HTTP; service workers and installability require HTTPS or localhost. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser. No build step or external dependencies are required. The interface uses a system-font fallback if its optional web fonts are unavailable.

Run the focused tests with:

```sh
node --test progression.test.mjs
```

## Host on GitHub Pages

1. Push the project files to the root of a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, choose the branch containing the app and the `/ (root)` folder, then save.
4. Open the published HTTPS URL after the Pages deployment finishes. The relative asset paths support project sites hosted below a repository subpath.

## Install on iPhone

1. Open the published HTTPS site in **Safari** (not an in-app browser).
2. Tap **Share**, then **Add to Home Screen**. Enable **Open as Web App** if the option appears, then tap **Add**.
3. Launch DAILY QUEST from the new Home Screen icon. Visit the app once while online so its app shell can be cached for offline use.

Progress is stored on the device and browser where it was created. Use **Settings → Export JSON** to make a backup before clearing Safari website data or changing devices. Importing a backup replaces the progress on that device after confirmation. The app does not sync data to a server.

## Fitness and progression notes

New players start at Level 1 with 0 EXP and no invented history. Completing today's quest awards its listed reward once per Asia/Manila calendar date. Level thresholds are 100, 150, 200, 250 EXP, and so on. Recovery quests award less EXP than strength sessions. Adapt or skip any movement that feels uncomfortable; stop if you feel pain or unwell.
