const postContainer = document.getElementById("post");
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

if (!slug) {
  postContainer.innerHTML = "<p>Missing post slug.</p>";
} else {
  loadPost(slug).catch(() => {
    postContainer.innerHTML = "<p>Could not load post.</p>";
  });
}

async function loadPost(postSlug) {
  const response = await fetch(`/api/posts/${encodeURIComponent(postSlug)}`);
  if (!response.ok) {
    postContainer.innerHTML = "<p>Post not found.</p>";
    return;
  }

  const post = await response.json();

  document.title = `${post.title} | gagnaux.ca`;
  postContainer.innerHTML = `
    <h1>${escapeHtml(post.title)}</h1>
    <p class="post-meta">${escapeHtml(post.date)}${post.tags?.length ? ` | ${escapeHtml(post.tags.join(", "))}` : ""}</p>
    ${post.coverImage ? `<img src="${escapeAttribute(post.coverImage)}" alt="" class="post-cover" />` : ""}
    <div class="post-body">${post.html}</div>
  `;
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