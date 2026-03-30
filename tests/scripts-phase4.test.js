const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const buildScript = require("../scripts/build");
const deployScript = require("../scripts/deploy");

function createTempProjectRoot() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "gagnaux-phase4-"));
  const writeFile = (relativePath, content) => {
    const filePath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
  };

  writeFile("package.json", JSON.stringify({ name: "temp-app", version: "1.0.0" }, null, 2));
  writeFile("package-lock.json", JSON.stringify({ name: "temp-app", lockfileVersion: 3 }, null, 2));
  writeFile("server.js", "module.exports = {};\n");
  writeFile(".env.example", "EXAMPLE=true\n");
  writeFile("src/app.js", "module.exports = 'app';\n");
  writeFile("views/index.njk", "<h1>Temp</h1>\n");
  writeFile(
    "public/assets/js/site.js",
    "function greet(name) {\n  const message = 'hello ' + name;\n  console.log(message);\n}\n\ngreet('world');\n"
  );
  writeFile("public/assets/js/vendor.min.js", "window.vendor=1;\n");
  writeFile("public/uploads/.gitkeep", "");
  writeFile("public/uploads/should-not-copy.txt", "ignore me\n");
  writeFile("db/schema.sql", "CREATE TABLE example (id INTEGER PRIMARY KEY);\n");
  writeFile("db/site.sqlite", "not a real sqlite file but should be excluded\n");
  writeFile("scripts/init-db.js", "console.log('init db');\n");

  return {
    rootDir,
    cleanup() {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  };
}

test("buildProject creates build output and minifies client-side JavaScript by default", async () => {
  const fixture = createTempProjectRoot();

  try {
    const buildDir = path.join(fixture.rootDir, "build");
    const sourceJs = fs.readFileSync(path.join(fixture.rootDir, "public/assets/js/site.js"), "utf8");

    const resultBuildDir = await buildScript.buildProject({
      rootDir: fixture.rootDir,
      buildDir,
      validateServer: false
    });

    const builtJsPath = path.join(buildDir, "public/assets/js/site.js");
    const builtJs = fs.readFileSync(builtJsPath, "utf8");

    assert.equal(resultBuildDir, buildDir);
    assert.equal(fs.existsSync(path.join(buildDir, "package.json")), true);
    assert.equal(fs.existsSync(path.join(buildDir, "src/app.js")), true);
    assert.equal(fs.existsSync(path.join(buildDir, "views/index.njk")), true);
    assert.equal(fs.existsSync(path.join(buildDir, "scripts/init-db.js")), true);
    assert.equal(fs.existsSync(path.join(buildDir, "public/uploads/.gitkeep")), true);
    assert.equal(fs.existsSync(path.join(buildDir, "public/uploads/should-not-copy.txt")), false);
    assert.equal(fs.existsSync(path.join(buildDir, "db/site.sqlite")), false);
    assert.equal(fs.readFileSync(path.join(buildDir, "public/assets/js/vendor.min.js"), "utf8"), "window.vendor=1;\n");
    assert.notEqual(builtJs, sourceJs);
    assert.ok(builtJs.length < sourceJs.length);
    assert.match(builtJs, /console\.log/);
  } finally {
    fixture.cleanup();
  }
});

test("buildProject preserves client-side JavaScript when minification is disabled", async () => {
  const fixture = createTempProjectRoot();

  try {
    const buildDir = path.join(fixture.rootDir, "build");
    const sourceJs = fs.readFileSync(path.join(fixture.rootDir, "public/assets/js/site.js"), "utf8");

    await buildScript.buildProject({
      rootDir: fixture.rootDir,
      buildDir,
      minifyJs: false,
      validateServer: false
    });

    const builtJs = fs.readFileSync(path.join(buildDir, "public/assets/js/site.js"), "utf8");
    assert.equal(builtJs, sourceJs);
  } finally {
    fixture.cleanup();
  }
});

test("deployProject defaults to a local deploy folder and transforms the copied .env", () => {
  const fixture = createTempProjectRoot();

  try {
    const buildDir = path.join(fixture.rootDir, "build");
    const sourceEnv = [
      "BASE=true",
      "# Development Environment - Start",
      "NODE_ENV=development",
      "API_URL=http://localhost:3000",
      "# Development Environment - End",
      "# Production Environment - Start",
      "# NODE_ENV=production",
      "# API_URL=https://example.com",
      "# Production Environment - End"
    ].join("\n");

    fs.writeFileSync(path.join(fixture.rootDir, ".env"), sourceEnv, "utf8");
    fs.mkdirSync(path.join(buildDir, "public/uploads"), { recursive: true });
    fs.mkdirSync(path.join(buildDir, "db"), { recursive: true });
    fs.mkdirSync(path.join(buildDir, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(buildDir, "server.js"), "module.exports = {};\n", "utf8");
    fs.writeFileSync(path.join(buildDir, "scripts/init-db.js"), "console.log('init db');\n", "utf8");

    const commands = [];
    const targetDir = deployScript.deployProject({
      rootDir: fixture.rootDir,
      buildDir,
      parsedOptions: {
        skipBuild: true,
        skipInstall: true,
        skipInitDb: true,
        skipMinifyJs: false
      },
      runCommand(command, args, cwd) {
        commands.push({ command, args, cwd });
      }
    });

    const deployedEnv = fs.readFileSync(path.join(targetDir, ".env"), "utf8");

    assert.equal(targetDir, path.join(fixture.rootDir, "deploy"));
    assert.equal(fs.existsSync(path.join(targetDir, "server.js")), true);
    assert.equal(fs.existsSync(path.join(targetDir, "public/uploads")), true);
    assert.equal(fs.existsSync(path.join(targetDir, "db")), true);
    assert.equal(commands.length, 0);
    assert.match(deployedEnv, /#NODE_ENV=development/);
    assert.match(deployedEnv, /#API_URL=http:\/\/localhost:3000/);
    assert.match(deployedEnv, /^NODE_ENV=production$/m);
    assert.match(deployedEnv, /^API_URL=https:\/\/example.com$/m);
  } finally {
    fixture.cleanup();
  }
});

test("transformEnvironmentSections throws when required environment markers are missing", () => {
  assert.throws(
    () => deployScript.transformEnvironmentSections("NODE_ENV=development\nNODE_ENV=production\n"),
    /must include .*markers/i
  );
});

