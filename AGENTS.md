# mdbook-multilang-site – Agent Guide

This repository hosts a static multilingual book template. It is designed so that all customisable data lives in `config/site.config.json` and Markdown chapters under `content/<language-code>/`. When editing or extending the project, keep the following guidelines in mind.

## Repository layout

- `index.html` – loads configuration, SEO metadata, and renders the shell.
- `assets/styles.css` – global styling. Prefer CSS variables and keep dark-mode support intact.
- `assets/scripts.js` – vanilla JavaScript that reads the config, performs runtime rendering, updates meta tags, and handles navigation.
- `config/site.config.json` – single source of truth for site metadata, languages, navigation, and SEO options.
- `content/` – Markdown sources organised by language code. Filenames should match the references in the config.
- `tools/generate-sitemap.mjs` – Node script that regenerates `sitemap.xml` and `robots.txt` using the config.
- `package.json` – exposes `npm run generate:sitemap` for the script above.

## Working conventions

- **Always update the config** instead of hardcoding metadata. Any new site-wide parameter should be added to `config/site.config.json` and consumed via `assets/scripts.js`.
- **Keep SEO features functional**: if you modify how pages are rendered, ensure canonical URLs, alternate language links, Open Graph/Twitter tags, and JSON-LD continue to be produced.
- **Language awareness**: guard features so they degrade gracefully if a language lacks a chapter file. Do not assume every chapter exists in every language.
- **Styling**: use CSS custom properties and keep the layout responsive (desktop + mobile). Dark-mode tokens are already defined; extend them if you introduce new colour variables.
- **JavaScript**: stay with framework-free ES modules / IIFE style. Avoid bundler-specific syntax. Do not introduce blocking synchronous XHR.
- **Scripts**: If you add files that depend on the config (e.g. feeds, manifests), update `tools/generate-sitemap.mjs` or provide a similar utility so generated artifacts stay in sync.

## Required checks

After changing configuration, Markdown, or SEO-affecting files, rerun:

```bash
npm run generate:sitemap
```

Include the regenerated `sitemap.xml` and `robots.txt` in commits.

