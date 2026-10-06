import { destination, levels } from "pino";
import build from "pino-abstract-transport";

const { labels } = levels;
const STDOUT_FILE_DESCRIPTOR = 1;
const STDERR_FILE_DESCRIPTOR = 2;

/**
 * Pino transport that:
 * - Removes duplicate keys by parsing Pino log objects (last value wins)
 * - Moves the `msg` property to the top of the log object for better readability in CloudWatch logs
 * - Converts the numeric log level to an uppercase string (e.g. `30` → `"INFO"`)
 * - Writes logs to the specified stream (`stdout` or `stderr`)
 */
export default function (options = { stream: "stdout" }) {
  // Write straight to the file descriptors: this code runs in pino's worker
  // thread, where process.stdout only forwards to the main thread, and the
  // lines still being forwarded are lost when the process exits.
  const dest = destination({
    dest:
      options.stream === "stderr"
        ? STDERR_FILE_DESCRIPTOR
        : STDOUT_FILE_DESCRIPTOR,
    sync: true,
  });

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
