const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { minify } = require("terser");

const defaultRootDir = path.resolve(__dirname, "..");
const defaultBuildDir = path.join(defaultRootDir, "build");

const topLevelEntries = ["package.json", "package-lock.json", "server.js", ".env.example"];
const directoryEntries = ["src", "views"];

function parseArguments(argv) {
  return {
    minifyJs: !argv.includes("--skip-minify-js")
  };
}

function resetBuildDirectory(buildDir) {
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir, { recursive: true });
}

function copyFile(rootDir, buildDir, relativePath) {
  const sourcePath = path.join(rootDir, relativePath);

  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const targetPath = path.join(buildDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function copyDirectory(sourceDir, targetDir, filter) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    const shouldInclude = filter ? filter(sourcePath, entry) : true;

    if (!shouldInclude) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, filter);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function copyPublicAssets(rootDir, buildDir) {
  const publicDir = path.join(rootDir, "public");
  const targetPublicDir = path.join(buildDir, "public");

  copyDirectory(publicDir, targetPublicDir, (sourcePath, entry) => {
    const relativePath = path.relative(publicDir, sourcePath);

    if (entry.isDirectory() && relativePath === "uploads") {
      return false;
    }

    return true;
  });

  fs.mkdirSync(path.join(targetPublicDir, "uploads"), { recursive: true });

  const gitkeepSource = path.join(publicDir, "uploads", ".gitkeep");
  if (fs.existsSync(gitkeepSource)) {
    fs.copyFileSync(gitkeepSource, path.join(targetPublicDir, "uploads", ".gitkeep"));
  }
}

function copyDatabaseAssets(rootDir, buildDir) {
  const dbSourceDir = path.join(rootDir, "db");
  const dbTargetDir = path.join(buildDir, "db");

  copyDirectory(dbSourceDir, dbTargetDir, (sourcePath, entry) => {
    if (entry.isDirectory()) {
      return true;
    }

    return !/\.sqlite(?:[-\w.]*)?$/i.test(sourcePath);
  });
}

function copyRuntimeScripts(rootDir, buildDir) {
  copyFile(rootDir, buildDir, path.join("scripts", "init-db.js"));
}

function validateServerEntry(rootDir) {
  const result = spawnSync(process.execPath, ["--check", path.join(rootDir, "server.js")], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function collectJavaScriptFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectJavaScriptFiles(entryPath, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".min.js")) {
      files.push(entryPath);
    }
  }

  return files;
}

async function minifyBuiltJavaScript(buildDir) {
  const publicBuildDir = path.join(buildDir, "public");

  if (!fs.existsSync(publicBuildDir)) {
    return;
  }

  const jsFiles = collectJavaScriptFiles(publicBuildDir);

  for (const filePath of jsFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const result = await minify(source, {
      compress: true,
      mangle: true
    });

    if (!result.code) {
      throw new Error(`Failed to minify ${filePath}`);
    }

    fs.writeFileSync(filePath, result.code, "utf8");
  }
}

async function buildProject(options = {}) {
  const rootDir = options.rootDir || defaultRootDir;
  const buildDir = options.buildDir || path.join(rootDir, "build");
  const minifyJs = options.minifyJs !== false;
  const shouldValidateServer = options.validateServer !== false;

  resetBuildDirectory(buildDir);
  topLevelEntries.forEach((relativePath) => {
    copyFile(rootDir, buildDir, relativePath);
  });
  directoryEntries.forEach((relativeDir) => {
    copyDirectory(path.join(rootDir, relativeDir), path.join(buildDir, relativeDir));
  });
  copyPublicAssets(rootDir, buildDir);
  copyDatabaseAssets(rootDir, buildDir);
  copyRuntimeScripts(rootDir, buildDir);

  if (shouldValidateServer) {
    validateServerEntry(rootDir);
  }

  if (minifyJs) {
    await minifyBuiltJavaScript(buildDir);
  }

  return buildDir;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const buildDir = await buildProject({
    rootDir: defaultRootDir,
    buildDir: defaultBuildDir,
    minifyJs: options.minifyJs
  });

  console.log(`Build completed at ${buildDir}${options.minifyJs ? " with minified client-side JavaScript" : ""}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  defaultRootDir,
  defaultBuildDir,
  parseArguments,
  resetBuildDirectory,
  copyFile,
  copyDirectory,
  copyPublicAssets,
  copyDatabaseAssets,
  copyRuntimeScripts,
  validateServerEntry,
  collectJavaScriptFiles,
  minifyBuiltJavaScript,
  buildProject,
  main
};
