# How the site is built

`node site/build.mjs` builds the whole site. It has no dependencies.

## What a build does

1. **Empties `_site/`.** It then copies in, from the repo root, `CHECKS`, `Rakefile`, `favicon.ico`, `keybase.txt` and the Google verification file. It also copies `images/` to `_site/images/`, `site/fonts/` to `_site/fonts/` and `site/assets/` to `_site/assets/`.
2. **Writes every page:**
   - home, `/about/`, `/projects/`, `/blog/`, `/logos/` and `/404.html`;
   - a page for each project;
   - each post at `/YYYY/MM/DD/slug/`.
3. **Writes the feeds and indexes:**
   - `/feed.xml` (RSS 2.0, with full post content and absolute links; guids are kept as the old `http://exciting.io/...` permalinks so feed readers don’t show old posts again);
   - `/sitemap.xml`;
   - `/robots.txt`.
4. **Generates `/assets/printer.css`.** It scopes `site/vendor/manual.css` under `.manual` (see `scope-css.mjs`) and adds a few overrides.

## Content

`site/content.json` holds the site info, the about text, the projects and the posts. Projects appear in the order they are listed. Each post’s `published` field is its original timestamp, used for the feed and the sitemap. Post and project bodies are HTML. Internal links like `/printer` or `/2012/04/12/hello-printer/` are normalised to their trailing-slash URLs.

`site/image-dims.json` records the natural sizes of the images (taken with `sips`), so figures carry width and height. Re-run `sips` for any new image, or add its size to the project’s `images` entry in `content.json`.

## Page designs

- **The default is calm:** `assets/shell.css` sets fonts, tokens, browser surfaces, the header with the tilted EXCITING block, the footer and the one moving part. `assets/calm.css` styles the pages themselves.
- **`projectRenderers` in `build.mjs`** gives a project its own page design. Anything not listed gets the calm project page. Each bespoke renderer returns its main markup, stylesheets and scripts, and always sits inside the shared header and footer. Its CSS is scoped under its own root class:
  - **Printer:** `renderers/manual-printer.mjs`, scoped under `.manual`. It is the workshop-manual register: the exploded drawing comes apart as you scroll. The drawing geometry lives in `renderers/printer-drawing.mjs`, and the scroll and highlight script is `assets/printer.js`.
  - **Jelly:** `renderers/jelly-thread.mjs`, scoped under `.jt`. The story is told as a Jelly conversation, and `assets/jelly-thread.js` adds “Collapse all”.
  - **Harmonia:** `renderers/harmonia-dashboard.mjs`, scoped under `.hm`. The page is a Harmonia dashboard; `assets/harmonia-dashboard.js` marks tasks done in place.

## Fonts

All fonts are in `site/fonts/`:

- **Literata:** SIL OFL 1.1, `OFL-literata.txt`. The site’s reading face.
- **Brandon Grotesque Regular:** licensed. The EXCITING logotype only.
- **Archivo:** SIL OFL 1.1, `OFL-archivo.txt`. The Printer page only.
- **Figtree:** SIL OFL 1.1, `OFL-figtree.txt`. The Jelly page only.
- **Public Sans:** SIL OFL 1.1, `LICENSE-public-sans.md`. The Harmonia page only.
