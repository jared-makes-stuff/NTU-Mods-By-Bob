import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);

if (Number.isNaN(port)) {
  throw new Error("PORT must be a valid number for Playwright.");
}

const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port,
    reuseExistingServer: !process.env.CI,
  },
});
