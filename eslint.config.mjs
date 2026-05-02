import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module"
      },
      globals: {
        ...globals.node
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "no-relative-import-paths": noRelativeImportPaths
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
      "arrow-body-style": ["warn", "as-needed"],
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/explicit-function-return-type": ["warn", { "allowExpressions": true }],
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        { "allowSameFolder": true, "rootDir": "src", "prefix": "@" }
      ],
      "no-restricted-syntax": [
        "error",
        {
          "selector": "TSUnknownKeyword",
          "message": "Usage of 'unknown' is disallowed in types. Use concrete types or union types instead."
        }
      ]

    }
  },
  {
    files: ["src/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": "off"
    }
  },
  prettierConfig,
  {
    ignores: ["dist/**", "node_modules/**"]
  }
];
