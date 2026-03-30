const { DateTime } = require("luxon");
const { getDb } = require("../config/database");
const postImageService = require("./postImageService");
const { DEFAULT_FEATURED_POSTS_LIMIT } = require("../config/constants");
const { createSlug, renderMarkdown } = require("../utils/content");
const { normalizeText } = require("../utils/formatters");

function getTagsByPostId(postId) {
  return getDb()
    .prepare("SELECT tag FROM post_tags WHERE post_id = ? ORDER BY tag ASC")
    .all(postId)
    .map((row) => row.tag);
}

function mapPost(post) {
  if (!post) {
    return post;
  }

  return {
    ...post,
    tags: getTagsByPostId(post.id),
    images: postImageService.listPostImages(post.id)
  };
}

function listPosts({ includeDrafts = true } = {}) {
  const query = includeDrafts
    ? "SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC"
    : "SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC";
  return getDb()
    .prepare(query)
    .all()
    .map(mapPost);
}

function getFeaturedPosts(limit = DEFAULT_FEATURED_POSTS_LIMIT) {
  return getDb()
    .prepare(
      "SELECT * FROM posts WHERE status = 'published' AND is_featured = 1 ORDER BY published_at DESC LIMIT ?"
    )
    .all(limit)
    .map(mapPost);
}

function getPostBySlug(slug) {
  const post = getDb()
    .prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .get(slug);

  return post ? mapPost(post) : null;
}

function getPostById(id) {
  const post = getDb().prepare("SELECT * FROM posts WHERE id = ?").get(id);
  return post ? mapPost(post) : null;
}

function savePost(input, id = null) {
  const database = getDb();
  const existingPost = id ? database.prepare("SELECT * FROM posts WHERE id = ?").get(id) : null;
  const title = normalizeText(input.title);
  const slug = normalizeText(input.slug) || createSlug(title);
  const excerpt = normalizeText(input.excerpt);
  const bodyMarkdown = input.body_markdown || "";
  const bodyHtml = renderMarkdown(bodyMarkdown);
  const status = input.status === "published" ? "published" : "draft";
  const isFeatured = input.is_featured ? 1 : 0;
  const timestamp = DateTime.now().toISO();
  const publishedAt = status === "published" ? input.published_at || timestamp : null;

  if (id) {
    database
      .prepare(
        `UPDATE posts
         SET title = ?, slug = ?, excerpt = ?, body_markdown = ?, body_html = ?, status = ?, is_featured = ?, published_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(title, slug, excerpt, bodyMarkdown, bodyHtml, status, isFeatured, publishedAt, timestamp, id);
    database.prepare("DELETE FROM post_tags WHERE post_id = ?").run(id);

    if (existingPost && existingPost.slug !== slug) {
      postImageService.renamePostImages(id, existingPost.slug, slug);
    }
  } else {
    const result = database
      .prepare(
        `INSERT INTO posts
         (title, slug, excerpt, body_markdown, body_html, status, is_featured, published_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, slug, excerpt, bodyMarkdown, bodyHtml, status, isFeatured, publishedAt, timestamp, timestamp);
    id = result.lastInsertRowid;
  }

  saveTags(id, input.tags || "");
  return getPostById(id);
}

function saveTags(postId, tagsValue) {
  const tags = String(tagsValue)
    .split(",")
    .map((tag) => normalizeText(tag))
    .filter(Boolean);

  const statement = getDb().prepare("INSERT INTO post_tags (post_id, tag) VALUES (?, ?)");
  tags.forEach((tag) => statement.run(postId, tag));
}

function deletePost(id) {
  postImageService.deletePostImages(id);
  getDb().prepare("DELETE FROM post_tags WHERE post_id = ?").run(id);
  getDb().prepare("DELETE FROM posts WHERE id = ?").run(id);
}

module.exports = {
  listPosts,
  getFeaturedPosts,
  getPostBySlug,
  getPostById,
  savePost,
  deletePost
};
