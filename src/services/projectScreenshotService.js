const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { DateTime } = require("luxon");
const { getDb } = require("../config/database");
const { PROJECT_SCREENSHOT_MAX_WIDTH } = require("../config/constants");

const defaultProjectsDir = path.join(__dirname, "..", "..", "public", "projects");
const PROJECT_SCREENSHOT_ROLE = "project_screenshot";
const DRAFTS_DIR_NAME = "__drafts";

function getProjectsDir() {
  return path.resolve(process.env.PROJECTS_PUBLIC_DIR || defaultProjectsDir);
}

function getPublicRootDir() {
  return path.dirname(getProjectsDir());
}

function getLegacyUploadsDir() {
  return path.join(getPublicRootDir(), "uploads");
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureProjectsDir() {
  ensureDirectory(getProjectsDir());
}

function normalizeUploadedFiles(files) {
  if (!files) {
    return [];
  }

  return Array.isArray(files) ? files.filter(Boolean) : [files];
}

function sanitizeUploadSessionId(uploadSessionId) {
  return String(uploadSessionId || "draft").replace(/[^a-zA-Z0-9_-]/g, "");
}

function normalizeStoragePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim();
}

function buildStoragePath(...segments) {
  return path.posix.join(
    "projects",
    ...segments.map((segment) => String(segment || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
  );
}

function buildPublicUrl(storagePath) {
  const normalizedPath = normalizeStoragePath(storagePath);
  return normalizedPath ? `/${normalizedPath}` : "";
}

function resolvePublicFilePath(storagePath) {
  const normalizedPath = normalizeStoragePath(storagePath);
  if (!normalizedPath) {
    return "";
  }

  return path.join(getPublicRootDir(), ...normalizedPath.split("/"));
}

function buildScreenshotFilename(index) {
  return `${index}.png`;
}

function buildSavedScreenshotStoragePath(slug, index) {
  return buildStoragePath(slug, "carousel", buildScreenshotFilename(index));
}

function buildDraftScreenshotStoragePath(uploadSessionId, index) {
  return buildStoragePath(DRAFTS_DIR_NAME, sanitizeUploadSessionId(uploadSessionId), "carousel", buildScreenshotFilename(index));
}

function getProjectDir(slug) {
  return path.join(getProjectsDir(), slug);
}

function getProjectCarouselDir(slug) {
  return path.join(getProjectDir(slug), "carousel");
}

function getDraftSessionDir(uploadSessionId) {
  return path.join(getProjectsDir(), DRAFTS_DIR_NAME, sanitizeUploadSessionId(uploadSessionId));
}

function getDraftCarouselDir(uploadSessionId) {
  return path.join(getDraftSessionDir(uploadSessionId), "carousel");
}

function cleanupDirectoryIfEmpty(dirPath, stopDir) {
  let currentPath = dirPath;
  const normalizedStopDir = stopDir ? path.resolve(stopDir) : null;

  while (currentPath && fs.existsSync(currentPath)) {
    const normalizedCurrentPath = path.resolve(currentPath);
    if (normalizedStopDir && normalizedCurrentPath === normalizedStopDir) {
      return;
    }

    if (fs.readdirSync(currentPath).length > 0) {
      return;
    }

    fs.rmdirSync(currentPath);
    currentPath = path.dirname(currentPath);
  }
}

function removeProjectCarouselDirectory(slug) {
  const carouselDir = getProjectCarouselDir(slug);
  if (fs.existsSync(carouselDir)) {
    fs.rmSync(carouselDir, { recursive: true, force: true });
  }

  cleanupDirectoryIfEmpty(getProjectDir(slug), getProjectsDir());
}

function removeDraftSessionDirectory(uploadSessionId) {
  const draftSessionDir = getDraftSessionDir(uploadSessionId);
  if (fs.existsSync(draftSessionDir)) {
    fs.rmSync(draftSessionDir, { recursive: true, force: true });
  }
}

function removeProjectDirectory(slug) {
  const projectDir = getProjectDir(slug);
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
}

function buildLegacyUploadUrl(filename) {
  return filename ? `/uploads/${filename}` : "";
}

function resolveScreenshotFilePath(screenshot) {
  const storagePath = normalizeStoragePath(screenshot?.storage_path);
  const filename = normalizeStoragePath(screenshot?.filename);

  if (storagePath) {
    return resolvePublicFilePath(storagePath);
  }

  if (filename.includes("/")) {
    return resolvePublicFilePath(filename);
  }

  return filename ? path.join(getLegacyUploadsDir(), filename) : "";
}

function mapProjectScreenshot(row) {
  const storagePath = normalizeStoragePath(row.storage_path);
  return {
    ...row,
    storage_path: storagePath,
    url: storagePath ? buildPublicUrl(storagePath) : buildLegacyUploadUrl(row.filename)
  };
}

function mapDraftScreenshot(row) {
  const storagePath = normalizeStoragePath(row.filename);
  return {
    ...row,
    url: storagePath.includes("/") ? buildPublicUrl(storagePath) : buildLegacyUploadUrl(row.filename)
  };
}

function listRawProjectScreenshots(projectId) {
  return getDb()
    .prepare("SELECT * FROM media WHERE project_id = ? AND media_role = ? ORDER BY display_order ASC, id ASC")
    .all(projectId, PROJECT_SCREENSHOT_ROLE);
}

function listProjectScreenshots(projectId) {
  return listRawProjectScreenshots(projectId).map(mapProjectScreenshot);
}

function listRawDraftProjectScreenshots(uploadSessionId) {
  if (!uploadSessionId) {
    return [];
  }

  return getDb()
    .prepare("SELECT * FROM project_draft_screenshots WHERE upload_session_id = ? ORDER BY display_order ASC, id ASC")
    .all(uploadSessionId);
}

function listDraftProjectScreenshots(uploadSessionId) {
  return listRawDraftProjectScreenshots(uploadSessionId).map(mapDraftScreenshot);
}

function createTempMovePath(filePath, index) {
  const directory = path.dirname(filePath);
  return path.join(directory, `.__tmp-project-screenshot-${Date.now()}-${index}.png`);
}

function reindexProjectScreenshots(projectId, slug, options = {}) {
  if (!projectId || !slug) {
    return;
  }

  ensureProjectsDir();
  ensureDirectory(getProjectCarouselDir(slug));

  const db = getDb();
  const screenshots = listRawProjectScreenshots(projectId);
  const updateScreenshot = db.prepare(
    "UPDATE media SET filename = ?, original_name = ?, storage_path = ?, display_order = ? WHERE id = ?"
  );
  const tempEntries = screenshots.map((screenshot, index) => {
    const currentPath = resolveScreenshotFilePath(screenshot);
    const tempPath = currentPath && fs.existsSync(currentPath) ? createTempMovePath(currentPath, index) : "";

    if (tempPath) {
      fs.renameSync(currentPath, tempPath);
    }

    return {
      ...screenshot,
      tempPath
    };
  });

  const transaction = db.transaction(() => {
    tempEntries.forEach((entry, index) => {
      const filename = buildScreenshotFilename(index + 1);
      const storagePath = buildSavedScreenshotStoragePath(slug, index + 1);
      const destinationPath = resolvePublicFilePath(storagePath);

      ensureDirectory(path.dirname(destinationPath));
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath);
      }

      if (entry.tempPath && fs.existsSync(entry.tempPath)) {
        fs.renameSync(entry.tempPath, destinationPath);
      }

      updateScreenshot.run(filename, filename, storagePath, index + 1, entry.id);
    });
  });

  transaction();

  if (options.cleanupSlug && options.cleanupSlug !== slug) {
    removeProjectCarouselDirectory(options.cleanupSlug);
  }
}

function reindexDraftProjectScreenshots(uploadSessionId) {
  if (!uploadSessionId) {
    return;
  }

  ensureProjectsDir();
  ensureDirectory(getDraftCarouselDir(uploadSessionId));

  const db = getDb();
  const screenshots = listRawDraftProjectScreenshots(uploadSessionId);
  const updateScreenshot = db.prepare(
    "UPDATE project_draft_screenshots SET filename = ?, display_order = ? WHERE id = ?"
  );
  const tempEntries = screenshots.map((screenshot, index) => {
    const currentPath = resolveScreenshotFilePath({ filename: screenshot.filename });
    const tempPath = currentPath && fs.existsSync(currentPath) ? createTempMovePath(currentPath, index) : "";

    if (tempPath) {
      fs.renameSync(currentPath, tempPath);
    }

    return {
      ...screenshot,
      tempPath
    };
  });

  const transaction = db.transaction(() => {
    tempEntries.forEach((entry, index) => {
      const storagePath = buildDraftScreenshotStoragePath(uploadSessionId, index + 1);
      const destinationPath = resolvePublicFilePath(storagePath);

      ensureDirectory(path.dirname(destinationPath));
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath);
      }

      if (entry.tempPath && fs.existsSync(entry.tempPath)) {
        fs.renameSync(entry.tempPath, destinationPath);
      }

      updateScreenshot.run(storagePath, index + 1, entry.id);
    });
  });

  transaction();
}

async function saveProjectScreenshots(project, files) {
  const uploads = normalizeUploadedFiles(files);
  if (!project || uploads.length === 0) {
    return [];
  }

  ensureProjectsDir();
  ensureDirectory(getProjectCarouselDir(project.slug));

  const insertScreenshot = getDb().prepare(
    `INSERT INTO media
     (filename, storage_path, original_name, mime_type, file_size, alt_text, media_role, project_id, display_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const timestamp = DateTime.now().toISO();
  const existingCount = listProjectScreenshots(project.id).length;
  const saved = [];

  for (let index = 0; index < uploads.length; index += 1) {
    const file = uploads[index];
    if (!file || !String(file.mimetype || "").startsWith("image/")) {
      continue;
    }

    const order = existingCount + saved.length + 1;
    const filename = buildScreenshotFilename(order);
    const storagePath = buildSavedScreenshotStoragePath(project.slug, order);
    const destination = resolvePublicFilePath(storagePath);
    const imageBuffer = await sharp(file.data)
      .resize({ width: PROJECT_SCREENSHOT_MAX_WIDTH, withoutEnlargement: true })
      .png()
      .toBuffer();

    fs.writeFileSync(destination, imageBuffer);
    insertScreenshot.run(
      filename,
      storagePath,
      filename,
      "image/png",
      imageBuffer.length,
      `${project.title} screenshot ${order}`,
      PROJECT_SCREENSHOT_ROLE,
      project.id,
      order,
      timestamp
    );
    saved.push(filename);
  }

  reindexProjectScreenshots(project.id, project.slug);
  return listProjectScreenshots(project.id);
}

async function saveDraftProjectScreenshots(uploadSessionId, files) {
  const uploads = normalizeUploadedFiles(files);
  if (!uploadSessionId || uploads.length === 0) {
    return [];
  }

  ensureProjectsDir();
  ensureDirectory(getDraftCarouselDir(uploadSessionId));

  const insertScreenshot = getDb().prepare(
    `INSERT INTO project_draft_screenshots
     (upload_session_id, filename, display_order, alt_text, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const timestamp = DateTime.now().toISO();
  const existingCount = listDraftProjectScreenshots(uploadSessionId).length;
  const saved = [];

  for (let index = 0; index < uploads.length; index += 1) {
    const file = uploads[index];
    if (!file || !String(file.mimetype || "").startsWith("image/")) {
      continue;
    }

    const order = existingCount + saved.length + 1;
    const storagePath = buildDraftScreenshotStoragePath(uploadSessionId, order);
    const destination = resolvePublicFilePath(storagePath);
    const imageBuffer = await sharp(file.data)
      .resize({ width: PROJECT_SCREENSHOT_MAX_WIDTH, withoutEnlargement: true })
      .png()
      .toBuffer();

    fs.writeFileSync(destination, imageBuffer);
    insertScreenshot.run(
      uploadSessionId,
      storagePath,
      order,
      `Draft project screenshot ${order}`,
      timestamp
    );
    saved.push(storagePath);
  }

  reindexDraftProjectScreenshots(uploadSessionId);
  return listDraftProjectScreenshots(uploadSessionId);
}

function promoteDraftProjectScreenshots(uploadSessionId, project) {
  if (!uploadSessionId || !project) {
    return [];
  }

  ensureProjectsDir();
  ensureDirectory(getProjectCarouselDir(project.slug));

  const db = getDb();
  const drafts = listRawDraftProjectScreenshots(uploadSessionId);
  if (drafts.length === 0) {
    return [];
  }

  const existingCount = listProjectScreenshots(project.id).length;
  const insertScreenshot = db.prepare(
    `INSERT INTO media
     (filename, storage_path, original_name, mime_type, file_size, alt_text, media_role, project_id, display_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const deleteDraft = db.prepare("DELETE FROM project_draft_screenshots WHERE id = ?");
  const mappings = [];

  drafts.forEach((draft, index) => {
    const nextOrder = existingCount + index + 1;
    const filename = buildScreenshotFilename(nextOrder);
    const storagePath = buildSavedScreenshotStoragePath(project.slug, nextOrder);
    const currentPath = resolveScreenshotFilePath({ filename: draft.filename });
    const nextPath = resolvePublicFilePath(storagePath);

    ensureDirectory(path.dirname(nextPath));
    if (fs.existsSync(currentPath)) {
      if (fs.existsSync(nextPath)) {
        fs.unlinkSync(nextPath);
      }

      fs.renameSync(currentPath, nextPath);
    }

    const fileSize = fs.existsSync(nextPath) ? fs.statSync(nextPath).size : 0;
    insertScreenshot.run(
      filename,
      storagePath,
      filename,
      "image/png",
      fileSize,
      `${project.title} screenshot ${nextOrder}`,
      PROJECT_SCREENSHOT_ROLE,
      project.id,
      nextOrder,
      draft.created_at
    );
    mappings.push({
      from: draft.filename.includes("/") ? buildPublicUrl(draft.filename) : buildLegacyUploadUrl(draft.filename),
      to: buildPublicUrl(storagePath)
    });
    deleteDraft.run(draft.id);
  });

  removeDraftSessionDirectory(uploadSessionId);
  reindexProjectScreenshots(project.id, project.slug);
  return mappings;
}

function renameProjectScreenshots(projectId, oldSlug, newSlug) {
  if (!projectId || !oldSlug || !newSlug || oldSlug === newSlug) {
    return;
  }

  reindexProjectScreenshots(projectId, newSlug, { cleanupSlug: oldSlug });
}

function deleteProjectScreenshot(projectId, screenshotId, slug) {
  if (!projectId || !screenshotId || !slug) {
    return false;
  }

  return deleteProjectScreenshotsByIds(projectId, [screenshotId], slug);
}

function deleteProjectScreenshotsByIds(projectId, screenshotIds, slug) {
  if (!projectId || !Array.isArray(screenshotIds) || screenshotIds.length === 0 || !slug) {
    return false;
  }

  const db = getDb();
  const normalizedIds = screenshotIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return false;
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const screenshots = db
    .prepare(`SELECT * FROM media WHERE project_id = ? AND media_role = ? AND id IN (${placeholders})`)
    .all(projectId, PROJECT_SCREENSHOT_ROLE, ...normalizedIds);

  if (screenshots.length === 0) {
    return false;
  }

  const deleteScreenshot = db.prepare("DELETE FROM media WHERE id = ?");
  const transaction = db.transaction(() => {
    screenshots.forEach((screenshot) => {
      const filePath = resolveScreenshotFilePath(screenshot);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      deleteScreenshot.run(screenshot.id);
    });
  });

  transaction();
  reindexProjectScreenshots(projectId, slug);

  if (listProjectScreenshots(projectId).length === 0) {
    removeProjectCarouselDirectory(slug);
  }

  return true;
}

function deleteDraftProjectScreenshotsByIds(uploadSessionId, screenshotIds) {
  if (!uploadSessionId || !Array.isArray(screenshotIds) || screenshotIds.length === 0) {
    return false;
  }

  const db = getDb();
  const normalizedIds = screenshotIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return false;
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const screenshots = db
    .prepare(`SELECT * FROM project_draft_screenshots WHERE upload_session_id = ? AND id IN (${placeholders})`)
    .all(uploadSessionId, ...normalizedIds);

  if (screenshots.length === 0) {
    return false;
  }

  const deleteScreenshot = db.prepare("DELETE FROM project_draft_screenshots WHERE id = ?");
  const transaction = db.transaction(() => {
    screenshots.forEach((screenshot) => {
      const filePath = resolveScreenshotFilePath({ filename: screenshot.filename });
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      deleteScreenshot.run(screenshot.id);
    });
  });

  transaction();

  if (listRawDraftProjectScreenshots(uploadSessionId).length === 0) {
    removeDraftSessionDirectory(uploadSessionId);
  } else {
    reindexDraftProjectScreenshots(uploadSessionId);
  }

  return true;
}

function reorderProjectScreenshots(projectId, orderedScreenshotIds, slug) {
  if (!projectId || !Array.isArray(orderedScreenshotIds) || orderedScreenshotIds.length === 0 || !slug) {
    return false;
  }

  const screenshots = listProjectScreenshots(projectId);
  if (screenshots.length !== orderedScreenshotIds.length) {
    return false;
  }

  const screenshotMap = new Map(screenshots.map((screenshot) => [Number(screenshot.id), screenshot]));
  const reordered = orderedScreenshotIds.map((id) => screenshotMap.get(Number(id))).filter(Boolean);

  if (reordered.length !== screenshots.length) {
    return false;
  }

  const updateOrder = getDb().prepare("UPDATE media SET display_order = ? WHERE id = ?");
  const transaction = getDb().transaction(() => {
    reordered.forEach((item, index) => {
      updateOrder.run(index + 1, item.id);
    });
  });

  transaction();
  reindexProjectScreenshots(projectId, slug);
  return true;
}

function moveProjectScreenshot(projectId, screenshotId, slug, direction) {
  if (!projectId || !screenshotId || !slug) {
    return false;
  }

  const screenshots = listProjectScreenshots(projectId);
  const currentIndex = screenshots.findIndex((item) => Number(item.id) === Number(screenshotId));
  if (currentIndex === -1) {
    return false;
  }

  const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= screenshots.length) {
    return false;
  }

  const reordered = screenshots.slice();
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  return reorderProjectScreenshots(
    projectId,
    reordered.map((item) => Number(item.id)),
    slug
  );
}

function deleteProjectScreenshots(project, options = {}) {
  const projectId = typeof project === "object" ? Number(project.id) : Number(project);
  if (!projectId) {
    return;
  }

  const projectRecord = typeof project === "object"
    ? project
    : getDb().prepare("SELECT * FROM projects WHERE id = ?").get(projectId);

  if (!projectRecord) {
    return;
  }

  const screenshots = getDb()
    .prepare("SELECT * FROM media WHERE project_id = ? AND media_role = ?")
    .all(projectId, PROJECT_SCREENSHOT_ROLE);

  screenshots.forEach((screenshot) => {
    const filePath = resolveScreenshotFilePath(screenshot);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  getDb().prepare("DELETE FROM media WHERE project_id = ? AND media_role = ?").run(projectId, PROJECT_SCREENSHOT_ROLE);

  if (options.deleteProjectFolder) {
    removeProjectDirectory(projectRecord.slug);
  } else {
    removeProjectCarouselDirectory(projectRecord.slug);
  }
}

module.exports = {
  listProjectScreenshots,
  listDraftProjectScreenshots,
  saveProjectScreenshots,
  saveDraftProjectScreenshots,
  promoteDraftProjectScreenshots,
  renameProjectScreenshots,
  deleteProjectScreenshot,
  deleteProjectScreenshotsByIds,
  deleteDraftProjectScreenshotsByIds,
  reorderProjectScreenshots,
  moveProjectScreenshot,
  deleteProjectScreenshots
};
