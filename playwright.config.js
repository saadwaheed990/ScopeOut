const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  use: {
    headless: true,
    baseURL: 'http://localhost:8080',
  },
  webServer: {
    command: 'npx serve . -l 8080',
    port: 8080,
    reuseExistingServer: true,
    timeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
