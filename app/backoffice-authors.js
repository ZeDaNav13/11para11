const STORAGE_KEY = "11para11.backoffice.authors.v1";

const state = {
  authors: [],
  filter: "",
  mode: "create",
};

const formEl = document.getElementById("authorForm");
const authorIdEl = document.getElementById("authorId");
const nameEl = document.getElementById("nameInput");
const slugEl = document.getElementById("slugInput");
const bioEl = document.getElementById("bioInput");
const avatarEl = document.getElementById("avatarInput");
const sectionsEl = document.getElementById("sectionsInput");
const filterEl = document.getElementById("filterInput");
const listEl = document.getElementById("authorList");
const countEl = document.getElementById("authorCount");
const msgEl = document.getElementById("formMessage");
const saveBtnEl = document.getElementById("saveBtn");
const resetBtnEl = document.getElementById("resetBtn");
const publishBtnEl = document.getElementById("publishBtn");
const exportBtnEl = document.getElementById("exportBtn");

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitSections(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseTsv(text) {
  const lines = text.trim().split("\n");
  lines.shift();
  return lines
    .map((line) => line.split("\t"))
    .filter((parts) => parts.length >= 6)
    .map(([date, section, slug, url, title]) => ({ date, section, slug, url, title }));
}

function parseNameFromTitle(title) {
  const raw = String(title || "");
  const match = raw.match(/^(.+?)\s+-\s+/);
  return match ? match[1].trim() : "11para11";
}

function buildAuthorsFromArticles(rows) {
  const bySlug = new Map();

  rows.forEach((row) => {
    const name = parseNameFromTitle(row.title);
    const slug = slugify(name) || "11para11";
    if (!bySlug.has(slug)) {
      bySlug.set(slug, {
        id: slug,
        slug,
        name,
        bio: "",
        avatar: "/assets/you.png",
        article_count: 0,
        section_slugs: [],
      });
    }
    const current = bySlug.get(slug);
    current.article_count += 1;
    if (row.section && !current.section_slugs.includes(row.section)) {
      current.section_slugs.push(row.section);
    }
  });

  return [...bySlug.values()].sort((a, b) => b.article_count - a.article_count);
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.authors, null, 2));
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderList() {
  const filtered = state.authors.filter((author) => {
    if (!state.filter) return true;
    const haystack = `${author.name} ${author.slug} ${(author.section_slugs || []).join(" ")}`.toLowerCase();
    return haystack.includes(state.filter.toLowerCase());
  });

  countEl.textContent = `${filtered.length} autores`;

  listEl.innerHTML = filtered
    .map((author) => {
      const sections = (author.section_slugs || []).join(", ") || "sem secoes";
      return `<article class="author-admin-card">
  <div>
    <h3>${escapeHtml(author.name)}</h3>
    <p class="admin-note">slug: ${escapeHtml(author.slug)}</p>
    <p class="admin-note">${author.article_count || 0} artigos | ${escapeHtml(sections)}</p>
  </div>
  <div class="admin-row">
    <button class="pill js-edit" data-id="${escapeHtml(author.id)}" type="button">Editar</button>
    <button class="pill js-delete" data-id="${escapeHtml(author.id)}" type="button">Apagar</button>
  </div>
</article>`;
    })
    .join("");

  listEl.querySelectorAll(".js-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = state.authors.find((author) => author.id === btn.dataset.id);
      if (!target) return;
      state.mode = "edit";
      authorIdEl.value = target.id;
      nameEl.value = target.name || "";
      slugEl.value = target.slug || "";
      bioEl.value = target.bio || "";
      avatarEl.value = target.avatar || "";
      sectionsEl.value = (target.section_slugs || []).join(", ");
      saveBtnEl.textContent = "Atualizar autor";
      msgEl.textContent = `A editar: ${target.name}`;
    });
  });

  listEl.querySelectorAll(".js-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = state.authors.find((author) => author.id === btn.dataset.id);
      if (!target) return;
      const ok = window.confirm(`Apagar autor ${target.name}?`);
      if (!ok) return;
      state.authors = state.authors.filter((author) => author.id !== target.id);
      saveLocal();
      if (authorIdEl.value === target.id) {
        resetForm();
      }
      msgEl.textContent = `Autor removido: ${target.name}`;
      renderList();
    });
  });
}

function resetForm() {
  state.mode = "create";
  formEl.reset();
  authorIdEl.value = "";
  saveBtnEl.textContent = "Guardar autor";
}

function upsertAuthor() {
  const id = authorIdEl.value || `author-${Date.now()}`;
  const name = nameEl.value.trim();
  const slug = slugify(slugEl.value.trim() || name);
  const bio = bioEl.value.trim();
  const avatar = avatarEl.value.trim() || "/assets/you.png";
  const section_slugs = splitSections(sectionsEl.value);

  if (!name || !slug) {
    msgEl.textContent = "Nome e slug sao obrigatorios.";
    return;
  }

  const duplicate = state.authors.find((author) => author.slug === slug && author.id !== id);
  if (duplicate) {
    msgEl.textContent = `Slug ja usado por ${duplicate.name}.`;
    return;
  }

  const existing = state.authors.find((author) => author.id === id);
  if (existing) {
    existing.name = name;
    existing.slug = slug;
    existing.bio = bio;
    existing.avatar = avatar;
    existing.section_slugs = section_slugs;
  } else {
    state.authors.unshift({
      id,
      name,
      slug,
      bio,
      avatar,
      section_slugs,
      article_count: 0,
    });
  }

  saveLocal();
  msgEl.textContent = `Autor guardado: ${name}`;
  resetForm();
  renderList();
}

function exportJson() {
  const payload = JSON.stringify(state.authors, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "authors.backoffice.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

async function bootstrap() {
  const local = loadLocal();
  if (local.length) {
    state.authors = local;
    renderList();
    return;
  }

  try {
    const res = await fetch("../data/authors.json");
    if (!res.ok) throw new Error("authors json not available");
    const data = await res.json();
    state.authors = (Array.isArray(data) ? data : []).map((author) => ({
      id: author.slug,
      slug: author.slug,
      name: author.name,
      bio: author.bio || "",
      avatar: author.avatar || "/assets/you.png",
      article_count: author.article_count || 0,
      section_slugs: author.section_slugs || [],
    }));
    saveLocal();
    renderList();
    return;
  } catch {
    // fallback to deriving author records from article index
  }

  try {
    const res = await fetch("../data/articles.tsv");
    const text = await res.text();
    state.authors = buildAuthorsFromArticles(parseTsv(text));
    saveLocal();
    renderList();
  } catch {
    msgEl.textContent = "Nao foi possivel carregar os autores.";
  }
}

slugEl.addEventListener("blur", () => {
  slugEl.value = slugify(slugEl.value);
});

nameEl.addEventListener("blur", () => {
  if (!slugEl.value.trim()) {
    slugEl.value = slugify(nameEl.value);
  }
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertAuthor();
});

resetBtnEl.addEventListener("click", () => {
  resetForm();
  msgEl.textContent = "";
});

filterEl.addEventListener("input", () => {
  state.filter = filterEl.value.trim();
  renderList();
});

exportBtnEl.addEventListener("click", exportJson);

if (publishBtnEl) {
  publishBtnEl.addEventListener("click", async () => {
    if (!window.BackofficePublish || !window.BackofficePublish.publishDrafts) {
      msgEl.textContent = "Publicacao indisponivel neste contexto.";
      return;
    }
    publishBtnEl.disabled = true;
    msgEl.textContent = "A publicar drafts...";
    const result = await window.BackofficePublish.publishDrafts();
    msgEl.textContent = result.message;
    publishBtnEl.disabled = false;
  });
}

bootstrap();
