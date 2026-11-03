# Repalogic Group — Seat Booking Challenge

A responsive seat-booking page built with plain HTML, CSS and JavaScript.

## Run locally
Fetch requires a local HTTP server; do not open `index.html` directly from the file system.

```bash
python -m http.server 8000
```

Open http://localhost:8000.

## Run logic tests
Requires Node.js:

```bash
node tests/seats.test.js
```

## Files
- `index.html` — accessible page structure and checkout dialog
- `styles.css` — responsive layout, seat states, focus styles and dark mode
- `event.json` — supplied event data
- `js/seats.js` — pure seat and pricing logic
- `js/app.js` — UI, loading, keyboard controls and checkout
- `tests/seats.test.js` — required and additional logic tests
- `NOTES.md` — implementation notes and accessibility checks
