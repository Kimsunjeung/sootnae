import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/setupTests.ts"],
    globals: true,
    css: true,
    // 서버 쪽 테스트는 Node 환경으로 자동 전환
    environmentMatchGlobs: [["**/server/**", "node"]],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
    },
    exclude: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      ".vscode",
      ".idea",
    ],
  },
});

