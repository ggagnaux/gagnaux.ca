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

test("GET / returns the home page", async () => {
  const response = await request(context.app).get("/");

  assert.equal(response.status, 200);
  assert.match(response.text, /Greg Gagnaux|View Projects|Projects/i);
});

test("unknown routes return the custom 404 page", async () => {
  const response = await request(context.app).get("/this-route-does-not-exist");

  assert.equal(response.status, 404);
  assert.match(response.text, /Not Found/i);
});

test("GET /admin redirects unauthenticated users to the login page", async () => {
  const response = await request(context.app).get("/admin");

  assert.equal(response.status, 302);
  assert.equal(response.headers.location, "/admin/login");
});

test("POST /admin/login rejects invalid credentials", async () => {
  const response = await request(context.app)
    .post("/admin/login")
    .type("form")
    .send({
      username: context.credentials.username,
      password: "wrong-password"
    });

  assert.equal(response.status, 401);
  assert.match(response.text, /Invalid username or password/i);
});

test("POST /admin/login accepts valid credentials and allows access to /admin", async () => {
  const agent = request.agent(context.app);

  const loginResponse = await agent
    .post("/admin/login")
    .type("form")
    .send(context.credentials);

  assert.equal(loginResponse.status, 302);
  assert.equal(loginResponse.headers.location, "/admin");

  const adminResponse = await agent.get("/admin");

  assert.equal(adminResponse.status, 200);
  assert.match(adminResponse.text, /Dashboard|Posts|Projects/i);
});

