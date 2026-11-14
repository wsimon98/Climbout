# Contributing to Climbout

Issues and pull requests are welcome.

- Keep it dependency-free: plain HTML, CSS and JavaScript in the browser, one PHP file on the server, no build step.
- Check your changes before opening a PR: `node --check app.js` and `php -l api.php`, then try the page with a few real
  flights on a desktop and a phone-sized window (portrait and landscape).
- New upstream data sources must be free, need no API key, allow this kind of use, and be cached in `api.php`.
  adsb.lol and the other providers are free community and public services, so be gentle with them.
- Airline codes: when you add to the IATA→ICAO table in `app.js`, please cite a source in the PR.
- Bump the `?v=` stamp in `index.html` when you change `app.js`, `style.css` or `land.js`.

By contributing you agree that your contribution is licensed under the Apache License 2.0.
