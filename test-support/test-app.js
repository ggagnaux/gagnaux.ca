const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function createTestAppContext() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gagnaux-tests-"));
  const dbPath = path.join(tempRoot, "site.sqlite");
  const previousEnv = {
    DATABASE_PATH: process.env.DATABASE_PATH,
    ADMIN_SEED_USERNAME: process.env.ADMIN_SEED_USERNAME,
    ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    PROJECTS_PUBLIC_DIR: process.env.PROJECTS_PUBLIC_DIR
  };

  process.env.DATABASE_PATH = dbPath;
  process.env.ADMIN_SEED_USERNAME = "testadmin";
  process.env.ADMIN_SEED_PASSWORD = "test-password-123";
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.NODE_ENV = "test";

  const databaseModulePath = require.resolve("../src/config/database");
  delete require.cache[databaseModulePath];
  const database = require("../src/config/database");
  database.resetDb();
  database.ensureDatabase();

  const projectScreenshotServiceModulePath = require.resolve("../src/services/projectScreenshotService");
  delete require.cache[projectScreenshotServiceModulePath];

  const appModulePath = require.resolve("../src/app");
  delete require.cache[appModulePath];
  const app = require("../src/app");

  const postServiceModulePath = require.resolve("../src/services/postService");
  const projectServiceModulePath = require.resolve("../src/services/projectService");
  delete require.cache[postServiceModulePath];
  delete require.cache[projectServiceModulePath];
  const postService = require("../src/services/postService");
  const projectService = require("../src/services/projectService");

  async function createAuthenticatedAgent() {
    const agent = request.agent(app);
    const credentials = {
      username: process.env.ADMIN_SEED_USERNAME,
      password: process.env.ADMIN_SEED_PASSWORD
    };

    await agent
      .post("/admin/login")
      .type("form")
      .send(credentials)
      .expect(302)
      .expect("Location", "/admin");

    return agent;
  }

  function cleanup() {
    database.closeDb();

    Object.entries(previousEnv).forEach(([key, value]) => {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });

    delete require.cache[appModulePath];
    delete require.cache[databaseModulePath];
    delete require.cache[postServiceModulePath];
    delete require.cache[projectServiceModulePath];
    delete require.cache[projectScreenshotServiceModulePath];

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        fs.rmSync(tempRoot, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === 4) {
          if (error && error.code === "EBUSY") {
            break;
          }

          throw error;
        }

        sleep(50);
      }
    }
  }

  return {
    app,
    cleanup,
    createAuthenticatedAgent,
    credentials: {
      username: process.env.ADMIN_SEED_USERNAME,
      password: process.env.ADMIN_SEED_PASSWORD
    },
    getPublishedPostSlug() {
      return postService.listPosts({ includeDrafts: false })[0]?.slug || null;
    },
    getPublishedProjectSlug() {
      return projectService.listProjects()[0]?.slug || null;
    },
    projectService
  };
}

module.exports = {
  createTestAppContext
};



