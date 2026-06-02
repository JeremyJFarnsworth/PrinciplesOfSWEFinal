const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Path to the Next.js app to load next.config and .env files in the test environment.
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "node",
  // Pure logic, persistence, API handlers and the JSON store are all Node-side.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
};

module.exports = createJestConfig(customJestConfig);
