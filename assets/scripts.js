(async function initMultilangBook() {
  const config = await fetchJson('config/site.config.json');
  const languages = buildMap(config.languages, (lang) => lang.code);
  const chapters = buildMap(config.chapters, (chapter) => chapter.id);
  const orderedChapterIds = config.chapters.map((chapter) => chapter.id);

  const state = {
    language: resolveLanguage(languages, config.site.defaultLanguage),
    chapterId: orderedChapterIds[0] || null,
  };

  const url = new URL(window.location.href);
  const requestedLanguage = url.searchParams.get('lang');
  const requestedChapter = url.searchParams.get('chapter');

  if (requestedLanguage && languages.has(requestedLanguage)) {
    state.language = requestedLanguage;
  }

  if (requestedChapter && chapters.has(requestedChapter)) {
    state.chapterId = requestedChapter;
  }

  const root = document.documentElement;
  const siteTitleEl = document.getElementById('site-title');
  const siteTaglineEl = document.getElementById('site-tagline');
  const siteLogoEl = document.getElementById('site-logo');
  const navLinksEl = document.getElementById('site-links');
  const languageSwitcherEl = document.getElementById('language-switcher');
  const chapterListEl = document.getElementById('chapter-list');
  const chapterTitleEl = document.getElementById('chapter-title');
  const chapterDescriptionEl = document.getElementById('chapter-description');
  const chapterContentEl = document.getElementById('chapter-content');
  const footerTextEl = document.getElementById('footer-text');
  const chaptersLabelEl = document.getElementById('chapters-label');

  if (siteTitleEl) siteTitleEl.textContent = config.site.title;
  if (siteTaglineEl) siteTaglineEl.textContent = config.site.tagline;
  if (siteLogoEl && config.site.logo) {
    siteLogoEl.src = config.site.logo;
  }

  if (chaptersLabelEl) {
    chaptersLabelEl.textContent = pickLocalizedLabel(
      config.site.contentsLabel,
      state.language,
      'Contents'
    );
  }

  if (footerTextEl) {
    const currentYear = new Date().getFullYear();
    footerTextEl.textContent = config.site.footer.replace('{year}', currentYear.toString());
  }

  renderLinks(config.links || [], navLinksEl);
  renderLanguageSwitcher();
  await setLanguage(state.language);

  async function setLanguage(code) {
    const nextLanguage = resolveLanguage(languages, code);
    state.language = nextLanguage;
    const langMeta = languages.get(state.language);

    if (langMeta) {
      root.lang = langMeta.locale || langMeta.code;
      root.dir = langMeta.direction || 'ltr';
    }

    if (chaptersLabelEl) {
      chaptersLabelEl.textContent = pickLocalizedLabel(
        config.site.contentsLabel,
        state.language,
        chaptersLabelEl.textContent
      );
    }

    renderLanguageSwitcher();

    const fallbackChapterId = findFirstChapterWithLanguage(state.language);
    if (fallbackChapterId) {
      if (!state.chapterId || !chapterHasLanguage(state.chapterId, state.language)) {
        state.chapterId = fallbackChapterId;
      }
    }

    renderChapters();
    await loadChapter(state.chapterId);
  }

  function renderLanguageSwitcher() {
    if (!languageSwitcherEl) return;
    languageSwitcherEl.innerHTML = '';

    const label = document.createElement('span');
    label.className = 'language-switcher-label';
    const labelText = pickLocalizedLabel(config.site.languageLabel, state.language, 'Languages');
    label.textContent = labelText;
    languageSwitcherEl.setAttribute('aria-label', labelText);
    languageSwitcherEl.appendChild(label);

    (config.languages || []).forEach((lang) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'language-button';
      button.textContent = lang.label || lang.code;
      button.setAttribute('aria-pressed', state.language === lang.code ? 'true' : 'false');
      button.setAttribute('aria-current', state.language === lang.code ? 'true' : 'false');
      button.addEventListener('click', () => {
        if (state.language !== lang.code) {
          setLanguage(lang.code);
        }
      });
      languageSwitcherEl.appendChild(button);
    });
  }

  function renderLinks(links, container) {
    if (!container) return;
    container.innerHTML = '';
    links.forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.label;
      a.rel = 'noopener';
      a.target = link.target || '_blank';
      li.appendChild(a);
      container.appendChild(li);
    });
  }

  function renderChapters() {
    if (!chapterListEl) return;
    chapterListEl.innerHTML = '';
    orderedChapterIds.forEach((chapterId) => {
      if (!chapterHasLanguage(chapterId, state.language)) {
        return;
      }
      const chapter = chapters.get(chapterId);
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chapter-button';
      button.textContent = pickLocalizedLabel(chapter.titles, state.language, chapterId);
      button.setAttribute('aria-current', state.chapterId === chapterId ? 'true' : 'false');
      button.addEventListener('click', async () => {
        if (state.chapterId !== chapterId) {
          state.chapterId = chapterId;
          updateUrl();
          updateCanonical();
          await loadChapter(chapterId);
          renderChapters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      li.appendChild(button);
      chapterListEl.appendChild(li);
    });
  }

  function chapterHasLanguage(chapterId, languageCode) {
    const chapter = chapters.get(chapterId);
    if (!chapter) return false;
    return Boolean(chapter.files && chapter.files[languageCode]);
  }

  function findFirstChapterWithLanguage(languageCode) {
    return orderedChapterIds.find((chapterId) => chapterHasLanguage(chapterId, languageCode)) || null;
  }

  async function loadChapter(chapterId) {
    const chapter = chapters.get(chapterId);
    if (!chapter) {
      chapterTitleEl.textContent = '';
      chapterDescriptionEl.textContent = '';
      chapterContentEl.innerHTML = '<p>No chapter selected.</p>';
      return;
    }

    const title = pickLocalizedLabel(chapter.titles, state.language, chapterId);
    const description = chapter.description || config.site.description;
    const fileName = chapter.files?.[state.language];

    if (!fileName) {
      chapterTitleEl.textContent = title;
      chapterDescriptionEl.textContent = description;
      chapterContentEl.innerHTML = '<p>This chapter is not available in the selected language yet.</p>';
      return;
    }

    chapterTitleEl.textContent = title;
    chapterDescriptionEl.textContent = description;

    const path = `content/${state.language}/${fileName}`;
    try {
      const markdown = await fetchText(path);
      const html = marked.parse(markdown, { mangle: false, headerIds: true });
      chapterContentEl.innerHTML = html;
      enhanceExternalLinks(chapterContentEl);
    } catch (error) {
      chapterContentEl.innerHTML = `<p class="error">Failed to load <code>${path}</code>: ${error.message}</p>`;
    }

    updateMeta(title, description);
    updateUrl();
    updateCanonical();
    updateStructuredData(title, description);
    renderAlternateLinks();
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', state.language);
    url.searchParams.set('chapter', state.chapterId);
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function updateCanonical() {
    const canonicalLink = getOrCreateLink('canonical');
    canonicalLink.setAttribute('href', buildPageUrl(state.language, state.chapterId));
  }

  function renderAlternateLinks() {
    removeExistingAlternateLinks();
    (config.languages || []).forEach((lang) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang.locale || lang.code;
      link.href = buildPageUrl(lang.code, state.chapterId);
      document.head.appendChild(link);
    });
  }

  function removeExistingAlternateLinks() {
    document.querySelectorAll('link[rel="alternate"]').forEach((link) => {
      link.remove();
    });
  }

  function updateMeta(title, description) {
    document.title = `${title} · ${config.site.title}`;
    setMeta('description', description);
    const keywords = (config.seo?.keywords || []).join(', ');
    if (keywords) {
      setMeta('keywords', keywords);
    }
    setPropertyMeta('og:title', title);
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:type', 'book');
    const socialImage = config.seo?.socialImage;
    if (socialImage) {
      setPropertyMeta('og:image', resolveAssetUrl(socialImage));
      setNameMeta('twitter:image', resolveAssetUrl(socialImage));
    }
    setNameMeta('twitter:card', 'summary_large_image');
    setNameMeta('twitter:title', title);
    setNameMeta('twitter:description', description);
    if (config.seo?.twitter) {
      setNameMeta('twitter:creator', config.seo.twitter);
      setNameMeta('twitter:site', config.seo.twitter);
    }
  }

  function updateStructuredData(title, description) {
    const script = document.getElementById('structured-data');
    if (!script) return;
    const payload = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: title,
      inLanguage: config.languages.map((lang) => lang.locale || lang.code),
      url: buildPageUrl(state.language, state.chapterId),
      author: {
        '@type': 'Person',
        name: config.site.author,
      },
      description,
    };
    script.textContent = JSON.stringify(payload, null, 2);
  }

  function buildPageUrl(languageCode, chapterId) {
    const base = config.site.baseUrl || window.location.href;
    try {
      const url = new URL(base);
      url.searchParams.set('lang', languageCode);
      if (chapterId) {
        url.searchParams.set('chapter', chapterId);
      }
      return url.toString();
    } catch (error) {
      const query = new URLSearchParams({ lang: languageCode, chapter: chapterId }).toString();
      return `${base.replace(/[#?].*$/, '')}?${query}`;
    }
  }

  function setMeta(name, content) {
    const meta = getOrCreateMeta(`meta[name="${name}"]`, { name });
    meta.setAttribute('content', content);
  }

  function setNameMeta(name, content) {
    const meta = getOrCreateMeta(`meta[name="${name}"]`, { name });
    meta.setAttribute('content', content);
  }

  function setPropertyMeta(property, content) {
    const meta = getOrCreateMeta(`meta[property="${property}"]`, { property });
    meta.setAttribute('content', content);
  }

  function getOrCreateMeta(selector, attributes) {
    let meta = document.head.querySelector(selector);
    if (!meta) {
      meta = document.createElement('meta');
      Object.entries(attributes).forEach(([key, value]) => meta.setAttribute(key, value));
      document.head.appendChild(meta);
    }
    return meta;
  }

  function getOrCreateLink(rel) {
    let link = document.head.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }
    return link;
  }

  function pickLocalizedLabel(map, languageCode, fallback) {
    if (!map) return fallback;
    return map[languageCode] || map.default || fallback;
  }

  function resolveLanguage(map, requested) {
    if (requested && map.has(requested)) {
      return requested;
    }
    return map.keys().next().value;
  }

  function buildMap(list, keySelector) {
    const map = new Map();
    (list || []).forEach((item) => {
      const key = keySelector(item);
      if (key) {
        map.set(key, item);
      }
    });
    return map;
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return response.json();
  }

  async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  function enhanceExternalLinks(container) {
    if (!container) return;
    container.querySelectorAll('a[href^="http"]').forEach((anchor) => {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    });
  }

  function resolveAssetUrl(path) {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const baseUrl = config.site.baseUrl || window.location.origin + window.location.pathname;
    try {
      const url = new URL(path, baseUrl);
      return url.toString();
    } catch (error) {
      return path;
    }
  }
})();
