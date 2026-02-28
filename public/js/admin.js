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
const cfgTagline = document.getElementById("cfg-tagline");
const cfgAbout = document.getElementById("cfg-about");
const cfgHighlights = document.getElementById("cfg-highlights");
const projectsEditor = document.getElementById("projects-editor");
const linksEditor = document.getElementById("links-editor");
const addProjectBtn = document.getElementById("add-project-btn");
const addLinkBtn = document.getElementById("add-link-btn");
const saveConfigBtn = document.getElementById("save-config-btn");
const resetConfigBtn = document.getElementById("reset-config-btn");
const configStatus = document.getElementById("config-status");
const tabBlogBtn = document.getElementById("tab-blog-btn");
const tabConfigBtn = document.getElementById("tab-config-btn");
const tabBlogPanel = document.getElementById("tab-blog-panel");
const tabConfigPanel = document.getElementById("tab-config-panel");
let lastLoadedConfig = null;
let draggedConfigRow = null;

init().catch(showLogin);
wireConfigDragAndDrop(projectsEditor);
wireConfigDragAndDrop(linksEditor);

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
  configStatus.textContent = "Config saved.";
});

addProjectBtn.addEventListener("click", () => {
  addProjectRow();
});

addLinkBtn.addEventListener("click", () => {
  addLinkRow();
});

resetConfigBtn.addEventListener("click", () => {
  if (lastLoadedConfig) {
    populateConfigForm(lastLoadedConfig);
    configStatus.textContent = "Form reset.";
  }
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
  cfgTagline.value = config.tagline || "";
  cfgAbout.value = config.about || "";
  cfgHighlights.value = Array.isArray(config.highlights) ? config.highlights.join("\n") : "";

  projectsEditor.innerHTML = "";
  const projects = Array.isArray(config.projects) && config.projects.length ? config.projects : [{}];
  projects.forEach((project) => {
    addProjectRow(project);
  });

  linksEditor.innerHTML = "";
  const links = Array.isArray(config.links) && config.links.length ? config.links : [{}];
  links.forEach((link) => {
    addLinkRow(link);
  });
}

function addProjectRow(project = {}) {
  const row = document.createElement("div");
  row.className = "config-row";
  row.innerHTML = `
    <label>Project Name<input data-role="project-name" value="${escapeAttribute(project.name || "")}" /></label>
    <label>Project Description<input data-role="project-description" value="${escapeAttribute(project.description || "")}" /></label>
    <label>Project URL<input data-role="project-url" value="${escapeAttribute(project.url || "")}" /></label>
    <div class="config-row-actions">
      <button type="button" class="ghost inline-button drag-handle" data-action="drag-row" draggable="true" aria-label="Drag to reorder">Reorder</button>
      <button type="button" class="ghost inline-button" data-action="remove-row" data-item-type="project">Remove</button>
    </div>
  `;
  projectsEditor.appendChild(row);
  bindRemoveButton(row);
}

function addLinkRow(link = {}) {
  const row = document.createElement("div");
  row.className = "config-row";
  row.innerHTML = `
    <label>Link Label<input data-role="link-label" value="${escapeAttribute(link.label || "")}" /></label>
    <label>Link URL<input data-role="link-url" value="${escapeAttribute(link.url || "")}" /></label>
    <div class="config-row-actions">
      <button type="button" class="ghost inline-button drag-handle" data-action="drag-row" draggable="true" aria-label="Drag to reorder">Reorder</button>
      <button type="button" class="ghost inline-button" data-action="remove-row" data-item-type="link">Remove</button>
    </div>
  `;
  linksEditor.appendChild(row);
  bindRemoveButton(row);
}

function bindRemoveButton(row) {
  const removeBtn = row.querySelector("[data-action='remove-row']");
  removeBtn.addEventListener("click", () => {
    const itemType = removeBtn.dataset.itemType === "link" ? "link" : "project";
    const confirmed = window.confirm(`Remove this ${itemType} item?`);
    if (!confirmed) return;
    row.remove();
  });
}

function wireConfigDragAndDrop(container) {
  container.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-action='drag-row']");
    if (!handle) return;

    const row = handle.closest(".config-row");
    if (!row) return;

    draggedConfigRow = row;
    row.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "reorder-row");
    }
  });

  container.addEventListener("dragend", () => {
    if (draggedConfigRow) {
      draggedConfigRow.classList.remove("is-dragging");
      draggedConfigRow = null;
    }
  });

  container.addEventListener("dragover", (event) => {
    if (!draggedConfigRow) return;
    event.preventDefault();

    const nextRow = getDragNextRow(container, event.clientY);
    if (!nextRow) {
      container.appendChild(draggedConfigRow);
      return;
    }

    if (nextRow !== draggedConfigRow) {
      container.insertBefore(draggedConfigRow, nextRow);
    }
  });

  container.addEventListener("drop", (event) => {
    if (!draggedConfigRow) return;
    event.preventDefault();
    draggedConfigRow.classList.remove("is-dragging");
    draggedConfigRow = null;
  });
}

function getDragNextRow(container, y) {
  const rows = Array.from(container.querySelectorAll(".config-row:not(.is-dragging)"));
  let bestOffset = Number.NEGATIVE_INFINITY;
  let bestRow = null;

  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();
    const offset = y - rect.top - rect.height / 2;
    if (offset < 0 && offset > bestOffset) {
      bestOffset = offset;
      bestRow = row;
    }
  });

  return bestRow;
}

function serializeConfigForm() {
  const projects = Array.from(projectsEditor.querySelectorAll(".config-row"))
    .map((row) => ({
      name: row.querySelector("[data-role='project-name']").value.trim(),
      description: row.querySelector("[data-role='project-description']").value.trim(),
      url: row.querySelector("[data-role='project-url']").value.trim()
    }))
    .filter((project) => project.name);

  const links = Array.from(linksEditor.querySelectorAll(".config-row"))
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
    projects,
    links
  };
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
