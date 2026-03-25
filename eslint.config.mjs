import nextCoreWebVitals from "eslint-config-next/core-web-vitals.js";
import typescriptEslint from "typescript-eslint";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptEslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    rules: {
      "react-hooks/error-boundaries": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "max-lines": [
        "error",
        { max: 700, skipBlankLines: true, skipComments: true },
      ],
    },
  },
];

export default eslintConfig;
