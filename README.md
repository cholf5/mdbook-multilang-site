# mdbook-multilang-site

A ready-to-ship static website template for publishing multilingual books written in Markdown. All project metadata, navigation, and localisation details are driven by a single JSON configuration file so that you only have to edit Markdown files and update one config to launch your book.

![Screenshot of the multilingual book template](images/demo.webp)

---

## 🌟 Highlights

- **Markdown-first authoring** – store your chapters under `content/<language-code>/`.
- **Single source of truth** – configure title, languages, navigation, SEO, and footer in `config/site.config.json`.
- **SEO aware** – automatic canonical URLs, alternate language tags, JSON-LD, sitemap, and robots.txt generation.
- **No build tooling required** – the runtime uses [Marked](https://marked.js.org/) to render Markdown in the browser.
- **Upgradeable** – reuse the template through forking or as a Git submodule.

---

## 📁 Project structure

```
.
├── assets/                 # CSS and JavaScript that power the template UI
├── config/site.config.json # Central configuration for metadata, languages, and chapters
├── content/                # Markdown sources grouped by language code
├── images/                 # Shared static assets (favicons, social images, etc.)
├── index.html              # Entry point that loads the configuration at runtime
├── robots.txt              # Generated from the config (kept in sync via a script)
├── sitemap.xml             # Generated XML sitemap for SEO
└── tools/generate-sitemap.mjs  # Utility script to regenerate sitemap & robots.txt
```

---

## 🚀 Getting started

1. **Install Node.js** (18+ recommended) so you can run the helper script.
2. **Clone or scaffold** this repository (see [Upgrade & reuse](#-upgrade--reuse) for guidance).
3. **Update the configuration** in [`config/site.config.json`](config/site.config.json):
   - `site.title`, `site.tagline`, `site.description`, `site.author`, `site.baseUrl`
   - `languages` (code, label, locale, direction)
   - `chapters` (chapter IDs, translated titles, and per-language Markdown filenames)
   - `seo` settings such as keywords, Twitter handle, and social sharing image
4. **Replace the Markdown files** in `content/<language-code>/` with your chapters.
5. **Refresh the sitemap and robots.txt** after any change to the config or Markdown:
   ```bash
   npm run generate:sitemap
   ```
6. **Preview locally** by opening `index.html` directly in your browser or serving the folder with any static file server.
7. **Deploy** by uploading the repository (or the subset of files you need) to any static hosting platform (GitHub Pages, Netlify, Vercel, S3, Cloudflare Pages, etc.).

> **Tip:** Keep filenames consistent across languages (for example `introduction.md` in each language folder) so the navigation stays aligned.

---

## 🔧 Configuration reference (`config/site.config.json`)

| Key | Description |
| --- | --- |
| `site.title` | Title displayed in the header and browser tab. |
| `site.tagline` | Short description that appears below the title. |
| `site.description` | Default meta description used when a chapter does not define one. |
| `site.author` | Author name injected into JSON-LD structured data. |
| `site.baseUrl` | Public URL where the book will be hosted. Used to generate canonical URLs, sitemaps, and social images – **must be updated before deploying**. |
| `site.footer` | Footer text. Supports `{year}` placeholder for automatic year substitution. |
| `site.logo` | Path to the logo or cover image. |
| `site.contentsLabel` / `site.languageLabel` | Optional language-specific labels for UI strings. |
| `languages[]` | List of supported languages. Provide `code`, user-facing `label`, optional `locale`, and `direction` (e.g. `rtl`). |
| `chapters[]` | Ordered chapter definitions. Each chapter needs a stable `id`, translated `titles`, optional `description`, and per-language Markdown filenames under `files`. |
| `links[]` | Optional primary navigation links (e.g. GitHub repo, community). |
| `seo.keywords` | Array of keywords joined into the meta keywords tag. |
| `seo.socialImage` | Absolute or relative URL for Open Graph & Twitter cards. |
| `seo.twitter` | Twitter handle (with or without `@`) for card attribution. |

Whenever you modify this file or add new Markdown chapters, rerun `npm run generate:sitemap` so search engines receive the updated canonical links and sitemap.

---

## ✍️ Adding a new language

1. Add an entry to `languages` with a unique `code` (e.g. `fr`), label, locale, and direction.
2. Duplicate the Markdown files from an existing language into `content/<new-code>/` and translate them. Only chapters present in both the config and filesystem will appear.
3. If you want custom UI labels (such as "Contents"), extend `site.contentsLabel` and `site.languageLabel` with the new language code.
4. Run `npm run generate:sitemap` to include the new language in `sitemap.xml` and `robots.txt`.

---

## ➕ Adding a chapter

1. Create Markdown files under each language folder (e.g. `content/en/part-03.md`).
2. Append a new object to the `chapters` array with:
   - `id`: URL-safe identifier (used in query parameters and analytics).
   - `titles`: map of language code to display title.
   - `files`: map of language code to Markdown filename.
   - Optional `description`: shown below the chapter title and reused for meta descriptions.
3. Rerun `npm run generate:sitemap`.

---

## 🔍 SEO checklist

- Set a meaningful `site.baseUrl` that matches your production domain.
- Provide descriptive `site.description` and per-chapter `description` values for richer snippets.
- Supply a `seo.socialImage` (ideal size 1200×630) and ensure the file exists.
- Use descriptive alt text within Markdown images for accessibility and search.
- Keep `robots.txt` and `sitemap.xml` in sync by running `npm run generate:sitemap` whenever content changes.
- Consider uploading the sitemap URL to Google Search Console and Bing Webmaster Tools after deployment.

---

## ♻️ Upgrade & reuse

There are two recommended strategies for using this template in your own projects:

### 1. **Template / fork workflow (recommended)**

- Click **“Use this template”** on GitHub or fork the repository.
- Replace the Markdown and configuration files with your content.
- Pull upstream changes periodically:
  ```bash
  git remote add upstream https://github.com/cholf5/mdbook-multilang-site.git
  git fetch upstream
  git merge upstream/main
  ```
- Resolve any merge conflicts in your Markdown or config, then regenerate the sitemap.

This approach keeps your book self-contained while still allowing you to receive template improvements by merging upstream commits.

### 2. **Git submodule workflow**

- Add this repository as a submodule inside your book project:
  ```bash
  git submodule add https://github.com/cholf5/mdbook-multilang-site.git templates/mdbook-multilang-site
  ```
- Store your Markdown and config alongside the submodule or inside it (if you are comfortable committing inside the submodule).
- When the template updates, run `git submodule update --remote` from your parent repository and re-run `npm run generate:sitemap`.

The submodule route is useful if you manage multiple books from a single monorepo or want to keep template updates isolated.

> Regardless of the strategy, keep your `config/site.config.json` under version control and document any customisations so you can reconcile them when merging upstream changes.

---

## 🧠 Troubleshooting

- **Nothing renders** – check the browser console for JSON parse errors (malformed `site.config.json` is the usual culprit).
- **Chapter missing in one language** – ensure the corresponding Markdown file exists and is referenced in `chapters[].files`.
- **Incorrect canonical URLs** – confirm that `site.baseUrl` includes the full domain and trailing slash, then run `npm run generate:sitemap`.
- **Scripts blocked by CSP** – if you enforce a strict Content Security Policy, self-host `marked.min.js` instead of loading it from the CDN.

---

## 📄 License

MIT License
