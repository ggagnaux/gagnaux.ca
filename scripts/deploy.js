const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const defaultRootDir = path.resolve(__dirname, "..");
const defaultBuildDir = path.join(defaultRootDir, "build");
const defaultDeployDir = path.join(defaultRootDir, "deploy");

function printUsage() {
  console.log("Usage: npm run deploy [-- --target <directory>] [--skip-build] [--skip-install] [--skip-init-db] [--skip-minify-js]");
}

function parseArguments(argv, env = process.env) {
  const options = {
    skipBuild: false,
    skipInstall: false,
    skipInitDb: false,
    skipMinifyJs: false,
    target: env.DEPLOY_DIR || defaultDeployDir
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--target") {
      options.target = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--skip-build") {
      options.skipBuild = true;
      continue;
    }

    if (arg === "--skip-install") {
      options.skipInstall = true;
      continue;
    }

    if (arg === "--skip-init-db") {
      options.skipInitDb = true;
      continue;
    }

    if (arg === "--skip-minify-js") {
      options.skipMinifyJs = true;
    }
  }

  return options;
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function syncBuildToTarget(buildDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(buildDir, { withFileTypes: true })) {
    const sourcePath = path.join(buildDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }

  fs.mkdirSync(path.join(targetDir, "public", "uploads"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "db"), { recursive: true });
}

function transformEnvironmentSections(content) {
  const devStart = "# Development Environment - Start";
  const devEnd = "# Development Environment - End";
  const prodStart = "# Production Environment - Start";
  const prodEnd = "# Production Environment - End";
  const lines = content.split(/\r?\n/);

  let insideDevelopment = false;
  let insideProduction = false;
  let sawDevStart = false;
  let sawDevEnd = false;
  let sawProdStart = false;
  let sawProdEnd = false;

  const transformedLines = lines.map((line) => {
    if (line === devStart) {
      insideDevelopment = true;
      sawDevStart = true;
      return line;
    }

    if (line === devEnd) {
      insideDevelopment = false;
      sawDevEnd = true;
      return line;
    }

    if (line === prodStart) {
      insideProduction = true;
      sawProdStart = true;
      return line;
    }

    if (line === prodEnd) {
      insideProduction = false;
      sawProdEnd = true;
      return line;
    }

    if (insideDevelopment) {
      if (!line.trim()) {
        return line;
      }

      return /^\s*#/.test(line) ? line : `#${line}`;
    }

    if (insideProduction) {
      return line.replace(/^(\s*)#\s?/, "$1");
    }

    return line;
  });

  if (!sawDevStart || !sawDevEnd || !sawProdStart || !sawProdEnd) {
    throw new Error(
      "The root .env file must include '# Development Environment - Start/End' and '# Production Environment - Start/End' markers."
    );
  }

  return transformedLines.join("\n");
}

function copyDeploymentEnvironment(rootDir, targetDir) {
  const sourceEnvPath = path.join(rootDir, ".env");
  const targetEnvPath = path.join(targetDir, ".env");

  if (!fs.existsSync(sourceEnvPath)) {
    console.warn(`No source .env found at ${sourceEnvPath}. Skipping deployment .env copy.`);
    return;
  }

  const sourceContent = fs.readFileSync(sourceEnvPath, "utf8");
  const transformedContent = transformEnvironmentSections(sourceContent);
  fs.writeFileSync(targetEnvPath, transformedContent, "utf8");
}

function warnAboutEnvironment(targetDir) {
  const envPath = path.join(targetDir, ".env");

  if (!fs.existsSync(envPath)) {
    console.warn(`No .env found at ${envPath}. Create one before starting the deployed app.`);
  }
}

function deployProject(options = {}) {
  const rootDir = options.rootDir || defaultRootDir;
  const buildDir = options.buildDir || path.join(rootDir, "build");
  const parsedOptions = options.parsedOptions || parseArguments(options.argv || [], options.env);
  const targetDir = path.resolve(rootDir, parsedOptions.target || path.join(rootDir, "deploy"));
  const commandRunner = options.runCommand || runCommand;

  if (!parsedOptions.skipBuild) {
    const buildArgs = [path.join(rootDir, "scripts", "build.js")];
    if (parsedOptions.skipMinifyJs) {
      buildArgs.push("--skip-minify-js");
    }
    commandRunner(process.execPath, buildArgs, rootDir);
  }

  if (!fs.existsSync(buildDir)) {
    console.error(`Build directory not found at ${buildDir}. Run npm run build first.`);
    process.exit(1);
  }

  syncBuildToTarget(buildDir, targetDir);
  copyDeploymentEnvironment(rootDir, targetDir);

  if (!parsedOptions.skipInstall) {
    commandRunner(process.platform === "win32" ? "npm.cmd" : "npm", ["ci", "--omit=dev"], targetDir);
  }

  if (!parsedOptions.skipInitDb) {
    commandRunner(process.execPath, [path.join(targetDir, "scripts", "init-db.js")], targetDir);
  }

  warnAboutEnvironment(targetDir);

  console.log(`Deploy completed to ${targetDir}`);
  console.log("Start the app with NODE_ENV=production node server.js");

  return targetDir;
}

function main(argv = process.argv.slice(2)) {
  deployProject({
    rootDir: defaultRootDir,
    buildDir: defaultBuildDir,
    argv,
    env: process.env
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  defaultRootDir,
  defaultBuildDir,
  defaultDeployDir,
  printUsage,
  parseArguments,
  runCommand,
  copyDirectory,
  syncBuildToTarget,
  transformEnvironmentSections,
  copyDeploymentEnvironment,
  warnAboutEnvironment,
  deployProject,
  main
};
