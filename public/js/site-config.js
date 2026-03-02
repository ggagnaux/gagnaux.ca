document.addEventListener("DOMContentLoaded", () => {
  loadSiteConfig().catch(() => {});
});

async function loadSiteConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) return;
  const config = await res.json();
  applyThemeColors(config.themeColors);

  const siteTitle = String(config.siteTitle || "gagnaux.ca");
  const tagline = String(config.tagline || "Software Engineer | .NET Specialist | Creative Technologist");
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

  const subtitle = document.getElementById("brand-subtitle");
  if (subtitle) {
    subtitle.textContent = tagline;
  }
}

function applyThemeColors(themeColors) {
  if (!themeColors || typeof themeColors !== "object") return;

  const styleId = "site-theme-colors";
  let styleElement = document.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  const light = themeColors.light || {};
  const dark = themeColors.dark || {};
  const toVarBlock = (values) =>
    [
      ["--bg", values.bg],
      ["--surface", values.surface],
      ["--text", values.text],
      ["--muted", values.muted],
      ["--border", values.border],
      ["--accent", values.accent],
      ["--danger", values.danger],
      ["--field-bg", values.fieldBg],
      ["--bg-top", values.bgTop]
    ]
      .filter(([, value]) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim()))
      .map(([name, value]) => `  ${name}: ${value.trim().toLowerCase()};`)
      .join("\n");

  const lightVars = toVarBlock(light);
  const darkVars = toVarBlock(dark);
  styleElement.textContent = `${lightVars ? `:root {\n${lightVars}\n}\n` : ""}${
    darkVars ? `:root[data-theme="dark"] {\n${darkVars}\n}\n` : ""
  }`;
}

function formatBrandTitle(siteTitle) {
  return String(siteTitle || "").trim();
}
