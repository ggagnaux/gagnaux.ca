const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");
const { getDb } = require("../config/database");

const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads");

function getMediaReferences(mediaId) {
  const db = getDb();
  const item = db.prepare("SELECT * FROM media WHERE id = ?").get(mediaId);
  if (!item) {
    return [];
  }

  const references = [];
  const referencedPosts = db
    .prepare("SELECT title FROM posts WHERE cover_image_id = ? ORDER BY updated_at DESC")
    .all(mediaId);
  const referencedProjectThumbs = db
    .prepare("SELECT title FROM projects WHERE thumbnail_image_id = ? ORDER BY updated_at DESC")
    .all(mediaId);
  const referencedProjectCovers = db
    .prepare("SELECT title FROM projects WHERE cover_image_id = ? ORDER BY updated_at DESC")
    .all(mediaId);

  referencedPosts.forEach((post) => {
    references.push(`Post cover: ${post.title}`);
  });
  referencedProjectThumbs.forEach((project) => {
    references.push(`Project thumbnail: ${project.title}`);
  });
  referencedProjectCovers.forEach((project) => {
    references.push(`Project cover: ${project.title}`);
  });

  if (item.media_role === "post_image" && item.post_id) {
    const post = db.prepare("SELECT title FROM posts WHERE id = ?").get(item.post_id);
    references.push(`Post image: ${post?.title || `Post ${item.post_id}`}`);
  }

  if (item.media_role === "project_screenshot" && item.project_id) {
    const project = db.prepare("SELECT title FROM projects WHERE id = ?").get(item.project_id);
    references.push(`Project screenshot: ${project?.title || `Project ${item.project_id}`}`);
  }

  return references;
}

function attachMediaReferences(item) {
  if (!item) {
    return item;
  }

  const references = getMediaReferences(item.id);
  return {
    ...item,
    references,
    isReferenced: references.length > 0
  };
}

function listMedia() {
  return getDb()
    .prepare("SELECT * FROM media ORDER BY created_at DESC")
    .all()
    .map(attachMediaReferences);
}

function saveUpload(file, altText = "") {
  if (!file) {
    return null;
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const sanitizedName = `${timestamp}-${file.name.replace(/\s+/g, "-").toLowerCase()}`;
  const destination = path.join(uploadsDir, sanitizedName);
  fs.writeFileSync(destination, file.data);

  const result = getDb()
    .prepare(
      `INSERT INTO media
       (filename, original_name, mime_type, file_size, alt_text, media_role, display_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(sanitizedName, file.name, file.mimetype, file.size, altText, "library", 0, DateTime.now().toISO());

  return getDb().prepare("SELECT * FROM media WHERE id = ?").get(result.lastInsertRowid);
}

function deleteMedia(id) {
  return deleteMediaByIds([id]);
}

function clearStructuredReferences(mediaId) {
  const db = getDb();
  db.prepare("UPDATE posts SET cover_image_id = NULL WHERE cover_image_id = ?").run(mediaId);
  db.prepare("UPDATE projects SET thumbnail_image_id = NULL WHERE thumbnail_image_id = ?").run(mediaId);
  db.prepare("UPDATE projects SET cover_image_id = NULL WHERE cover_image_id = ?").run(mediaId);
}

function deleteMediaByIds(ids, options = {}) {
  const forceReferenced = options.forceReferenced === true;
  const normalizedIds = (Array.isArray(ids) ? ids : [ids])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return { deleted: [], blocked: [] };
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const items = getDb()
    .prepare(`SELECT * FROM media WHERE id IN (${placeholders}) ORDER BY created_at DESC`)
    .all(...normalizedIds)
    .map(attachMediaReferences);

  const blocked = forceReferenced ? [] : items.filter((item) => item.isReferenced);
  const deletable = forceReferenced ? items : items.filter((item) => !item.isReferenced);

  const deleteStatement = getDb().prepare("DELETE FROM media WHERE id = ?");
  const transaction = getDb().transaction(() => {
    deletable.forEach((item) => {
      if (forceReferenced && item.isReferenced) {
        clearStructuredReferences(item.id);
      }

      const filePath = path.join(uploadsDir, item.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      deleteStatement.run(item.id);
    });
  });

  transaction();

  return {
    deleted: deletable,
    blocked
  };
}

module.exports = {
  listMedia,
  saveUpload,
  deleteMedia,
  deleteMediaByIds,
  getMediaReferences
};
