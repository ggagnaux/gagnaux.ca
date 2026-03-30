const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createTestAppContext } = require("../test-support/test-app");

let context;

test.before(() => {
  context = createTestAppContext();
});

test.after(() => {
  context.cleanup();
});

test("GET /projects returns the projects page", async () => {
  const response = await request(context.app).get("/projects").redirects(1);

  assert.equal(response.status, 200);
  assert.match(response.text, /Projects|Featured Projects|Explore Project/i);
});

test("GET /blog returns the blog page", async () => {
  const response = await request(context.app).get("/blog");

  assert.equal(response.status, 200);
  assert.match(response.text, /Blog|Read Post|Writing/i);
});

test("GET /about returns the about page", async () => {
  const response = await request(context.app).get("/about");

  assert.equal(response.status, 200);
  assert.match(response.text, /About/i);
});

test("GET /contact returns the contact page", async () => {
  const response = await request(context.app).get("/contact");

  assert.equal(response.status, 200);
  assert.match(response.text, /Contact/i);
});

test("GET /projects/:slug returns a published project detail page", async () => {
  const slug = context.getPublishedProjectSlug();
  assert.ok(slug, "Expected a seeded project slug");

  const response = await request(context.app).get(`/projects/${slug}`).redirects(1);

  assert.equal(response.status, 200);
  assert.match(response.text, /<!DOCTYPE html|<html|K\.O\. II|Project/i);
});

test("GET /projects/:slug returns 404 for an unknown project slug", async () => {
  const response = await request(context.app).get("/projects/not-a-real-project-slug");

  assert.equal(response.status, 404);
  assert.match(response.text, /Not Found/i);
});

test("GET /blog/:slug returns a published blog detail page", async () => {
  const slug = context.getPublishedPostSlug();
  assert.ok(slug, "Expected a seeded published post slug");

  const response = await request(context.app).get(`/blog/${slug}`);

  assert.equal(response.status, 200);
  assert.match(response.text, /Read|Writing|Greg|software|design/i);
});

test("GET /blog/:slug returns 404 for an unknown post slug", async () => {
  const response = await request(context.app).get("/blog/not-a-real-post-slug");

  assert.equal(response.status, 404);
  assert.match(response.text, /Not Found/i);
});

test("authenticated admins can access the dashboard, posts, projects, and settings pages", async () => {
  const agent = await context.createAuthenticatedAgent();

  const dashboardResponse = await agent.get("/admin");
  assert.equal(dashboardResponse.status, 200);
  assert.match(dashboardResponse.text, /Dashboard/i);

  const postsResponse = await agent.get("/admin/posts");
  assert.equal(postsResponse.status, 200);
  assert.match(postsResponse.text, /Posts/i);

  const projectsResponse = await agent.get("/admin/projects");
  assert.equal(projectsResponse.status, 200);
  assert.match(projectsResponse.text, /Projects/i);

  const settingsResponse = await agent.get("/admin/settings");
  assert.equal(settingsResponse.status, 200);
  assert.match(settingsResponse.text, /Settings/i);
});

test("POST /admin/logout clears the session and protects admin pages again", async () => {
  const agent = await context.createAuthenticatedAgent();

  await agent
    .post("/admin/logout")
    .expect(302)
    .expect("Location", "/admin/login");

  const response = await agent.get("/admin");

  assert.equal(response.status, 302);
  assert.equal(response.headers.location, "/admin/login");
});
test("admins can toggle featured projects from the projects list while respecting the featured limit", async () => {
  const agent = await context.createAuthenticatedAgent();
  const extraProject = context.projectService.saveProject({
    title: "Featured Toggle Candidate",
    slug: "featured-toggle-candidate",
    summary: "A project used to test the featured toggle.",
    description_markdown: "## Featured Toggle Candidate",
    project_type: "Test Project",
    external_url: "",
    internal_url: ""
  });

  const limitResponse = await agent
    .post(`/admin/projects/${extraProject.id}/toggle-featured`)
    .redirects(1);

  assert.equal(limitResponse.status, 200);
  assert.match(limitResponse.text, /maximum of 4 projects can be featured/i);
  assert.equal(context.projectService.getProjectById(extraProject.id).is_featured, 0);

  const featuredProject = context.projectService.listProjects().find((project) => project.is_featured);
  assert.ok(featuredProject, "Expected an existing featured project");

  await agent
    .post(`/admin/projects/${featuredProject.id}/toggle-featured`)
    .expect(302)
    .expect("Location", "/admin/projects");

  assert.equal(context.projectService.getProjectById(featuredProject.id).is_featured, 0);

  const featureResponse = await agent
    .post(`/admin/projects/${extraProject.id}/toggle-featured`)
    .redirects(1);

  assert.equal(featureResponse.status, 200);
  assert.match(featureResponse.text, /Featured project .*Featured Toggle Candidate.*on the homepage\./i);
  assert.equal(context.projectService.getProjectById(extraProject.id).is_featured, 1);
});


