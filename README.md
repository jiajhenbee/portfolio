# Bee Li — landing page

A small static one-page site. No build step: open `index.html` or serve the folder.

## Structure

```
portfolio/
  index.html              # the page (markup only)
  assets/
    css/
      style.css           # all styles + design tokens
    images/
      bee-logo.png         # the "b" brand mark
  README.md
```

## Run locally

Serve the folder with any static server, for example:

```bash
python3 -m http.server 8123
```

Then open http://localhost:8123/ in a browser.

## Deploy

Upload the whole folder (keeping the `assets/` paths) to any static host. Paths are
relative, so it works from any sub-directory.

## Notes

- Fonts load from Google Fonts (Inter).
- Colours are defined once as tokens in `:root` at the top of `style.css`.
- Links use dark text + underline for clear, accessible affordance.
