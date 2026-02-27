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

  taglineEl.innerHTML = renderTextWithLinks(config.tagline || "");
  aboutEl.innerHTML = renderTextWithLinks(config.about || "");

  document.title = String(config.siteTitle || "gagnaux.ca");
  renderHighlights(Array.isArray(config.highlights) ? config.highlights : []);
  renderLinks(Array.isArray(config.links) ? config.links : []);
}

function renderHighlights(highlights) {
  if (!highlights.length) {
    highlightsEl.innerHTML = "<li>No highlights configured yet.</li>";
    return;
  }

  highlightsEl.innerHTML = highlights.map((item) => `<li>${renderTextWithLinks(item)}</li>`).join("");
}

function renderLinks(links) {
  if (!links.length) {
    linksEl.innerHTML = "<li>No links configured yet.</li>";
    return;
  }

  linksEl.innerHTML = links
    .map(
      (item) =>
        `<li><a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer"><span class="link-icon" aria-hidden="true">${getLinkIcon(
          item.url
        )}</span>${escapeHtml(item.label)}</a></li>`
    )
    .join("");
}

function getLinkIcon(url) {
  const lowered = String(url || "").toLowerCase();
  if (lowered.includes("github.com")) return "🐙";
  if (lowered.includes("linkedin.com")) return "💼";
  if (lowered.includes("youtube.com") || lowered.includes("youtu.be")) return "▶";
  if (lowered.includes("x.com") || lowered.includes("twitter.com")) return "𝕏";
  if (lowered.includes("instagram.com")) return "📷";
  return "↗";
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

function renderTextWithLinks(input) {
  const text = String(input || "");
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let output = "";
  let cursor = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const label = match[1];
    const rawUrl = match[2];
    const href = normalizeHref(rawUrl);

    output += escapeHtml(text.slice(cursor, match.index));
    if (!href) {
      output += escapeHtml(fullMatch);
    } else if (isExternalHref(href)) {
      output += `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
    } else {
      output += `<a href="${escapeAttribute(href)}">${escapeHtml(label)}</a>`;
    }

    cursor = match.index + fullMatch.length;
  }

  output += escapeHtml(text.slice(cursor));
  return output;
}

function normalizeHref(url) {
  const href = String(url || "").trim();
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("/")) return href;
  return "";
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(href);
}
