const loginSection = document.getElementById("login-section");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

const dashboard = document.getElementById("dashboard");
const postForm = document.getElementById("post-form");
const postsList = document.getElementById("posts-list");
const formStatus = document.getElementById("form-status");
const formTitle = document.getElementById("form-title");

const uploadBtn = document.getElementById("upload-btn");
const imageInput = document.getElementById("image-input");
const resetBtn = document.getElementById("reset-btn");
const logoutBtn = document.getElementById("logout-btn");
const configForm = document.getElementById("site-config-form");
const cfgSiteTitle = document.getElementById("cfg-site-title");
const cfgBrandImage = document.getElementById("cfg-brand-image");
const cfgBrandImageAlt = document.getElementById("cfg-brand-image-alt");
const cfgAbout = document.getElementById("cfg-about");
const cfgHighlights = document.getElementById("cfg-highlights");
const projectsEditor = document.getElementById("projects-editor");
const linksEditor = document.getElementById("links-editor");
const addProjectBtn = document.getElementById("add-project-btn");
const removeProjectsBtn = document.getElementById("remove-projects-btn");
const addLinkBtn = document.getElementById("add-link-btn");
const removeLinksBtn = document.getElementById("remove-links-btn");
const resetConfigBtn = document.getElementById("reset-config-btn");
const configStatus = document.getElementById("config-status");
const tabBlogBtn = document.getElementById("tab-blog-btn");
const tabConfigBtn = document.getElementById("tab-config-btn");
const tabBlogPanel = document.getElementById("tab-blog-panel");
const tabConfigPanel = document.getElementById("tab-config-panel");

let lastLoadedConfig = null;
let configSaveInFlight = false;
let configSaveQueued = false;

let draggedProjectRow = null;
let draggedProjectStartIndex = -1;
let draggedLinkRow = null;
let draggedLinkStartIndex = -1;

init().catch(showLogin);
wireProjectsTableDragAndDrop();
wireLinksTableDragAndDrop();

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
  loginError.textContent = "";

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
    loginError.textContent = "Invalid username or password.";
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
  configStatus.textContent = "Saving config...";
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
  const confirmed = window.confirm("Remove selected project row(s)?");
  if (!confirmed) return;

  selectedRows.forEach((row) => row.remove());
  if (!projectsEditor.querySelector("tr[data-project-row]")) {
    renderProjectsTable([]);
  }
  syncRemoveProjectsButtonState();
  configStatus.textContent = "Saving config...";
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
  const confirmed = window.confirm("Remove selected link row(s)?");
  if (!confirmed) return;

  selectedRows.forEach((row) => row.remove());
  if (!linksEditor.querySelector("tr[data-link-row]")) {
    renderLinksTable([]);
  }
  syncRemoveLinksButtonState();
  configStatus.textContent = "Saving config...";
  await persistConfig("Auto-saved.");
});

resetConfigBtn.addEventListener("click", () => {
  if (lastLoadedConfig) {
    populateConfigForm(lastLoadedConfig);
    configStatus.textContent = "Form reset.";
  }
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
  configStatus.textContent = "Saving config...";
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
    configStatus.textContent = "Link row is incomplete. Fill Label and URL to auto-save.";
    return;
  }

  configStatus.textContent = "Saving config...";
  await persistConfig("Auto-saved.");
});

uploadBtn.addEventListener("click", async () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) {
    formStatus.textContent = "Choose an image first.";
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
    formStatus.textContent = data.error || "Upload failed.";
    return;
  }

  const current = postForm.content.value;
  postForm.content.value = `${current}${current.endsWith("\n") ? "" : "\n"}${data.markdown}\n`;
  postForm.coverImage.value = postForm.coverImage.value || data.url;
  imageInput.value = "";
  formStatus.textContent = `Uploaded ${data.url}`;
});

resetBtn.addEventListener("click", resetForm);

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "Saving...";

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
    formStatus.textContent = data.error || "Save failed.";
    return;
  }

  formStatus.textContent = "Saved.";
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
            <button type="button" class="ghost" data-action="delete" data-slug="${escapeAttribute(post.slug)}">Delete</button>
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
    configStatus.textContent = "Could not load config.";
    return;
  }

  const config = await res.json();
  lastLoadedConfig = config;
  populateConfigForm(config);
  configStatus.textContent = "";
}

function populateConfigForm(config) {
  cfgSiteTitle.value = config.siteTitle || "";
  cfgBrandImage.value = config.brandImage || "";
  cfgBrandImageAlt.value = config.brandImageAlt || "";
  cfgAbout.value = config.about || "";
  cfgHighlights.value = Array.isArray(config.highlights) ? config.highlights.join("\n") : "";

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
      configStatus.textContent = "Saving config...";
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
      configStatus.textContent = "Saving config...";
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
    tagline: String(lastLoadedConfig?.tagline || ""),
    about: cfgAbout.value.trim(),
    highlights,
    projects,
    links
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
      configStatus.textContent = data.error || "Could not save config.";
      return;
    }

    lastLoadedConfig = data.config;
    populateConfigForm(data.config);
    configStatus.textContent = successMessage;
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
  formStatus.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deletePost(slug) {
  if (!window.confirm(`Delete '${slug}'?`)) return;

  const res = await fetch(`/api/admin/posts/${encodeURIComponent(slug)}`, {
    method: "DELETE"
  });
  const data = await res.json();

  if (!res.ok) {
    formStatus.textContent = data.error || "Delete failed.";
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
  formStatus.textContent = "";
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
