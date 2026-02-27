const titleEl = document.getElementById("site-title");
const taglineEl = document.getElementById("site-tagline");
const aboutEl = document.getElementById("about-text");
const highlightsEl = document.getElementById("highlights-list");
const linksEl = document.getElementById("links-list");

loadConfig().catch(() => {
  renderHighlights([]);
  renderLinks([]);
});

async function loadConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) return;
  const config = await res.json();

  titleEl.textContent = String(config.siteTitle || "gagnaux.ca");
  taglineEl.textContent = String(config.tagline || "");
  aboutEl.textContent = String(config.about || "");

  document.title = String(config.siteTitle || "gagnaux.ca");
  renderHighlights(Array.isArray(config.highlights) ? config.highlights : []);
  renderLinks(Array.isArray(config.links) ? config.links : []);
}

function renderHighlights(highlights) {
  if (!highlights.length) {
    highlightsEl.innerHTML = "<li>No highlights configured yet.</li>";
    return;
  }

  highlightsEl.innerHTML = highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderLinks(links) {
  if (!links.length) {
    linksEl.innerHTML = "<li>No links configured yet.</li>";
    return;
  }

  linksEl.innerHTML = links
    .map(
      (item) =>
        `<li><a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(
          item.label
        )}</a></li>`
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return String(value).replaceAll('"', "&quot;");
}
