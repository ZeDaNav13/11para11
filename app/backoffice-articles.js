const ARTICLE_STORAGE_KEY = "11para11.backoffice.articles.v1";
const AUTHOR_STORAGE_KEY = "11para11.backoffice.authors.v1";

const state = {
  articles: [],
  authors: [],
  filter: "",
  statusFilter: "",
  knownSections: [],
};

const formEl = document.getElementById("articleForm");
const articleIdEl = document.getElementById("articleId");
const titleEl = document.getElementById("titleInput");
const dateEl = document.getElementById("dateInput");
const sectionEl = document.getElementById("sectionInput");
const authorEl = document.getElementById("authorSelect");
const slugEl = document.getElementById("slugInput");
const statusEl = document.getElementById("statusSelect");
const descriptionEl = document.getElementById("descriptionInput");
const coverEl = document.getElementById("coverInput");
const bodyEl = document.getElementById("bodyInput");
const urlPreviewEl = document.getElementById("urlPreview");
const validateBtnEl = document.getElementById("validateBtn");
const validationSummaryEl = document.getElementById("validationSummary");
const validationListEl = document.getElementById("validationList");
const filterEl = document.getElementById("filterInput");
const statusFilterEl = document.getElementById("statusFilter");
const countEl = document.getElementById("articleCount");
const listEl = document.getElementById("articleList");
const msgEl = document.getElementById("formMessage");
const saveBtnEl = document.getElementById("saveBtn");
const resetBtnEl = document.getElementById("resetBtn");
const publishBtnEl = document.getElementById("publishBtn");
const exportBtnEl = document.getElementById("exportBtn");
const ALLOWED_STATUS = new Set(["draft", "review", "published"]);

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseTsv(text) {
  const lines = text.trim().split("\n");
  lines.shift();
  return lines
    .map((line) => line.split("\t"))
    .filter((parts) => parts.length >= 7)
    .map(([date, section, slug, url, title, description, cover]) => ({
      id: `${section}/${slug}`,
      date,
      section_slug: section,
      slug,
      url,
      title: title || slug,
      description: description || "",
      cover: cover || "/assets/you.png",
      body_html: "",
      author_slug: "",
      author_name: "",
      status: "published",
    }));
}

function parseAuthorFromTitle(title) {
  const raw = String(title || "");
  const match = raw.match(/^(.+?)\s+-\s+/);
  if (!match) return { name: "11para11", slug: "11para11", cleanTitle: raw };
  const authorName = match[1].trim();
  return {
    name: authorName,
    slug: slugify(authorName) || "11para11",
    cleanTitle: raw.replace(/^(.+?)\s+-\s+/, "").trim(),
  };
}

function loadLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal() {
  localStorage.setItem(ARTICLE_STORAGE_KEY, JSON.stringify(state.articles, null, 2));
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveAuthorName(slug) {
  const author = state.authors.find((item) => item.slug === slug);
  return author ? author.name : slug || "11para11";
}

function normalizeStatus(value, fallback = "draft") {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_STATUS.has(normalized) ? normalized : fallback;
}

function normalizeArticleRecord(article, fallbackStatus = "draft") {
  return {
    ...article,
    status: normalizeStatus(article.status, fallbackStatus),
  };
}

function clearValidationUi() {
  validationSummaryEl.textContent = "";
  validationListEl.innerHTML = "";
}

function renderValidation(messages) {
  if (!messages.length) {
    validationSummaryEl.textContent = "Validacao sem erros.";
    validationListEl.innerHTML = "";
    return;
  }
  validationSummaryEl.textContent = `${messages.length} erro(s) de validacao.`;
  validationListEl.innerHTML = messages.map((m) => `<li>${escapeHtml(m)}</li>`).join("");
}

function validateArticleRecord(article, currentId = "", options = {}) {
  const { enforceContent = true } = options;
  const errors = [];
  const title = String(article.title || "").trim();
  const sectionSlug = slugify(article.section_slug || "");
  const date = String(article.date || "").trim();
  const slug = slugify(article.slug || "");
  const cover = String(article.cover || "").trim();
  const body = String(article.body_html || "").trim();
  const url = buildArticleUrl(sectionSlug, date, slug);

  if (!title) errors.push("Titulo em falta.");
  if (!sectionSlug) errors.push("Secao em falta.");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("Data invalida (usar YYYY-MM-DD).");
  if (!slug) errors.push("Slug em falta.");
  if (enforceContent && !cover) errors.push("Cover em falta.");
  if (enforceContent && !body) errors.push("Corpo HTML em falta.");

  if (sectionSlug && state.knownSections.length && !state.knownSections.includes(sectionSlug)) {
    errors.push(`Secao desconhecida: ${sectionSlug}.`);
  }

  if (url) {
    const duplicate = state.articles.find((item) => item.url === url && item.id !== currentId);
    if (duplicate) {
      errors.push(`URL em conflito com "${duplicate.title}": ${url}`);
    }
  }

  return { errors, url };
}

function validateFormDraft() {
  const id = articleIdEl.value || "";
  const candidate = {
    title: titleEl.value.trim(),
    date: dateEl.value.trim(),
    section_slug: slugify(sectionEl.value),
    slug: slugify(slugEl.value || titleEl.value),
    cover: coverEl.value.trim(),
    body_html: bodyEl.value.trim(),
  };
  const { errors } = validateArticleRecord(candidate, id, { enforceContent: true });
  renderValidation(errors);
  return errors;
}

function validateAllDraftsForPublish() {
  const errors = [];
  for (const article of state.articles) {
    const shouldEnforceContent = normalizeStatus(article.status, "draft") !== "published";
    const { errors: itemErrors } = validateArticleRecord(article, article.id, {
      enforceContent: shouldEnforceContent,
    });
    itemErrors.forEach((msg) => errors.push(`[${article.id}] ${msg}`));
  }
  return errors;
}

function buildArticleUrl(section, date, slug) {
  if (!section || !slug) return "";
  if (date) return `/${section}/${date}-${slug}.html`;
  return `/${section}/${slug}.html`;
}

function renderAuthorOptions() {
  const options = state.authors.length ? state.authors : [{ slug: "11para11", name: "11para11" }];
  authorEl.innerHTML = options
    .map((author) => `<option value="${escapeHtml(author.slug)}">${escapeHtml(author.name)}</option>`)
    .join("");
}

function refreshUrlPreview() {
  const section = slugify(sectionEl.value) || sectionEl.value.trim();
  const slug = slugify(slugEl.value);
  const url = buildArticleUrl(section, dateEl.value, slug);
  urlPreviewEl.textContent = url ? `URL final: ${url}` : "URL final: -";
}

function resetForm() {
  formEl.reset();
  articleIdEl.value = "";
  saveBtnEl.textContent = "Guardar artigo";
  statusEl.value = "draft";
  clearValidationUi();
  if (state.authors[0]) {
    authorEl.value = state.authors[0].slug;
  }
  refreshUrlPreview();
}

function renderList() {
  const filtered = state.articles.filter((article) => {
    if (state.statusFilter && article.status !== state.statusFilter) return false;
    if (!state.filter) return true;
    const haystack = `${article.title} ${article.section_slug} ${article.author_name} ${article.date} ${article.status}`.toLowerCase();
    return haystack.includes(state.filter.toLowerCase());
  });

  countEl.textContent = `${filtered.length} artigos`;

  listEl.innerHTML = filtered
    .slice(0, 300)
    .map((article) => `<article class="article-admin-card">
  <div>
    <h3>${escapeHtml(article.title)}</h3>
    <p class="admin-note">${escapeHtml(article.section_slug)} | ${escapeHtml(article.date || "sem data")}</p>
    <p class="admin-note">autor: ${escapeHtml(article.author_name || "11para11")}</p>
    <p class="admin-note">estado: <strong>${escapeHtml(normalizeStatus(article.status, "draft"))}</strong></p>
    <p class="admin-note">${escapeHtml(article.url || "")}</p>
  </div>
  <div class="admin-row">
    <button class="pill js-edit" data-id="${escapeHtml(article.id)}" type="button">Editar</button>
    <button class="pill js-delete" data-id="${escapeHtml(article.id)}" type="button">Apagar</button>
  </div>
</article>`)
    .join("");

  listEl.querySelectorAll(".js-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = state.articles.find((article) => article.id === btn.dataset.id);
      if (!item) return;
      articleIdEl.value = item.id;
      titleEl.value = item.title || "";
      dateEl.value = item.date || "";
      sectionEl.value = item.section_slug || "";
      slugEl.value = item.slug || "";
      descriptionEl.value = item.description || "";
      coverEl.value = item.cover || "";
      bodyEl.value = item.body_html || "";
      authorEl.value = item.author_slug || "";
      statusEl.value = normalizeStatus(item.status, "draft");
      saveBtnEl.textContent = "Atualizar artigo";
      msgEl.textContent = `A editar: ${item.title}`;
      clearValidationUi();
      refreshUrlPreview();
    });
  });

  listEl.querySelectorAll(".js-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = state.articles.find((article) => article.id === btn.dataset.id);
      if (!item) return;
      if (!window.confirm(`Apagar artigo ${item.title}?`)) return;
      state.articles = state.articles.filter((article) => article.id !== item.id);
      saveLocal();
      if (articleIdEl.value === item.id) {
        resetForm();
      }
      msgEl.textContent = `Artigo removido: ${item.title}`;
      renderList();
    });
  });
}

function upsertArticle() {
  const date = dateEl.value.trim();
  const sectionSlug = slugify(sectionEl.value);
  const title = titleEl.value.trim();
  const slug = slugify(slugEl.value || title);
  const authorSlug = authorEl.value || "11para11";
  const authorName = resolveAuthorName(authorSlug);
  const status = normalizeStatus(statusEl.value, "draft");

  if (!title || !sectionSlug || !slug) {
    msgEl.textContent = "Titulo, secao e slug sao obrigatorios.";
    return;
  }

  const url = buildArticleUrl(sectionSlug, date, slug);
  const id = articleIdEl.value || `${sectionSlug}/${date || "draft"}-${slug}-${Date.now()}`;
  const duplicate = state.articles.find((article) => article.url === url && article.id !== id);
  if (duplicate) {
    msgEl.textContent = `URL ja usada por: ${duplicate.title}`;
    return;
  }

  const draft = {
    id,
    title,
    date,
    section_slug: sectionSlug,
    slug,
    url,
    author_slug: authorSlug,
    author_name: authorName,
    status,
    description: descriptionEl.value.trim(),
    cover: coverEl.value.trim() || "/assets/you.png",
    body_html: bodyEl.value.trim(),
  };

  const { errors } = validateArticleRecord(draft, id, { enforceContent: true });
  if (errors.length) {
    renderValidation(errors);
    msgEl.textContent = "Corrige os erros de validacao antes de guardar.";
    return;
  }

  const existing = state.articles.find((article) => article.id === id);
  if (existing) {
    Object.assign(existing, draft);
  } else {
    state.articles.unshift(draft);
  }

  saveLocal();
  clearValidationUi();
  msgEl.textContent = `Artigo guardado: ${title}`;
  resetForm();
  renderList();
}

function exportJson() {
  const payload = JSON.stringify(state.articles, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "articles.backoffice.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

function normalizeSeedArticles(rows) {
  return rows.map((row) => {
    const parsed = parseAuthorFromTitle(row.title);
    return normalizeArticleRecord({
      ...row,
      title: parsed.cleanTitle || row.title,
      author_name: parsed.name,
      author_slug: parsed.slug,
      status: "published",
    }, "published");
  });
}

async function loadAuthors() {
  const local = loadLocal(AUTHOR_STORAGE_KEY);
  if (local.length) {
    state.authors = local.map((author) => ({ slug: author.slug, name: author.name }));
    return;
  }

  try {
    const res = await fetch("../data/authors.json");
    if (!res.ok) throw new Error("authors unavailable");
    const data = await res.json();
    state.authors = (Array.isArray(data) ? data : []).map((author) => ({ slug: author.slug, name: author.name }));
  } catch {
    state.authors = [{ slug: "11para11", name: "11para11" }];
  }
}

async function loadArticles() {
  const local = loadLocal(ARTICLE_STORAGE_KEY);
  if (local.length) {
    state.articles = local.map((article) => normalizeArticleRecord(article, "draft"));
    return;
  }

  try {
    const res = await fetch("../data/articles.tsv");
    const text = await res.text();
    state.articles = normalizeSeedArticles(parseTsv(text));
    saveLocal();
  } catch {
    msgEl.textContent = "Nao foi possivel carregar os artigos.";
  }
}

async function loadKnownSections() {
  try {
    const res = await fetch("../data/articles.tsv");
    if (!res.ok) throw new Error("articles unavailable");
    const text = await res.text();
    const rows = parseTsv(text);
    state.knownSections = [...new Set(rows.map((row) => slugify(row.section_slug)).filter(Boolean))].sort();
  } catch {
    state.knownSections = [...new Set(state.articles.map((a) => slugify(a.section_slug)).filter(Boolean))].sort();
  }
}

titleEl.addEventListener("blur", () => {
  if (!slugEl.value.trim()) {
    slugEl.value = slugify(titleEl.value);
  }
  refreshUrlPreview();
});

slugEl.addEventListener("input", refreshUrlPreview);
dateEl.addEventListener("input", refreshUrlPreview);
sectionEl.addEventListener("input", refreshUrlPreview);

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertArticle();
});

validateBtnEl.addEventListener("click", () => {
  const errors = validateFormDraft();
  msgEl.textContent = errors.length
    ? "Validacao com erros. Corrige antes de guardar/publicar."
    : "Validacao concluida sem erros.";
});

resetBtnEl.addEventListener("click", () => {
  msgEl.textContent = "";
  resetForm();
});

filterEl.addEventListener("input", () => {
  state.filter = filterEl.value.trim();
  renderList();
});

statusFilterEl.addEventListener("change", () => {
  state.statusFilter = normalizeStatus(statusFilterEl.value, "");
  if (!statusFilterEl.value) state.statusFilter = "";
  renderList();
});

exportBtnEl.addEventListener("click", exportJson);

if (publishBtnEl) {
  publishBtnEl.addEventListener("click", async () => {
    if (!window.BackofficePublish || !window.BackofficePublish.publishDrafts) {
      msgEl.textContent = "Publicacao indisponivel neste contexto.";
      return;
    }
    const errors = validateAllDraftsForPublish();
    if (errors.length) {
      renderValidation(errors.slice(0, 25));
      msgEl.textContent = `Publicacao bloqueada: ${errors.length} erro(s) de validacao nos drafts.`;
      return;
    }
    publishBtnEl.disabled = true;
    msgEl.textContent = "A publicar drafts...";
    const result = await window.BackofficePublish.publishDrafts();
    msgEl.textContent = result.message;
    publishBtnEl.disabled = false;
  });
}

async function bootstrap() {
  await loadAuthors();
  renderAuthorOptions();
  await loadArticles();
  await loadKnownSections();
  resetForm();
  renderList();
}

bootstrap();
