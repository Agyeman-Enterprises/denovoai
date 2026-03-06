import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "npm run dev -- --hostname 0.0.0.0 --port 3000",
    port: 3000,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true
  }
});
