const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "project": "tsconfig.json", "sourceType": "module" },
  "extends": [
      "eslint:recommended",
      "plugin:prettier/recommended",
      "plugin:sonarjs/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
  ],
  "root": true,
  "env": { "node": true, "jest": true, "es6": true },
  "ignorePatterns": [".eslintrc.js", "**/*.test.ts"],
  "rules": {
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
          "error",
          { "argsIgnorePattern": "^_" },
      ],
      "no-console": "error",
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      "object-curly-spacing": "off",
      "indent": ["error", 4],
      "new-cap": "off",
      "max-len": ["error", { "code": 90, "comments": 120 }],
      "global-require": "error",
      "handle-callback-err": ["error", "^(err|error)$"],
      "no-buffer-constructor": "error",
      "no-mixed-requires": ["error", { "grouping": true, "allowCall": true }],
      "no-path-concat": "error",
      "import/extensions": "off",
      "import/prefer-default-export": "off",
      "import/no-default-export": "error",
      "import/no-extraneous-dependencies": [
          "error",
          { "devDependencies": true },
      ],
      "prettier/prettier": ["error", { "endOfLine": "auto" }],
      "require-jsdoc": "off",
      "linebreak-style": "off",
      "import/no-unresolved": "error",
      "import/order": [
          "error",
          {
              "groups": [
                  "builtin",
                  "external",
                  "internal",
                  "sibling",
                  "parent",
                  "index",
                  "unknown",
              ],
              "pathGroups": [
                  {
                      "pattern": "@atc/*",
                      "group": "internal",
                      "position": "before",
                  },
              ],
              "pathGroupsExcludedImportTypes": ["builtin"],
              "distinctGroup": true,
              "newlines-between": "always",
              "alphabetize": { "order": "asc", "caseInsensitive": true },
          },
      ],
  },
  "plugins": [
      "@typescript-eslint/eslint-plugin",
      "eslint-plugin-prettier",
      "prettier",
      "import",
  ],
  "settings": {
      "import/resolver": {
          project,
          "node": { "extensions": [".js", ".jsx", ".ts", ".tsx"] },
          "typescript": { "project": "./tsconfig.json" },
      },
  },
};
