const postsContainer = document.getElementById("posts");

async function loadPosts() {
  const response = await fetch("/api/posts");
  const posts = await response.json();

  if (!Array.isArray(posts) || posts.length === 0) {
    postsContainer.innerHTML = "<div class='card'><p>No posts published yet.</p></div>";
    return;
  }

  postsContainer.innerHTML = posts
    .map(
      (post) => `
      <article class="card">
        <h2><a href="/post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h2>
        <p class="post-meta">${escapeHtml(post.date)}${post.tags?.length ? ` | ${escapeHtml(post.tags.join(", "))}` : ""}</p>
        <p>${escapeHtml(post.summary || "")}</p>
      </article>
    `
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

loadPosts().catch(() => {
  postsContainer.innerHTML = "<div class='card'><p>Could not load posts.</p></div>";
});