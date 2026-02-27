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
const configJson = document.getElementById("config-json");
const saveConfigBtn = document.getElementById("save-config-btn");
const configStatus = document.getElementById("config-status");

init().catch(showLogin);

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

saveConfigBtn.addEventListener("click", async () => {
  configStatus.textContent = "Saving config...";
  let parsed;

  try {
    parsed = JSON.parse(configJson.value);
  } catch {
    configStatus.textContent = "Config is not valid JSON.";
    return;
  }

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

  configJson.value = JSON.stringify(data.config, null, 2);
  configStatus.textContent = "Config saved.";
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
  configJson.value = JSON.stringify(config, null, 2);
  configStatus.textContent = "";
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
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
  if (!postForm.date.value) postForm.date.value = new Date().toISOString().slice(0, 10);
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
