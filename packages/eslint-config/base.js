/**
 * ESLint base configuration shared across environments, web and node.
 */
import pagopa from "@pagopa/eslint-config";

export const config = [
  ...pagopa,
  {
    rules: {
      "no-useless-rename": ["error"],
      "object-shorthand": ["error", "always"],
    },
  },
];
