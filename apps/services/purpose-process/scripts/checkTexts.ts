import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMAS_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "seed",
  "forms",
);
const REFERENCE_LANG = "en";

type Dict = Record<string, string>;

function checkLangsAligned(
  dicts: Map<string, Dict>,
  version: string,
  prefix: string,
) {
  const reference = dicts.get(REFERENCE_LANG);
  if (!reference) return;
  for (const [lang, dict] of dicts) {
    if (lang === REFERENCE_LANG) continue;
    const missing = Object.keys(reference).filter((k) => !(k in dict));
    const extra = Object.keys(dict).filter((k) => !(k in reference));
    if (missing.length > 0 || extra.length > 0) {
      fail(
        `[${version}/${lang}] ${prefix}.${lang}.json differs from ${prefix}.${REFERENCE_LANG}.json: missing=${missing.length}, extra=${extra.length}`,
      );
    }
  }
}

function fail(message: string) {
  console.error(message);
  process.exitCode = 1;
}

function readDicts(versionDir: string, prefix: string): Map<string, Dict> {
  const dicts = new Map<string, Dict>();
  for (const file of readdirSync(versionDir)) {
    const match = new RegExp(`^${prefix}\\.([^.]+)\\.json$`).exec(file);
    if (!match?.[1]) continue;
    dicts.set(
      match[1],
      JSON.parse(readFileSync(join(versionDir, file), "utf8")),
    );
  }
  return dicts;
}

for (const version of readdirSync(SCHEMAS_ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)) {
  const versionDir = join(SCHEMAS_ROOT, version);
  const texts = readDicts(versionDir, "texts");
  const uiTexts = readDicts(versionDir, "ui-texts");

  for (const [lang, dict] of texts) {
    const ui = uiTexts.get(lang);
    if (!ui) {
      fail(`[${version}/${lang}] missing ui-texts.${lang}.json`);
      continue;
    }
    const overlap = Object.keys(dict).filter((k) => k in ui);
    if (overlap.length > 0) {
      fail(
        `[${version}/${lang}] duplicate keys across texts and ui-texts:\n  - ${overlap.join("\n  - ")}`,
      );
    }
  }

  for (const lang of uiTexts.keys()) {
    if (!texts.has(lang)) {
      fail(`[${version}/${lang}] missing texts.${lang}.json`);
    }
  }

  checkLangsAligned(texts, version, "texts");
  checkLangsAligned(uiTexts, version, "ui-texts");
}

if (process.exitCode !== 1) {
  console.log("check-texts: all texts files are disjoint and aligned.");
}
