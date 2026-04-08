import { levels } from "pino";
import build from "pino-abstract-transport";

const { labels } = levels;

export default function (options = { stream: "stdout" }) {
  const dest = options.stream === "stderr" ? process.stderr : process.stdout;

  return build(async (source) => {
    for await (const obj of source) {
      const { level, msg, ...rest } = obj;

      const log = {
        ...(msg !== undefined && { msg }),
        level: (labels[Number(level)] ?? String(level)).toUpperCase(),
        ...rest,
      };

      dest.write(JSON.stringify(log) + "\n");
    }
  });
}
