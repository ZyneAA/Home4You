import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default defineConfig(
  {
    ignores: ["build/", "node_modules/", "dist/", "coverage/", "src/tests"],
  },
  prettier,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.mts"],

    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.node,
        ...globals.tseslint,
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-explicit-any": "off",

      "no-undef": "off",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
      "no-console": "warn",
      curly: ["error", "all"],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "object-shorthand": "error",
      "arrow-body-style": ["error", "as-needed"],
      "prefer-arrow-callback": "error",
      "no-multi-spaces": "error",
      quotes: ["error", "double", { avoidEscape: true }],
      semi: ["error", "always"],
      indent: ["error", 2, { SwitchCase: 1 }],
      "comma-dangle": ["error", "always-multiline"],
      "import/extensions": "off",
      "import/no-unresolved": "off",
    },
  },
);
