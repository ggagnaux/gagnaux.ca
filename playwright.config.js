const { defineConfig } = require("@playwright/test");

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);

module.exports = defineConfig({
  testDir: "./browser-tests",
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "msedge",
    headless: true,
    trace: "retain-on-failure"
  },
  webServer: {
    command: `node test-support/browser-server.js`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      PORT: String(port),
      PLAYWRIGHT_PORT: String(port)
    }
  }
});
