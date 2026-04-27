import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const SCHEMAS_ROOTS = readdirSync(SRC_ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name.startsWith("schemas-"))
  .map((e) => join(SRC_ROOT, e.name));
const REFERENCE_LANG = "en";

type Dict = Record<string, string>;

function checkFormSchemaFolder(schemasRoot: string, version: string) {
  const versionDir = join(schemasRoot, version);
  const label = `${basename(schemasRoot)}/${version}`;
  const texts = readDicts(versionDir, "texts");
  const uiTexts = readDicts(versionDir, "ui-texts");

  for (const [lang, dict] of texts) {
    const ui = uiTexts.get(lang);
    if (!ui) {
      fail(`[${label}/${lang}] missing ui-texts.${lang}.json`);
      continue;
    }
    const overlap = Object.keys(dict).filter((k) => k in ui);
    if (overlap.length > 0) {
      fail(
        `[${label}/${lang}] duplicate keys across texts and ui-texts:\n  - ${overlap.join("\n  - ")}`,
      );
    }
  }

  for (const lang of uiTexts.keys()) {
    if (!texts.has(lang)) {
      fail(`[${label}/${lang}] missing texts.${lang}.json`);
    }
  }

  checkLangsAligned(texts, label, "texts");
  checkLangsAligned(uiTexts, label, "ui-texts");
}

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

for (const schemasRoot of SCHEMAS_ROOTS) {
  for (const version of readdirSync(schemasRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)) {
    checkFormSchemaFolder(schemasRoot, version);
  }
}

if (process.exitCode !== 1) {
  console.log("check-texts: all texts files are disjoint and aligned.");
}
