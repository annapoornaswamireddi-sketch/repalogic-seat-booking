1. The project uses plain HTML, CSS and JavaScript with no frameworks or third-party packages.
2. `event.json` contains the event name, seat categories, row mapping and sold seats.
3. `js/seats.js` contains pure seat validation, selection and price calculation functions.
4. `js/app.js` handles loading, rendering, keyboard navigation, checkout and confirmation.
5. `styles.css` provides responsive styling, light/dark colour schemes and visible focus indicators.
6. Run the site locally with `python -m http.server 8000` and open `http://localhost:8000`.
7. Run the logic tests with `node tests/seats.test.js`.
8. Keyboard checks: Tab enters/leaves the seat map; arrow keys move between available seats; Escape closes checkout and returns focus to Continue.
9. Screen-reader checks: seat buttons expose row, number, category, price and status; status and error messages use live regions. Further validation with a screen reader and axe/Lighthouse is recommended.
10. With more time, I would add persistent booking storage, server-side booking validation, automated browser tests and stronger cross-browser accessibility testing.
