document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".top-menu button[data-href]");
  const nav = document.querySelector(".top-nav");
  const currentPath = window.location.pathname.toLowerCase();
  const compactEnterThreshold = 48;
  const compactExitThreshold = 24;
  let isCompact = false;

  function updateNavOffsetHeight() {
    if (!nav) return;
    const wasCompact = document.body.classList.contains("nav-compact");
    document.body.classList.remove("nav-compact");
    const expandedHeight = nav.offsetHeight;
    document.documentElement.style.setProperty("--nav-height", `${expandedHeight}px`);
    if (wasCompact) {
      document.body.classList.add("nav-compact");
    }
  }

  function syncNavCompactState() {
    const y = window.scrollY;
    if (!isCompact && y >= compactEnterThreshold) {
      isCompact = true;
      document.body.classList.add("nav-compact");
      return;
    }

    if (isCompact && y <= compactExitThreshold) {
      isCompact = false;
      document.body.classList.remove("nav-compact");
    }
  }

  buttons.forEach((button) => {
    const href = String(button.getAttribute("data-href") || "");
    const normalizedHref = href.toLowerCase();

    if (normalizedHref === currentPath) {
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", () => {
      if (href) {
        window.location.href = href;
      }
    });
  });

  window.addEventListener("scroll", syncNavCompactState, { passive: true });
  window.addEventListener("resize", () => {
    updateNavOffsetHeight();
    syncNavCompactState();
  });
  updateNavOffsetHeight();
  isCompact = document.body.classList.contains("nav-compact");
  syncNavCompactState();
});
