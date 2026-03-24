import path from "path";
import { fileURLToPath } from "url";

import config, { blockTestCommonsImports } from "./eslint.node.js";

export function createReadmodelConfig(importMetaUrl) {
  const folderName = path.basename(path.dirname(fileURLToPath(importMetaUrl)));
  const allowedReadmodelWriter = `@knodia/db-readmodel-${folderName.replace(
    "-readmodel-writer",
    "",
  )}/writer`;

  return [
    ...config,
    {
      files: ["**/src/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              blockTestCommonsImports,
              {
                group: [
                  "@knodia/db-readmodel-*/writer",
                  `!${allowedReadmodelWriter}`,
                ],
                message: `Only ${allowedReadmodelWriter} are allowed`,
              },
            ],
          },
        ],
      },
    },
  ];
}
