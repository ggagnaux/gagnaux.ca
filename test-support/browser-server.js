const fs = require("fs");
const os = require("os");
const path = require("path");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gagnaux-browser-"));
const dbPath = path.join(tempRoot, "site.sqlite");
const port = Number(process.env.PORT || 4173);

process.env.DATABASE_PATH = dbPath;
process.env.ADMIN_SEED_USERNAME = process.env.ADMIN_SEED_USERNAME || "testadmin";
process.env.ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "test-password-123";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = String(port);

const database = require("../src/config/database");
database.resetDb();
database.ensureDatabase();

const app = require("../src/app");
const server = app.listen(port, () => {
  console.log(`Browser test server listening on http://127.0.0.1:${port}`);
});

let cleanedUp = false;
function cleanup() {
  if (cleanedUp) {
    return;
  }

  cleanedUp = true;
  try {
    server.close();
  } catch (error) {
  }

  try {
    database.closeDb();
  } catch (error) {
  }

  fs.rmSync(tempRoot, { recursive: true, force: true });
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

process.on("exit", cleanup);
