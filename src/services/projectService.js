const { DateTime } = require("luxon");
const { getDb } = require("../config/database");
const screenshotService = require("./projectScreenshotService");
const { FEATURED_PROJECT_LIMIT } = require("../config/constants");
const { createSlug, renderMarkdown } = require("../utils/content");
const { normalizeText } = require("../utils/formatters");

function getScreenshotsByProjectId(projectId) {
  return screenshotService.listProjectScreenshots(projectId);
}

function attachScreenshots(project) {
  if (!project) {
    return project;
  }

  const screenshots = getScreenshotsByProjectId(project.id);
  const screenshotUrls = screenshots.map((screenshot) => screenshot.url).filter(Boolean);
  return {
    ...project,
    screenshots,
    screenshot_count: screenshots.length,
    screenshot_urls: screenshotUrls,
    screenshot_urls_json: JSON.stringify(screenshotUrls)
  };
}

function listProjects() {
  const projects = getDb()
    .prepare("SELECT * FROM projects ORDER BY is_featured DESC, display_order ASC, updated_at DESC")
    .all();
  return projects.map(attachScreenshots);
}

function countFeaturedProjects(excludeId = null) {
  if (excludeId) {
    const result = getDb()
      .prepare("SELECT COUNT(*) AS count FROM projects WHERE is_featured = 1 AND id != ?")
      .get(excludeId);
    return Number(result?.count || 0);
  }

  const result = getDb()
    .prepare("SELECT COUNT(*) AS count FROM projects WHERE is_featured = 1")
    .get();
  return Number(result?.count || 0);
}

function canFeatureProject(excludeId = null) {
  return countFeaturedProjects(excludeId) < FEATURED_PROJECT_LIMIT;
}

function setProjectFeatured(id, isFeatured) {
  const project = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id);
  if (!project) {
    return null;
  }

  const nextFeatured = isFeatured ? 1 : 0;
  if (nextFeatured && !canFeatureProject(id)) {
    throw new Error(`You can feature at most ${FEATURED_PROJECT_LIMIT} projects on the homepage.`);
  }

  getDb()
    .prepare("UPDATE projects SET is_featured = ?, updated_at = ? WHERE id = ?")
    .run(nextFeatured, DateTime.now().toISO(), id);

  return getProjectById(id);
}

function getFeaturedProjects(limit = FEATURED_PROJECT_LIMIT) {
  const projects = getDb()
    .prepare(
      "SELECT * FROM projects WHERE is_featured = 1 ORDER BY display_order ASC, updated_at DESC LIMIT ?"
    )
    .all(limit);
  return projects.map(attachScreenshots);
}

function getProjectBySlug(slug) {
  return attachScreenshots(getDb().prepare("SELECT * FROM projects WHERE slug = ?").get(slug));
}

function getProjectById(id) {
  return attachScreenshots(getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id));
}

function saveProject(input, id = null) {
  const database = getDb();
  const existingProject = id ? database.prepare("SELECT * FROM projects WHERE id = ?").get(id) : null;
  const title = normalizeText(input.title);
  const slug = normalizeText(input.slug) || createSlug(title);
  const summary = normalizeText(input.summary);
  const markdown = input.description_markdown || "";
  const html = renderMarkdown(markdown);
  const projectType = normalizeText(input.project_type);
  const externalUrl = normalizeText(input.external_url) || null;
  const internalUrl = normalizeText(input.internal_url) || null;
  const isFeatured = input.is_featured ? 1 : 0;
  const displayOrder = id ? Number(existingProject?.display_order || 0) : Number(input.display_order || 0);
  const timestamp = DateTime.now().toISO();

  if (isFeatured && !canFeatureProject(id)) {
    throw new Error(`You can feature at most ${FEATURED_PROJECT_LIMIT} projects on the homepage.`);
  }

  if (id) {
    database
      .prepare(
        `UPDATE projects
         SET title = ?, slug = ?, summary = ?, description_markdown = ?, description_html = ?, project_type = ?, external_url = ?, internal_url = ?, is_featured = ?, display_order = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        title,
        slug,
        summary,
        markdown,
        html,
        projectType,
        externalUrl,
        internalUrl,
        isFeatured,
        displayOrder,
        timestamp,
        id
      );

    if (existingProject && existingProject.slug !== slug) {
      screenshotService.renameProjectScreenshots(id, existingProject.slug, slug);
    }
  } else {
    const result = database
      .prepare(
        `INSERT INTO projects
         (title, slug, summary, description_markdown, description_html, project_type, external_url, internal_url, is_featured, display_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        title,
        slug,
        summary,
        markdown,
        html,
        projectType,
        externalUrl,
        internalUrl,
        isFeatured,
        displayOrder,
        timestamp,
        timestamp
      );
    id = result.lastInsertRowid;
  }

  return getProjectById(id);
}

function deleteProject(id, options = {}) {
  const project = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id);
  if (!project) {
    return false;
  }

  screenshotService.deleteProjectScreenshots(project, options);
  getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  return true;
}

function reorderProjects(projectIds) {
  const database = getDb();
  const timestamp = DateTime.now().toISO();
  const updateProjectOrder = database.prepare(
    "UPDATE projects SET display_order = ?, updated_at = ? WHERE id = ?"
  );
  const transaction = database.transaction((ids) => {
    ids.forEach((id, index) => {
      updateProjectOrder.run(index + 1, timestamp, id);
    });
  });

  transaction(projectIds);
}

module.exports = {
  FEATURED_PROJECT_LIMIT,
  listProjects,
  countFeaturedProjects,
  canFeatureProject,
  setProjectFeatured,
  getFeaturedProjects,
  getProjectBySlug,
  getProjectById,
  saveProject,
  deleteProject,
  reorderProjects
};



