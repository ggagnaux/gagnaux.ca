document.addEventListener("DOMContentLoaded", () => {
  loadSiteConfig().catch(() => {});
});

async function loadSiteConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) return;
  const config = await res.json();

  const siteTitle = String(config.siteTitle || "gagnaux.ca");
  const brandImage = String(config.brandImage || "/img/greg.jpg");
  const brandImageAlt = String(config.brandImageAlt || siteTitle);

  const titleLink = document.getElementById("site-title");
  if (titleLink) {
    titleLink.setAttribute("aria-label", siteTitle);
    titleLink.setAttribute("title", siteTitle);
  }

  const image = document.getElementById("brand-image");
  if (image) {
    image.setAttribute("src", brandImage);
    image.setAttribute("alt", brandImageAlt);
  }

  const title = document.getElementById("brand-title");
  if (title) {
    title.textContent = formatBrandTitle(siteTitle);
  }
}

function formatBrandTitle(siteTitle) {
  const text = String(siteTitle || "").trim();
  const firstSpace = text.indexOf(" ");
  if (firstSpace === -1) return text;
  return `${text.slice(0, firstSpace)}\n${text.slice(firstSpace + 1)}`;
}
