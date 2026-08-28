const { getJestConfig } = require("@storybook/test-runner");

const config = getJestConfig();

// Retained consumers are evidence, not Storybook source. Their identical package
// names must not enter Jest's module map or compete with workspace resolution.
module.exports = {
  ...config,
  modulePathIgnorePatterns: [
    ...(config.modulePathIgnorePatterns ?? []),
    "<rootDir>/quality/evidence/"
  ]
};
