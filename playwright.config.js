const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 15000,
  retries: 1,
  use: {
    headless: true,
    baseURL: 'http://localhost:8080',
  },
  webServer: [
    {
      command: 'npx serve . -l 8080',
      port: 8080,
      reuseExistingServer: true,
      timeout: 10000,
    },
    {
      command: 'cd server && NODE_ENV=test node index.js',
      port: 3000,
      reuseExistingServer: true,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
