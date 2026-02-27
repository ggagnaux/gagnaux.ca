document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".top-menu button[data-href]");
  const currentPath = window.location.pathname.toLowerCase();

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
});
