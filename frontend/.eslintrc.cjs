module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  ignorePatterns: ["dist", "dev-dist", "node_modules", ".eslintrc.cjs"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // Security: ban dangerouslySetInnerHTML to keep XSS surface area minimal.
    "no-restricted-syntax": [
      "error",
      {
        selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
        message: "dangerouslySetInnerHTML is banned to keep XSS attack surface minimal.",
      },
    ],
  },
};
