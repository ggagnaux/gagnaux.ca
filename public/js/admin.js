const loginSection = document.getElementById("login-section");
const loginForm = document.getElementById("login-form");

const dashboard = document.getElementById("dashboard");
const postForm = document.getElementById("post-form");
const postsList = document.getElementById("posts-list");
const formTitle = document.getElementById("form-title");

const uploadBtn = document.getElementById("upload-btn");
const imageInput = document.getElementById("image-input");
const resetBtn = document.getElementById("reset-btn");
const logoutBtn = document.getElementById("logout-btn");
const configForm = document.getElementById("site-config-form");
const cfgSiteTitle = document.getElementById("cfg-site-title");
const cfgTagline = document.getElementById("cfg-tagline");
const cfgBrandImage = document.getElementById("cfg-brand-image");
const cfgBrandImageAlt = document.getElementById("cfg-brand-image-alt");
const cfgAbout = document.getElementById("cfg-about");
const cfgHighlights = document.getElementById("cfg-highlights");
const cfgLightBg = document.getElementById("cfg-light-bg");
const cfgLightSurface = document.getElementById("cfg-light-surface");
const cfgLightText = document.getElementById("cfg-light-text");
const cfgLightMuted = document.getElementById("cfg-light-muted");
const cfgLightBorder = document.getElementById("cfg-light-border");
const cfgLightAccent = document.getElementById("cfg-light-accent");
const cfgLightDanger = document.getElementById("cfg-light-danger");
const cfgLightFieldBg = document.getElementById("cfg-light-field-bg");
const cfgLightBgTop = document.getElementById("cfg-light-bg-top");
const cfgDarkBg = document.getElementById("cfg-dark-bg");
const cfgDarkSurface = document.getElementById("cfg-dark-surface");
const cfgDarkText = document.getElementById("cfg-dark-text");
const cfgDarkMuted = document.getElementById("cfg-dark-muted");
const cfgDarkBorder = document.getElementById("cfg-dark-border");
const cfgDarkAccent = document.getElementById("cfg-dark-accent");
const cfgDarkDanger = document.getElementById("cfg-dark-danger");
const cfgDarkFieldBg = document.getElementById("cfg-dark-field-bg");
const cfgDarkBgTop = document.getElementById("cfg-dark-bg-top");
const resetColorsBtn = document.getElementById("reset-colors-btn");
const projectsEditor = document.getElementById("projects-editor");
const linksEditor = document.getElementById("links-editor");
const addProjectBtn = document.getElementById("add-project-btn");
const removeProjectsBtn = document.getElementById("remove-projects-btn");
const addLinkBtn = document.getElementById("add-link-btn");
const removeLinksBtn = document.getElementById("remove-links-btn");
const resetConfigBtn = document.getElementById("reset-config-btn");
const tabBlogBtn = document.getElementById("tab-blog-btn");
const tabConfigBtn = document.getElementById("tab-config-btn");
const tabBlogPanel = document.getElementById("tab-blog-panel");
const tabConfigPanel = document.getElementById("tab-config-panel");
const confirmOverlay = document.getElementById("confirm-overlay");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
const confirmOkBtn = document.getElementById("confirm-ok-btn");
const toastContainer = document.getElementById("toast-container");

let lastLoadedConfig = null;
let configSaveInFlight = false;
let configSaveQueued = false;
let warnedMissingThemeColors = false;

let draggedProjectRow = null;
let draggedProjectStartIndex = -1;
let draggedLinkRow = null;
let draggedLinkStartIndex = -1;
let confirmResolver = null;
const THEME_COLOR_DEFAULTS = Object.freeze({
  light: Object.freeze({
    bg: "#f6f6f1",
    surface: "#ffffff",
    text: "#1f1f1c",
    muted: "#626258",
    border: "#d7d7cd",
    accent: "#245f4a",
    danger: "#a53030",
    fieldBg: "#ffffff",
    bgTop: "#ecefe5"
  }),
  dark: Object.freeze({
    bg: "#767676",
    surface: "#1d211f",
    text: "#e7ece7",
    muted: "#a8b2ab",
    border: "#646464",
    accent: "#2494b3",
    danger: "#ff8f8f",
    fieldBg: "#101311",
    bgTop: "#1c241f"
  })
});

init().catch(showLogin);
wireProjectsTableDragAndDrop();
wireLinksTableDragAndDrop();
setupConfirmDialog();

async function init() {
  const res = await fetch("/api/admin/session");
  const session = await res.json();
  if (session.authenticated) {
    showDashboard();
    await Promise.all([refreshPosts(), loadConfig()]);
    return;
  }
  showLogin();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const payload = {
    username: formData.get("username"),
    password: formData.get("password")
  };

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    showToast("Invalid username or password.", { type: "error" });
    return;
  }

  loginForm.reset();
  showDashboard();
  await Promise.all([refreshPosts(), loadConfig()]);
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  showLogin();
});

tabBlogBtn.addEventListener("click", () => setAdminTab("blog"));
tabConfigBtn.addEventListener("click", () => setAdminTab("config"));

configForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
  await persistConfig("Config saved.");
});

addProjectBtn.addEventListener("click", () => {
  addProjectTableRow();
  syncRemoveProjectsButtonState();
});

removeProjectsBtn.addEventListener("click", async () => {
  const selectedRows = Array.from(
    projectsEditor.querySelectorAll("input[data-role='project-select']:checked")
  ).map((checkbox) => checkbox.closest("tr[data-project-row]"));

  if (!selectedRows.length) return;
  const confirmed = await openConfirmDialog({
    title: "Remove Projects",
    message: "Remove selected project row(s)?",
    confirmLabel: "Remove"
  });
  if (!confirmed) return;

  selectedRows.forEach((row) => row.remove());
  if (!projectsEditor.querySelector("tr[data-project-row]")) {
    renderProjectsTable([]);
  }
  syncRemoveProjectsButtonState();
  showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
  await persistConfig("Auto-saved.");
});

addLinkBtn.addEventListener("click", () => {
  addLinkTableRow();
  syncRemoveLinksButtonState();
});

removeLinksBtn.addEventListener("click", async () => {
  const selectedRows = Array.from(
    linksEditor.querySelectorAll("input[data-role='link-select']:checked")
  ).map((checkbox) => checkbox.closest("tr[data-link-row]"));

  if (!selectedRows.length) return;
  const confirmed = await openConfirmDialog({
    title: "Remove Links",
    message: "Remove selected link row(s)?",
    confirmLabel: "Remove"
  });
  if (!confirmed) return;

  selectedRows.forEach((row) => row.remove());
  if (!linksEditor.querySelector("tr[data-link-row]")) {
    renderLinksTable([]);
  }
  syncRemoveLinksButtonState();
  showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
  await persistConfig("Auto-saved.");
});

resetConfigBtn.addEventListener("click", () => {
  if (lastLoadedConfig) {
    populateConfigForm(lastLoadedConfig);
    showToast("Form reset.", { type: "info" });
  }
});

if (resetColorsBtn) {
  resetColorsBtn.addEventListener("click", async () => {
    applyThemeColorsToInputs(THEME_COLOR_DEFAULTS);
    showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
    await persistConfig("Colors reset to defaults.");
  });
}

configForm.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== "color") return;

  showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
  await persistConfig("Auto-saved.");
});

projectsEditor.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.dataset.role === "project-select") {
    const row = target.closest("tr[data-project-row]");
    if (row) row.classList.toggle("is-selected", target.checked);
    syncRemoveProjectsButtonState();
  }
});

linksEditor.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.dataset.role === "link-select") {
    const row = target.closest("tr[data-link-row]");
    if (row) row.classList.toggle("is-selected", target.checked);
    syncRemoveLinksButtonState();
  }
});

projectsEditor.addEventListener("focusout", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const role = target.dataset.role || "";
  if (!role.startsWith("project-") || role === "project-select") return;

  const trimmed = target.value.trim();
  const lastValue = target.dataset.lastValue || "";
  target.value = trimmed;
  if (trimmed === lastValue) return;

  target.dataset.lastValue = trimmed;
  showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
  await persistConfig("Auto-saved.");
});

linksEditor.addEventListener("focusout", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const role = target.dataset.role || "";
  if (!role.startsWith("link-") || role === "link-select") return;

  const trimmed = target.value.trim();
  const lastValue = target.dataset.lastValue || "";
  target.value = trimmed;
  if (trimmed === lastValue) return;

  target.dataset.lastValue = trimmed;
  const row = target.closest("tr[data-link-row]");
  if (!row) return;
  const labelValue = row.querySelector("[data-role='link-label']")?.value.trim() || "";
  const urlValue = row.querySelector("[data-role='link-url']")?.value.trim() || "";

  // Avoid auto-saving half-complete rows; otherwise they are filtered out and disappear.
  if (!labelValue || !urlValue) {
    showToast("Link row is incomplete. Fill Label and URL to auto-save.", { type: "warning" });
    return;
  }

  showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
  await persistConfig("Auto-saved.");
});

uploadBtn.addEventListener("click", async () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) {
    showToast("Choose an image first.", { type: "warning" });
    return;
  }

  const uploadData = new FormData();
  uploadData.append("image", file);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: uploadData
  });
  const data = await res.json();

  if (!res.ok) {
    showToast(data.error || "Upload failed.", { type: "error" });
    return;
  }

  const current = postForm.content.value;
  postForm.content.value = `${current}${current.endsWith("\n") ? "" : "\n"}${data.markdown}\n`;
  postForm.coverImage.value = postForm.coverImage.value || data.url;
  imageInput.value = "";
  showToast(`Uploaded ${data.url}`, { type: "success" });
});

resetBtn.addEventListener("click", resetForm);

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showToast("Saving post...", { type: "info", duration: 900, key: "post-saving" });

  const payload = serializeForm();
  const originalSlug = postForm.originalSlug.value;
  const isEdit = Boolean(originalSlug);

  const endpoint = isEdit ? `/api/admin/posts/${encodeURIComponent(originalSlug)}` : "/api/admin/posts";
  const method = isEdit ? "PUT" : "POST";

  const res = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  if (!res.ok) {
    showToast(data.error || "Save failed.", { type: "error" });
    return;
  }

  showToast("Post saved.", { type: "success" });
  resetForm();
  await refreshPosts();
});

async function refreshPosts() {
  const res = await fetch("/api/admin/posts");
  if (!res.ok) {
    showLogin();
    return;
  }

  const posts = await res.json();
  if (!posts.length) {
    postsList.innerHTML = "<p class='muted'>No posts yet.</p>";
    return;
  }

  postsList.innerHTML = posts
    .map(
      (post) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(post.title)}</strong>
            <div class="badges">${escapeHtml(post.date)}${post.draft ? " | Draft" : " | Published"}</div>
          </div>
          <div class="actions">
            <button type="button" data-action="edit" data-slug="${escapeAttribute(post.slug)}">Edit</button>
            <button type="button" class="danger-button" data-action="delete" data-slug="${escapeAttribute(post.slug)}">Delete</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  postsList.querySelectorAll("button[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => editPost(btn.dataset.slug, posts));
  });

  postsList.querySelectorAll("button[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deletePost(btn.dataset.slug));
  });
}

async function loadConfig() {
  const res = await fetch("/api/admin/config");
  if (!res.ok) {
    showToast("Could not load config.", { type: "error" });
    return;
  }

  const config = await res.json();
  lastLoadedConfig = config;
  populateConfigForm(config);
}

function populateConfigForm(config) {
  cfgSiteTitle.value = config.siteTitle || "";
  cfgTagline.value = config.tagline || "";
  cfgBrandImage.value = config.brandImage || "";
  cfgBrandImageAlt.value = config.brandImageAlt || "";
  cfgAbout.value = config.about || "";
  cfgHighlights.value = Array.isArray(config.highlights) ? config.highlights.join("\n") : "";

  applyThemeColorsToInputs(config.themeColors || THEME_COLOR_DEFAULTS);

  renderProjectsTable(Array.isArray(config.projects) ? config.projects : []);
  renderLinksTable(Array.isArray(config.links) ? config.links : []);
}

function renderProjectsTable(projects) {
  if (!projects.length) {
    projectsEditor.innerHTML = `
      <tr>
        <td colspan="5" class="muted small">No projects yet.</td>
      </tr>
    `;
    syncRemoveProjectsButtonState();
    return;
  }

  projectsEditor.innerHTML = projects.map((project) => getProjectRowHtml(project)).join("");
  syncRemoveProjectsButtonState();
}

function addProjectTableRow(project = {}) {
  const hasPlaceholder = projectsEditor.querySelector("tr:not([data-project-row])");
  if (hasPlaceholder) projectsEditor.innerHTML = "";
  projectsEditor.insertAdjacentHTML("beforeend", getProjectRowHtml(project));
}

function getProjectRowHtml(project) {
  const name = String(project?.name || "").trim();
  const description = String(project?.description || "").trim();
  const url = String(project?.url || "").trim();
  return `
    <tr data-project-row>
      <td class="reorder-col">
        <button type="button" class="ghost inline-button project-reorder-handle" data-role="project-drag" draggable="true" aria-label="Drag to reorder row" title="Drag to reorder">↕</button>
      </td>
      <td class="checkbox-col">
        <input type="checkbox" data-role="project-select" />
      </td>
      <td><input data-role="project-name" data-last-value="${escapeAttribute(name)}" value="${escapeAttribute(name)}" /></td>
      <td><input data-role="project-description" data-last-value="${escapeAttribute(description)}" value="${escapeAttribute(description)}" /></td>
      <td><input data-role="project-url" data-last-value="${escapeAttribute(url)}" value="${escapeAttribute(url)}" /></td>
    </tr>
  `;
}

function syncRemoveProjectsButtonState() {
  const rows = projectsEditor.querySelectorAll("tr[data-project-row]").length;
  const selected = projectsEditor.querySelectorAll("input[data-role='project-select']:checked").length;
  const shouldShow = rows > 0 && selected > 0;
  removeProjectsBtn.disabled = !shouldShow;
  removeProjectsBtn.classList.toggle("hidden", !shouldShow);
}

function renderLinksTable(links) {
  if (!links.length) {
    linksEditor.innerHTML = `
      <tr>
        <td colspan="4" class="muted small">No links yet.</td>
      </tr>
    `;
    syncRemoveLinksButtonState();
    return;
  }

  linksEditor.innerHTML = links.map((link) => getLinkRowHtml(link)).join("");
  syncRemoveLinksButtonState();
}

function addLinkTableRow(link = {}) {
  const hasPlaceholder = linksEditor.querySelector("tr:not([data-link-row])");
  if (hasPlaceholder) linksEditor.innerHTML = "";
  linksEditor.insertAdjacentHTML("beforeend", getLinkRowHtml(link));
}

function getLinkRowHtml(link) {
  const label = String(link?.label || "").trim();
  const url = String(link?.url || "").trim();
  return `
    <tr data-link-row>
      <td class="reorder-col">
        <button type="button" class="ghost inline-button project-reorder-handle" data-role="link-drag" draggable="true" aria-label="Drag to reorder row" title="Drag to reorder">↕</button>
      </td>
      <td class="checkbox-col">
        <input type="checkbox" data-role="link-select" />
      </td>
      <td><input data-role="link-label" data-last-value="${escapeAttribute(label)}" value="${escapeAttribute(label)}" /></td>
      <td><input data-role="link-url" data-last-value="${escapeAttribute(url)}" value="${escapeAttribute(url)}" /></td>
    </tr>
  `;
}

function syncRemoveLinksButtonState() {
  const rows = linksEditor.querySelectorAll("tr[data-link-row]").length;
  const selected = linksEditor.querySelectorAll("input[data-role='link-select']:checked").length;
  const shouldShow = rows > 0 && selected > 0;
  removeLinksBtn.disabled = !shouldShow;
  removeLinksBtn.classList.toggle("hidden", !shouldShow);
}

function wireProjectsTableDragAndDrop() {
  projectsEditor.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-role='project-drag']");
    if (!handle) return;

    const row = handle.closest("tr[data-project-row]");
    if (!row) return;

    draggedProjectRow = row;
    draggedProjectStartIndex = getProjectRowIndex(row);
    row.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "project-row-reorder");
    }
  });

  projectsEditor.addEventListener("dragover", (event) => {
    if (!draggedProjectRow) return;
    event.preventDefault();

    const nextRow = getNextProjectRow(event.clientY);
    if (!nextRow) {
      projectsEditor.appendChild(draggedProjectRow);
      return;
    }

    if (nextRow !== draggedProjectRow) {
      projectsEditor.insertBefore(draggedProjectRow, nextRow);
    }
  });

  projectsEditor.addEventListener("drop", async (event) => {
    if (!draggedProjectRow) return;
    event.preventDefault();

    const droppedRow = draggedProjectRow;
    const endIndex = getProjectRowIndex(droppedRow);
    droppedRow.classList.remove("is-dragging");
    draggedProjectRow = null;

    if (draggedProjectStartIndex !== -1 && endIndex !== -1 && draggedProjectStartIndex !== endIndex) {
      showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
      await persistConfig("Auto-saved.");
    }
    draggedProjectStartIndex = -1;
  });

  projectsEditor.addEventListener("dragend", () => {
    if (draggedProjectRow) {
      draggedProjectRow.classList.remove("is-dragging");
      draggedProjectRow = null;
    }
    draggedProjectStartIndex = -1;
  });
}

function wireLinksTableDragAndDrop() {
  linksEditor.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-role='link-drag']");
    if (!handle) return;

    const row = handle.closest("tr[data-link-row]");
    if (!row) return;

    draggedLinkRow = row;
    draggedLinkStartIndex = getLinkRowIndex(row);
    row.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "link-row-reorder");
    }
  });

  linksEditor.addEventListener("dragover", (event) => {
    if (!draggedLinkRow) return;
    event.preventDefault();

    const nextRow = getNextLinkRow(event.clientY);
    if (!nextRow) {
      linksEditor.appendChild(draggedLinkRow);
      return;
    }

    if (nextRow !== draggedLinkRow) {
      linksEditor.insertBefore(draggedLinkRow, nextRow);
    }
  });

  linksEditor.addEventListener("drop", async (event) => {
    if (!draggedLinkRow) return;
    event.preventDefault();

    const droppedRow = draggedLinkRow;
    const endIndex = getLinkRowIndex(droppedRow);
    droppedRow.classList.remove("is-dragging");
    draggedLinkRow = null;

    if (draggedLinkStartIndex !== -1 && endIndex !== -1 && draggedLinkStartIndex !== endIndex) {
      showToast("Saving config...", { type: "info", duration: 900, key: "config-saving" });
      await persistConfig("Auto-saved.");
    }
    draggedLinkStartIndex = -1;
  });

  linksEditor.addEventListener("dragend", () => {
    if (draggedLinkRow) {
      draggedLinkRow.classList.remove("is-dragging");
      draggedLinkRow = null;
    }
    draggedLinkStartIndex = -1;
  });
}

function getNextProjectRow(pointerY) {
  const rows = Array.from(projectsEditor.querySelectorAll("tr[data-project-row]:not(.is-dragging)"));
  let closest = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();
    const offset = pointerY - rect.top - rect.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = row;
    }
  });

  return closest;
}

function getNextLinkRow(pointerY) {
  const rows = Array.from(linksEditor.querySelectorAll("tr[data-link-row]:not(.is-dragging)"));
  let closest = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();
    const offset = pointerY - rect.top - rect.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = row;
    }
  });

  return closest;
}

function getProjectRowIndex(row) {
  const rows = Array.from(projectsEditor.querySelectorAll("tr[data-project-row]"));
  return rows.indexOf(row);
}

function getLinkRowIndex(row) {
  const rows = Array.from(linksEditor.querySelectorAll("tr[data-link-row]"));
  return rows.indexOf(row);
}

function serializeConfigForm() {
  const projects = Array.from(projectsEditor.querySelectorAll("tr[data-project-row]"))
    .map((row) => ({
      name: row.querySelector("[data-role='project-name']").value.trim(),
      description: row.querySelector("[data-role='project-description']").value.trim(),
      url: row.querySelector("[data-role='project-url']").value.trim()
    }))
    .filter((project) => project.name);

  const links = Array.from(linksEditor.querySelectorAll("tr[data-link-row]"))
    .map((row) => ({
      label: row.querySelector("[data-role='link-label']").value.trim(),
      url: row.querySelector("[data-role='link-url']").value.trim()
    }))
    .filter((link) => link.label && link.url);

  const highlights = cfgHighlights.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    siteTitle: cfgSiteTitle.value.trim(),
    brandImage: cfgBrandImage.value.trim(),
    brandImageAlt: cfgBrandImageAlt.value.trim(),
    tagline: cfgTagline.value.trim(),
    about: cfgAbout.value.trim(),
    highlights,
    themeColors: getThemeColorsFromInputs(),
    projects,
    links
  };
}

function applyThemeColorsToInputs(themeColors) {
  const light = { ...THEME_COLOR_DEFAULTS.light, ...(themeColors?.light || {}) };
  const dark = { ...THEME_COLOR_DEFAULTS.dark, ...(themeColors?.dark || {}) };

  cfgLightBg.value = light.bg;
  cfgLightSurface.value = light.surface;
  cfgLightText.value = light.text;
  cfgLightMuted.value = light.muted;
  cfgLightBorder.value = light.border;
  cfgLightAccent.value = light.accent;
  cfgLightDanger.value = light.danger;
  cfgLightFieldBg.value = light.fieldBg;
  cfgLightBgTop.value = light.bgTop;

  cfgDarkBg.value = dark.bg;
  cfgDarkSurface.value = dark.surface;
  cfgDarkText.value = dark.text;
  cfgDarkMuted.value = dark.muted;
  cfgDarkBorder.value = dark.border;
  cfgDarkAccent.value = dark.accent;
  cfgDarkDanger.value = dark.danger;
  cfgDarkFieldBg.value = dark.fieldBg;
  cfgDarkBgTop.value = dark.bgTop;
}

function getThemeColorsFromInputs() {
  return {
    light: {
      bg: cfgLightBg.value,
      surface: cfgLightSurface.value,
      text: cfgLightText.value,
      muted: cfgLightMuted.value,
      border: cfgLightBorder.value,
      accent: cfgLightAccent.value,
      danger: cfgLightDanger.value,
      fieldBg: cfgLightFieldBg.value,
      bgTop: cfgLightBgTop.value
    },
    dark: {
      bg: cfgDarkBg.value,
      surface: cfgDarkSurface.value,
      text: cfgDarkText.value,
      muted: cfgDarkMuted.value,
      border: cfgDarkBorder.value,
      accent: cfgDarkAccent.value,
      danger: cfgDarkDanger.value,
      fieldBg: cfgDarkFieldBg.value,
      bgTop: cfgDarkBgTop.value
    }
  };
}

async function persistConfig(successMessage) {
  if (configSaveInFlight) {
    configSaveQueued = true;
    return;
  }

  configSaveInFlight = true;
  try {
    const parsed = serializeConfigForm();
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Could not save config.", { type: "error" });
      return;
    }

    const serverConfig = data && typeof data.config === "object" && data.config ? data.config : {};
    const mergedConfig = {
      ...serverConfig,
      themeColors:
        serverConfig.themeColors && typeof serverConfig.themeColors === "object"
          ? serverConfig.themeColors
          : parsed.themeColors
    };

    if (!serverConfig.themeColors && !warnedMissingThemeColors) {
      warnedMissingThemeColors = true;
      showToast("Theme colors were not returned by the server response. Using local values.", { type: "warning", duration: 3200 });
    }

    lastLoadedConfig = mergedConfig;
    populateConfigForm(mergedConfig);
    showToast(successMessage, {
      type: "success",
      duration: successMessage === "Auto-saved." ? 1200 : 2200,
      key: successMessage === "Auto-saved." ? "config-autosave" : null
    });
  } finally {
    configSaveInFlight = false;
    if (configSaveQueued) {
      configSaveQueued = false;
      await persistConfig("Auto-saved.");
    }
  }
}

function editPost(slug, posts) {
  const post = posts.find((item) => item.slug === slug);
  if (!post) return;

  postForm.originalSlug.value = post.slug;
  postForm.title.value = post.title;
  postForm.slug.value = post.slug;
  postForm.date.value = post.date;
  postForm.summary.value = post.summary || "";
  postForm.tags.value = Array.isArray(post.tags) ? post.tags.join(", ") : "";
  postForm.coverImage.value = post.coverImage || "";
  postForm.draft.checked = Boolean(post.draft);
  postForm.content.value = post.content || "";

  formTitle.textContent = `Edit: ${post.title}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deletePost(slug) {
  const confirmed = await openConfirmDialog({
    title: "Delete Post",
    message: `Delete '${slug}'?`,
    confirmLabel: "Delete"
  });
  if (!confirmed) return;

  const res = await fetch(`/api/admin/posts/${encodeURIComponent(slug)}`, {
    method: "DELETE"
  });
  const data = await res.json();

  if (!res.ok) {
    showToast(data.error || "Delete failed.", { type: "error" });
    return;
  }

  if (postForm.originalSlug.value === slug) {
    resetForm();
  }
  await refreshPosts();
}

function serializeForm() {
  return {
    title: postForm.title.value.trim(),
    slug: postForm.slug.value.trim(),
    date: postForm.date.value,
    summary: postForm.summary.value.trim(),
    tags: postForm.tags.value,
    coverImage: postForm.coverImage.value.trim(),
    draft: postForm.draft.checked,
    content: postForm.content.value
  };
}

function resetForm() {
  postForm.reset();
  postForm.originalSlug.value = "";
  postForm.date.value = new Date().toISOString().slice(0, 10);
  formTitle.textContent = "New Post";
}

function showLogin() {
  loginSection.classList.remove("hidden");
  dashboard.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  setAdminTab("blog");
  if (!postForm.date.value) postForm.date.value = new Date().toISOString().slice(0, 10);
}

function setAdminTab(tabName) {
  const isBlog = tabName === "blog";
  tabBlogPanel.classList.toggle("hidden", !isBlog);
  tabConfigPanel.classList.toggle("hidden", isBlog);
  tabBlogBtn.setAttribute("aria-selected", String(isBlog));
  tabConfigBtn.setAttribute("aria-selected", String(!isBlog));
}

function showToast(message, { type = "info", duration = 2200, key = null } = {}) {
  if (!toastContainer || !message) return;

  const resolvedKey = key || "";
  let toast = null;
  if (resolvedKey) {
    toast = toastContainer.querySelector(`[data-toast-key="${resolvedKey}"]`);
  }

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    if (resolvedKey) toast.dataset.toastKey = resolvedKey;
    toastContainer.appendChild(toast);
  }

  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

  if (toast.dataset.timerId) {
    window.clearTimeout(Number(toast.dataset.timerId));
  }

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  const hideTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 180);
  }, duration);
  toast.dataset.timerId = String(hideTimeout);
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

function setupConfirmDialog() {
  if (!confirmOverlay || !confirmTitle || !confirmMessage || !confirmCancelBtn || !confirmOkBtn) return;

  confirmCancelBtn.addEventListener("click", () => closeConfirmDialog(false));
  confirmOkBtn.addEventListener("click", () => closeConfirmDialog(true));

  confirmOverlay.addEventListener("click", (event) => {
    if (event.target === confirmOverlay) closeConfirmDialog(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !confirmOverlay.classList.contains("hidden")) {
      closeConfirmDialog(false);
    }
  });
}

function openConfirmDialog({ title, message, confirmLabel }) {
  if (!confirmOverlay || !confirmTitle || !confirmMessage || !confirmCancelBtn || !confirmOkBtn) {
    return Promise.resolve(window.confirm(message || "Are you sure?"));
  }

  if (confirmResolver) {
    confirmResolver(false);
    confirmResolver = null;
  }

  confirmTitle.textContent = title || "Confirm Action";
  confirmMessage.textContent = message || "";
  confirmOkBtn.textContent = confirmLabel || "Confirm";
  confirmOverlay.classList.remove("hidden");
  confirmOkBtn.focus();

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeConfirmDialog(result) {
  if (!confirmOverlay) return;
  confirmOverlay.classList.add("hidden");

  const resolver = confirmResolver;
  confirmResolver = null;
  if (resolver) resolver(Boolean(result));
}
