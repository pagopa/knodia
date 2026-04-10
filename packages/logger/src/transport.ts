import { levels } from "pino";
import build from "pino-abstract-transport";

const { labels } = levels;

/**
 * Pino transport that:
 * - Removes duplicate keys by parsing Pino log objects (last value wins)
 * - Moves the `msg` property to the top of the log object for better readability in CloudWatch logs
 * - Converts the numeric log level to an uppercase string (e.g. `30` → `"INFO"`)
 * - Writes logs to the specified stream (`stdout` or `stderr`)
 */
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
