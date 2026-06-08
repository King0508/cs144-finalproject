import { defineConfig } from "vitest/config";

// Separate config so the rules suite (which talks to the running Firestore
// emulator) doesn't run during normal `npm test`. Used by `npm run test:rules`,
// which is invoked under `firebase emulators:exec`.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/rules/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
