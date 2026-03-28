(function () {
  const ARTICLE_STORAGE_KEY = "11para11.backoffice.articles.v1";
  const AUTHOR_STORAGE_KEY = "11para11.backoffice.authors.v1";

  function readLocalArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([payload], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  async function writeJsonFile(dirHandle, filename, payload) {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(payload);
    await writable.close();
  }

  async function publishDrafts() {
    const authors = readLocalArray(AUTHOR_STORAGE_KEY);
    const articles = readLocalArray(ARTICLE_STORAGE_KEY);

    const authorsPayload = JSON.stringify(authors, null, 2);
    const articlesPayload = JSON.stringify(articles, null, 2);

    if (!window.showDirectoryPicker) {
      downloadJson("authors.backoffice.json", authorsPayload);
      downloadJson("articles.backoffice.json", articlesPayload);
      return {
        ok: true,
        mode: "download",
        message: "Navegador sem escrita direta. Foram descarregados 2 ficheiros JSON.",
      };
    }

    try {
      const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      await writeJsonFile(dirHandle, "authors.backoffice.json", authorsPayload);
      await writeJsonFile(dirHandle, "articles.backoffice.json", articlesPayload);
      return {
        ok: true,
        mode: "direct-write",
        message:
          "Drafts publicados no diretorio escolhido: authors.backoffice.json e articles.backoffice.json.",
      };
    } catch (error) {
      if (error && error.name === "AbortError") {
        return { ok: false, mode: "cancelled", message: "Publicacao cancelada." };
      }
      return {
        ok: false,
        mode: "error",
        message: `Falha ao publicar drafts: ${error && error.message ? error.message : "erro desconhecido"}`,
      };
    }
  }

  window.BackofficePublish = {
    publishDrafts,
  };
})();
