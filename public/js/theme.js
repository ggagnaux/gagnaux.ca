const STORAGE_KEY = "site-theme";
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "system") {
    if (mediaQuery.matches) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    return;
  }

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    return;
  }

  root.removeAttribute("data-theme");
}

function syncSelector(theme) {
  const select = document.getElementById("theme-select");
  if (select) select.value = theme;
}

function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  syncSelector(theme);
}

const initialTheme = getSavedTheme();
applyTheme(initialTheme);

document.addEventListener("DOMContentLoaded", () => {
  syncSelector(initialTheme);

  const select = document.getElementById("theme-select");
  if (!select) return;

  select.addEventListener("change", () => {
    const value = select.value;
    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value);
    }
  });
});

mediaQuery.addEventListener("change", () => {
  if (getSavedTheme() === "system") {
    applyTheme("system");
  }
});
