const state = {
  all: [],
  section: "all",
  query: "",
};

const cardsEl = document.getElementById("cards");
const pillsEl = document.getElementById("sectionPills");
const countEl = document.getElementById("resultCount");
const searchInput = document.getElementById("searchInput");

function parseTsv(text) {
  const lines = text.trim().split("\n");
  lines.shift();
  return lines
    .map((line) => line.split("\t"))
    .filter((parts) => parts.length >= 6)
    .map(([date, section, slug, url, title, description, cover]) => ({
      date,
      section,
      slug,
      url,
      title: title || slug,
      description: description || "",
      cover: cover || "",
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function prettySection(section) {
  return section.replace(/-/g, " ");
}

function filterRows(rows) {
  return rows.filter((row) => {
    if (state.section !== "all" && row.section !== state.section) {
      return false;
    }
    if (!state.query) {
      return true;
    }
    const haystack = `${row.title} ${row.description} ${row.section}`.toLowerCase();
    return haystack.includes(state.query.toLowerCase());
  });
}

function renderPills(rows) {
  const sections = [...new Set(rows.map((row) => row.section))].sort();
  const allPills = ["all", ...sections];
  pillsEl.innerHTML = allPills
    .map((section) => {
      const label = section === "all" ? "todas" : prettySection(section);
      const active = section === state.section ? "active" : "";
      return `<button class="pill ${active}" data-section="${section}">${label}</button>`;
    })
    .join("");

  pillsEl.querySelectorAll(".pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      state.section = pill.dataset.section || "all";
      render();
    });
  });
}

function renderCards(rows) {
  cardsEl.innerHTML = rows
    .slice(0, 120)
    .map((row) => {
      const href = `..${row.url}`;
      const label = prettySection(row.section);
      const date = row.date || "sem data";
      const coverHtml = row.cover
        ? `<img class="card-cover" src="${row.cover}" alt="${row.title}" loading="lazy" onerror="this.onerror=null;this.src='../assets/you.png'">`
        : "";
      return `
        <a class="card" href="${href}">
          ${coverHtml}
          <small>${label} · ${date}</small>
          <h3>${row.title}</h3>
          <p>${row.description}</p>
        </a>
      `;
    })
    .join("");
}

function render() {
  const filtered = filterRows(state.all);
  renderPills(state.all);
  renderCards(filtered);
  countEl.textContent = `${filtered.length} resultados`;
}

searchInput.addEventListener("input", () => {
  state.query = searchInput.value.trim();
  render();
});

fetch("../data/articles.tsv")
  .then((res) => res.text())
  .then((text) => {
    state.all = parseTsv(text);
    render();
  })
  .catch(() => {
    cardsEl.innerHTML = "<p>Não foi possível carregar os artigos.</p>";
  });
