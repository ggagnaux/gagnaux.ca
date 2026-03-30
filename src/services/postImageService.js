const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { DateTime } = require("luxon");
const { getDb } = require("../config/database");
const { POST_IMAGE_MAX_WIDTH } = require("../config/constants");

const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads");
const POST_IMAGE_ROLE = "post_image";

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function normalizeUploadedFiles(files) {
  if (!files) {
    return [];
  }

  return Array.isArray(files) ? files.filter(Boolean) : [files];
}

function buildPostImageFilename(slug, index) {
  return `${slug}-image-${index}.png`;
}

function buildDraftPostImageFilename(uploadSessionId, index) {
  const safeSession = String(uploadSessionId || "draft").replace(/[^a-zA-Z0-9_-]/g, "");
  return `draft-post-image-${safeSession}-${Date.now()}-${index}.png`;
}

function listPostImages(postId) {
  return getDb()
    .prepare("SELECT * FROM media WHERE post_id = ? AND media_role = ? ORDER BY display_order ASC, id ASC")
    .all(postId, POST_IMAGE_ROLE);
}

function listDraftPostImages(uploadSessionId) {
  if (!uploadSessionId) {
    return [];
  }

  return getDb()
    .prepare("SELECT * FROM post_draft_images WHERE upload_session_id = ? ORDER BY display_order ASC, id ASC")
    .all(uploadSessionId);
}

function reindexPostImages(postId, slug) {
  if (!postId || !slug) {
    return;
  }

  ensureUploadsDir();
  const db = getDb();
  const images = listPostImages(postId);
  const updateImage = db.prepare("UPDATE media SET filename = ?, original_name = ?, display_order = ? WHERE id = ?");
  const tempEntries = images.map((image) => ({
    ...image,
    tempFilename: `.__tmp-post-image-${image.id}-${Date.now()}.png`
  }));

  tempEntries.forEach((entry) => {
    const currentPath = path.join(uploadsDir, entry.filename);
    const tempPath = path.join(uploadsDir, entry.tempFilename);
    if (fs.existsSync(currentPath)) {
      fs.renameSync(currentPath, tempPath);
    }
  });

  const transaction = db.transaction(() => {
    tempEntries.forEach((entry, index) => {
      const nextFilename = buildPostImageFilename(slug, index + 1);
      const tempPath = path.join(uploadsDir, entry.tempFilename);
      const nextPath = path.join(uploadsDir, nextFilename);

      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, nextPath);
      }

      updateImage.run(nextFilename, nextFilename, index + 1, entry.id);
    });
  });

  transaction();
}

function reindexDraftPostImages(uploadSessionId) {
  if (!uploadSessionId) {
    return;
  }

  const images = listDraftPostImages(uploadSessionId);
  const updateImage = getDb().prepare("UPDATE post_draft_images SET display_order = ? WHERE id = ?");

  const transaction = getDb().transaction(() => {
    images.forEach((image, index) => {
      updateImage.run(index + 1, image.id);
    });
  });

  transaction();
}

async function savePostImages(post, files) {
  const uploads = normalizeUploadedFiles(files);
  if (!post || uploads.length === 0) {
    return [];
  }

  ensureUploadsDir();

  const insertImage = getDb().prepare(
    `INSERT INTO media
     (filename, original_name, mime_type, file_size, alt_text, media_role, post_id, display_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const timestamp = DateTime.now().toISO();
  const existingCount = listPostImages(post.id).length;
  const saved = [];

  for (let index = 0; index < uploads.length; index += 1) {
    const file = uploads[index];
    if (!file || !String(file.mimetype || "").startsWith("image/")) {
      continue;
    }

    const order = existingCount + saved.length + 1;
    const filename = buildPostImageFilename(post.slug, order);
    const destination = path.join(uploadsDir, filename);
    const imageBuffer = await sharp(file.data)
      .resize({ width: POST_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .png()
      .toBuffer();

    fs.writeFileSync(destination, imageBuffer);
    insertImage.run(
      filename,
      filename,
      "image/png",
      imageBuffer.length,
      `${post.title} image ${order}`,
      POST_IMAGE_ROLE,
      post.id,
      order,
      timestamp
    );
    saved.push(filename);
  }

  reindexPostImages(post.id, post.slug);
  return listPostImages(post.id);
}

async function saveDraftPostImages(uploadSessionId, files) {
  const uploads = normalizeUploadedFiles(files);
  if (!uploadSessionId || uploads.length === 0) {
    return [];
  }

  ensureUploadsDir();

  const insertImage = getDb().prepare(
    `INSERT INTO post_draft_images
     (upload_session_id, filename, display_order, alt_text, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const timestamp = DateTime.now().toISO();
  const existingCount = listDraftPostImages(uploadSessionId).length;
  const saved = [];

  for (let index = 0; index < uploads.length; index += 1) {
    const file = uploads[index];
    if (!file || !String(file.mimetype || "").startsWith("image/")) {
      continue;
    }

    const order = existingCount + saved.length + 1;
    const filename = buildDraftPostImageFilename(uploadSessionId, order);
    const destination = path.join(uploadsDir, filename);
    const imageBuffer = await sharp(file.data)
      .resize({ width: POST_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .png()
      .toBuffer();

    fs.writeFileSync(destination, imageBuffer);
    insertImage.run(
      uploadSessionId,
      filename,
      order,
      `Draft post image ${order}`,
      timestamp
    );
    saved.push(filename);
  }

  reindexDraftPostImages(uploadSessionId);
  return listDraftPostImages(uploadSessionId);
}

function promoteDraftPostImages(uploadSessionId, post) {
  if (!uploadSessionId || !post) {
    return [];
  }

  ensureUploadsDir();
  const db = getDb();
  const drafts = listDraftPostImages(uploadSessionId);
  if (drafts.length === 0) {
    return [];
  }

  const existingCount = listPostImages(post.id).length;
  const insertImage = db.prepare(
    `INSERT INTO media
     (filename, original_name, mime_type, file_size, alt_text, media_role, post_id, display_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const deleteDraft = db.prepare("DELETE FROM post_draft_images WHERE id = ?");
  const mappings = [];

  drafts.forEach((draft, index) => {
    const nextOrder = existingCount + index + 1;
    const nextFilename = buildPostImageFilename(post.slug, nextOrder);
    const currentPath = path.join(uploadsDir, draft.filename);
    const nextPath = path.join(uploadsDir, nextFilename);

    if (fs.existsSync(currentPath)) {
      fs.renameSync(currentPath, nextPath);
    }

    const fileSize = fs.existsSync(nextPath) ? fs.statSync(nextPath).size : 0;
    insertImage.run(
      nextFilename,
      nextFilename,
      "image/png",
      fileSize,
      `${post.title} image ${nextOrder}`,
      POST_IMAGE_ROLE,
      post.id,
      nextOrder,
      draft.created_at
    );
    mappings.push({ from: draft.filename, to: nextFilename });
    deleteDraft.run(draft.id);
  });

  return mappings;
}

function renamePostImages(postId, oldSlug, newSlug) {
  if (!postId || !oldSlug || !newSlug || oldSlug === newSlug) {
    return;
  }

  reindexPostImages(postId, newSlug);
}

function deletePostImagesByIds(postId, imageIds, slug) {
  if (!postId || !Array.isArray(imageIds) || imageIds.length === 0 || !slug) {
    return false;
  }

  ensureUploadsDir();
  const db = getDb();
  const normalizedIds = imageIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return false;
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const images = db
    .prepare(`SELECT * FROM media WHERE post_id = ? AND media_role = ? AND id IN (${placeholders})`)
    .all(postId, POST_IMAGE_ROLE, ...normalizedIds);

  if (images.length === 0) {
    return false;
  }

  const deleteImage = db.prepare("DELETE FROM media WHERE id = ?");
  const transaction = db.transaction(() => {
    images.forEach((image) => {
      const filePath = path.join(uploadsDir, image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      deleteImage.run(image.id);
    });
  });

  transaction();
  reindexPostImages(postId, slug);
  return true;
}

function deleteDraftPostImagesByIds(uploadSessionId, imageIds) {
  if (!uploadSessionId || !Array.isArray(imageIds) || imageIds.length === 0) {
    return false;
  }

  ensureUploadsDir();
  const db = getDb();
  const normalizedIds = imageIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return false;
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const images = db
    .prepare(`SELECT * FROM post_draft_images WHERE upload_session_id = ? AND id IN (${placeholders})`)
    .all(uploadSessionId, ...normalizedIds);

  if (images.length === 0) {
    return false;
  }

  const deleteImage = db.prepare("DELETE FROM post_draft_images WHERE id = ?");
  const transaction = db.transaction(() => {
    images.forEach((image) => {
      const filePath = path.join(uploadsDir, image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      deleteImage.run(image.id);
    });
  });

  transaction();
  reindexDraftPostImages(uploadSessionId);
  return true;
}

function deletePostImages(postId) {
  if (!postId) {
    return;
  }

  ensureUploadsDir();
  const images = getDb()
    .prepare("SELECT * FROM media WHERE post_id = ? AND media_role = ?")
    .all(postId, POST_IMAGE_ROLE);

  images.forEach((image) => {
    const filePath = path.join(uploadsDir, image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  getDb().prepare("DELETE FROM media WHERE post_id = ? AND media_role = ?").run(postId, POST_IMAGE_ROLE);
}

module.exports = {
  listPostImages,
  listDraftPostImages,
  savePostImages,
  saveDraftPostImages,
  promoteDraftPostImages,
  renamePostImages,
  deletePostImagesByIds,
  deleteDraftPostImagesByIds,
  deletePostImages
};
