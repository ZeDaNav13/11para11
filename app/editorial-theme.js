(function () {
  const body = document.body;
  if (!body) return;

  const sectionList = document.querySelector(".post_resumes_container");
  const article = document.querySelector(".post_container article");
  if (!sectionList && !article) return;

  body.classList.add("theme-editorial");
  if (sectionList) body.classList.add("theme-section");
  if (article) body.classList.add("theme-article");

  // Make section blocks reliably clickable by reusing data-content-path.
  document.querySelectorAll("[data-content-path]").forEach((el) => {
    const path = el.getAttribute("data-content-path");
    if (!path || !path.startsWith("/")) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      window.location.href = path;
    });
  });

  // Promote article cover into a top hero from og:image.
  if (article && !article.querySelector(".article-hero")) {
    const meta = document.querySelector('meta[property="og:image"]');
    let cover = meta ? meta.getAttribute("content") || "" : "";
    if (!cover || /\/assets\/11_logo\.png/i.test(cover)) {
      const img = article.querySelector(".content img");
      cover = img ? img.getAttribute("src") || "" : "";
    }
    if (cover) {
      const hero = document.createElement("figure");
      hero.className = "article-hero";
      hero.innerHTML = `<img src="${cover}" alt="">`;
      article.insertBefore(hero, article.firstChild);
    }
  }

  // Fallback any missing image to the site logo.
  document.querySelectorAll("img").forEach((img) => {
    if (img.dataset.fallbackBound === "1") return;
    img.dataset.fallbackBound = "1";
    img.addEventListener("error", () => {
      if (img.src.includes("/assets/you.png")) return;
      img.src = "/assets/you.png";
    });
  });
})();
