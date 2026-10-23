# exciting.io

The website of Exciting, a small London studio. It is a static site built by a small, dependency-free Node script.

- **Content:** posts and projects live in `site/content.json`. Edit that, then rebuild.
- **Build:** `rake build` (or `node site/build.mjs`) writes the whole site into `_site/`, emptying it first.
- **Preview:** `rake serve` builds, then serves `_site/` at http://localhost:8000.
- **Deploy:** `rake deploy` builds, then rsyncs `_site/` to the server.

Needs Node 20 or later, plus Ruby for `rake` and Python 3 for `rake serve`.

How the generator is put together, including the per-project page designs, is in `site/NOTES.md`.
