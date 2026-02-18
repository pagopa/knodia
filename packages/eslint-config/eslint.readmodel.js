import config, { blockTestCommonsImports } from "./eslint.node.js";
import path from "path";

const cwd = process.cwd();
const folderName = path.basename(cwd);
const allowedReadmodelWriter = `@knodia/db-readmodel-${folderName.replace(
  "-readmodel-writer",
  ""
)}/writer`;

export default [
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
