const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

const { createTestAppContext } = require("../test-support/test-app");

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5v2KsAAAAASUVORK5CYII=",
  "base64"
);

function buildUpload(name = "screenshot.png") {
  return {
    name,
    mimetype: "image/png",
    data: ONE_PIXEL_PNG
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function cleanupProjectScreenshotTestContext(context) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  context.cleanup();
}

function createProjectScreenshotTestContext() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gagnaux-project-carousel-"));
  process.env.PROJECTS_PUBLIC_DIR = path.join(tempRoot, "projects");
  const appContext = createTestAppContext();

  const projectService = require("../src/services/projectService");
  const screenshotService = require("../src/services/projectScreenshotService");

  return {
    ...appContext,
    projectService,
    screenshotService,
    projectsDir: process.env.PROJECTS_PUBLIC_DIR,
    cleanup() {
      appContext.cleanup();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  };
}

test("project screenshots are stored under the project carousel folder with explicit URLs", async () => {
  const context = createProjectScreenshotTestContext();

  try {
    const project = context.projectService.listProjects()[0];
    await context.screenshotService.saveProjectScreenshots(project, buildUpload());

    const updatedProject = context.projectService.getProjectById(project.id);
    const expectedStoragePath = `projects/${project.slug}/carousel/1.png`;
    const expectedUrl = `/projects/${project.slug}/carousel/1.png`;

    assert.equal(updatedProject.screenshots.length, 1);
    assert.equal(updatedProject.screenshots[0].storage_path, expectedStoragePath);
    assert.equal(updatedProject.screenshots[0].url, expectedUrl);
    assert.deepEqual(updatedProject.screenshot_urls, [expectedUrl]);
    assert.equal(updatedProject.screenshot_urls_json, JSON.stringify([expectedUrl]));
    assert.equal(fs.existsSync(path.join(context.projectsDir, project.slug, "carousel", "1.png")), true);
  } finally {
    await cleanupProjectScreenshotTestContext(context);
  }
});

test("draft screenshots promote into project carousel storage and render from /projects URLs", async () => {
  const context = createProjectScreenshotTestContext();

  try {
    const uploadSessionId = "draft-session-1";
    const project = context.projectService.listProjects()[0];
    await context.screenshotService.saveDraftProjectScreenshots(uploadSessionId, [buildUpload("a.png"), buildUpload("b.png")]);

    const drafts = context.screenshotService.listDraftProjectScreenshots(uploadSessionId);
    assert.deepEqual(
      drafts.map((screenshot) => screenshot.url),
      [
        "/projects/__drafts/draft-session-1/carousel/1.png",
        "/projects/__drafts/draft-session-1/carousel/2.png"
      ]
    );

    const mappings = context.screenshotService.promoteDraftProjectScreenshots(uploadSessionId, project);
    const updatedProject = context.projectService.getProjectById(project.id);
    const expectedUrls = [
      `/projects/${project.slug}/carousel/1.png`,
      `/projects/${project.slug}/carousel/2.png`
    ];

    assert.deepEqual(updatedProject.screenshot_urls, expectedUrls);
    assert.deepEqual(
      mappings,
      [
        { from: "/projects/__drafts/draft-session-1/carousel/1.png", to: expectedUrls[0] },
        { from: "/projects/__drafts/draft-session-1/carousel/2.png", to: expectedUrls[1] }
      ]
    );
    assert.equal(fs.existsSync(path.join(context.projectsDir, "__drafts", "draft-session-1")), false);
    assert.equal(fs.existsSync(path.join(context.projectsDir, project.slug, "carousel", "1.png")), true);
    assert.equal(fs.existsSync(path.join(context.projectsDir, project.slug, "carousel", "2.png")), true);

    const homeResponse = await request(context.app).get("/");
    assert.match(homeResponse.text, new RegExp(escapeRegExp(expectedUrls[0])));

    const agent = await context.createAuthenticatedAgent();
    const editResponse = await agent.get(`/admin/projects/${project.id}/edit?tab=images`);
    assert.match(editResponse.text, new RegExp(escapeRegExp(expectedUrls[0])));
  } finally {
    await cleanupProjectScreenshotTestContext(context);
  }
});

test("project deletion removes the carousel by default and can optionally remove the full project folder", async () => {
  const context = createProjectScreenshotTestContext();

  try {
    const project = context.projectService.listProjects()[0];
    const projectDir = path.join(context.projectsDir, project.slug);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, "index.html"), "<html></html>", "utf8");
    await context.screenshotService.saveProjectScreenshots(project, buildUpload());

    const deleted = context.projectService.deleteProject(project.id);
    assert.equal(deleted, true);
    assert.equal(fs.existsSync(projectDir), true);
    assert.equal(fs.existsSync(path.join(projectDir, "index.html")), true);
    assert.equal(fs.existsSync(path.join(projectDir, "carousel")), false);

    const removableProject = context.projectService.saveProject({
      title: "Folder Delete Test",
      slug: "folder-delete-test",
      summary: "Folder delete test summary",
      description_markdown: "Folder delete test",
      project_type: "Test",
      internal_url: "/projects/folder-delete-test"
    });
    const removableProjectDir = path.join(context.projectsDir, removableProject.slug);
    fs.mkdirSync(removableProjectDir, { recursive: true });
    fs.writeFileSync(path.join(removableProjectDir, "index.html"), "<html></html>", "utf8");
    await context.screenshotService.saveProjectScreenshots(removableProject, buildUpload());

    const deletedWithFolder = context.projectService.deleteProject(removableProject.id, { deleteProjectFolder: true });
    assert.equal(deletedWithFolder, true);
    assert.equal(fs.existsSync(removableProjectDir), false);
  } finally {
    await cleanupProjectScreenshotTestContext(context);
  }
});

