# Family Chore Board: notes for Claude

A chore board for Tracy, Billy and Vivian (8). It's a static website on GitHub Pages that syncs through a Google Sheet via an Apps Script web app. Family members use it in Safari on iPhones (added to the Home Screen) and on an Apple HomeView (7-inch square screen, about 544×544 CSS px, white background).

User-facing setup and usage docs are in `README.md`. Private links (sheet ID, script project, web app URL, setup link) are in `CLAUDE.local.md`, which is gitignored. Never commit them: the repo is public.

## Files

- `docs/index.html`: the whole web app (HTML, CSS and JS in one file). GitHub Pages serves `docs/` from `main`.
- `docs/manifest.webmanifest`, `docs/icons/*.png`: Home Screen app setup. The icons were generated with a small pure-Python rasterizer, since PIL isn't installed.
- `apps-script/Code.gs`: repo copy of the sync script. `SHEET_ID` is blank here. The live copy has the real ID filled in.
- `tools/mock_server.py`: local stand-in for the Apps Script web app plus a static file server, for testing.
- `chore-tracker.html`: obsolete first version, built as a claude.ai artifact. It's gitignored, so don't edit it.

## How it works

**Google Sheet tabs** (the sheet is the source of truth for chores):
- `Chores`: Room | Chore | Frequency (Daily/Weekly/Monthly) | Points | Owner (Tracy/Billy/Vivian) | ID | Days (optional, e.g. `Mon, Tue`).
- `Completions`: ID | Chore ID | Person | Points | Period | Date | Time | Bonus. One row per check-off. The completion ID is `<period>~<choreId>`, where period is `D2026-11-20`, `W<monday date>` or `M2026-11`, so a chore can be done once per period.

**Apps Script API:**
- `GET ?since=YYYY-MM-DD` returns `{ok, people, chores, completions (date >= since), last: {choreId: lastDate}, first: firstDate}`.
- `POST` (body sent as `text/plain` to avoid a CORS preflight) accepts `{op: 'done', record}`, `{op: 'undo', id}` or `{op: 'seed', chores}`, and returns the same state. `seed` only writes when the Chores tab is empty. A blank chore ID gets filled in on read.

**Web app (`docs/index.html`):**
- The API URL lives in each device's `localStorage` (`chores.api`), set from the Setup tab or a `#setup=<encoded exec URL>` link. `validApi()` also accepts `http://localhost:<port>/exec` when the page itself runs on localhost.
- The app polls every 20 s, and on focus or visibility change. Check-offs are optimistic and queue in `pending` (saved in localStorage) until the server confirms them. The last state is cached so the board appears instantly.
- The "this screen is for" picker offers Everyone (shared mode, which asks "Who did it?" on each check-off) or a specific person.
- Tabs: Today, Scores, History, Plan, Setup.
- `STARTER` in index.html is only used to seed an empty sheet. Edit chores in the sheet, not in the code.
- **Bonus chores:** `dailyTargets()` picks one chore per person each day from their own chores. A chore is eligible if it was skipped (`skipsBefore` > 0), or if it's a weekly or monthly chore not done yet this period, and it must be available today (Days column). If someone has nothing eligible, their slot goes to the next pick, for 3 in total. The order rotates by FNV hash of `date|choreId`. The bonus is 25%, or 50% if skipped 2+ periods in a row. Picks are computed from completions *before* the current period, so they don't change during the day. The bonus is stored on the completion record.
- **Skips:** counted per period from the last completion (the server's `last` plus the local window), or from the board's first day if the chore was never done.
- **Days column:** `availableOn()` hides a chore on other days unless it's already done. `daysText()` shows "Mon or Tue · due today" or "last chance today". The trash bins chore is `Mon, Tue`.
- **Wording:** the UI says "Family Jobs" and "jobs" (user asked for something more kid-friendly than chores). Code, sheet tab and IDs still say chores.
- **Done earlier?:** weekly/monthly rows have a link that opens the picker with a date (back 35 days, or 92 for monthly). It posts a normal `done` record dated that day, with no bonus.
- **Taking turns:** Owner can be `Tracy/Billy` (split on `/ , & + and`). `ownerOn(c, date)` picks `owners[(periodIndex - periodIndex(ROT_ANCHOR)) % n]`, where ROT_ANCHOR is 2026-11-16. Use `ownerOn`, never `c.owner`, for anything per person. Every Tracy and Billy job takes turns except their personal ones (papers, living-room pickup, closet). The user wanted this so nobody gets stuck with the same jobs.
- **History tab:** 7-day rates for each person's own daily chores, the "Being skipped" list, and a 14-day daily log.

## Decisions the user made (keep these)

- Person colors: Tracy hot pink `#e8197d`, Billy red `#d42a2a`, Vivian light blue `#4fb6ec`. Initials are white on pink and red, and dark navy on blue. The user tried black initials and went back to navy.
- No growing bonus on every skipped chore. Use only the daily rotating bonus chores, at least one per person.
- History has no dots grid. The user prefers the list and log.
- Bins go to the curb Monday night, or Tuesday morning if missed. A separate daily chore covers kitchen trash and breaking down boxes.
- Reward levels per person are still to be designed. The user wants rewards that can differ for each person.

## Deploying

**Website:** commit and push to `main`. Pages rebuilds in about 30–60 s. Check it with `gh api repos/Y3AG3R/chore-board/pages/builds/latest -q .status`, which should report `built`. Phones and the HomeView pick up the change on their next reload.

**Apps Script:** the live script is a standalone project, not bound to the sheet. The browser pane blocks the sheet's Extensions → Apps Script pop-up, so the project is at script.google.com instead (link in `CLAUDE.local.md`). The user is signed in to Google in the built-in browser pane. To update it:
1. Edit `apps-script/Code.gs` and keep `SHEET_ID = ''` in the repo.
2. Build a typing version with the real `SHEET_ID`: strip comments and put each top-level function on one line. Pasting doesn't work in the pane, and Monaco auto-closes braces when you type a newline inside them.
3. In the editor, select all, Delete, then use `computer` `type` with that text.
4. Verify by comparing an FNV-1a checksum of `monaco.editor.getModels()[0].getValue()` against the local text.
5. Save with Cmd+S. Then go to Deploy → **Manage deployments** → pencil icon → Version: **New version** → Deploy. This keeps the same `/exec` URL. Use `find` or a screenshot before clicking menu items, because the positions shift.
6. Check with `curl -sL "<exec URL>"`.

Sheet edits can go through the Google Sheets connector (same Google account). The Chores tab's sheetId is `1376548269`.

## Testing locally

The preview server can't read `~/Documents` (sandbox), so copy `docs/` to the scratchpad and serve it from there:
`python3 -I tools/mock_server.py <scratchpad>/site` serves on port 8765. `.claude/launch.json` (gitignored) has a `chore-board-test` config. Update its paths to the current scratchpad first.

Then open `http://localhost:8765/#setup=http%3A%2F%2Flocalhost%3A8765%2Fexec`. Fake history can be POSTed to `/exec` with past dates. Test the HomeView layout at 544×544 in light mode.
