/**
 * ESLint base configuration shared across environments, web and node.
 */
import pagopa from "@pagopa/eslint-config";

export const config = [
  ...pagopa,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: false,
          fixStyle: "inline-type-imports",
        },
      ],
      "no-duplicate-imports": ["error"],
      "no-useless-rename": ["error"],
      "object-shorthand": ["error"],
    },
  },
];
