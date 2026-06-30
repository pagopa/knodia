import { match, P } from "ts-pattern";

import {
  type Fragment,
  PlaceholderKind,
  type TermsDocument,
} from "./schema.ts";

interface TermsValues {
  /** Formatted acceptance date, e.g. "25 giugno 2026". */
  date: string;
  /** Display label of the version, e.g. "ver. 1". */
  version: string;
}

// Canonical text that gets hashed at acceptance (legal proof). The exact form is
// pinned here on purpose — it must stay reproducible for years, so keep it byte-stable:
//   - blocks in reading order, joined by "\n";
//   - within a block, fragments concatenated directly (no separator — spaces live in
//     the source JSON, which is the source of truth);
//   - a paragraph `marker` becomes the literal prefix `${marker} `;
//   - email fragments contribute their address as text (same as the visible link text);
//   - heading text is included; `level`/`indent`/`bold`/`italic` are display-only, excluded;
//   - no trimming, no whitespace collapsing;
//   - NFC over the whole string.
export function toAcceptedText(
  doc: TermsDocument,
  values: TermsValues,
): string {
  return doc.blocks
    .map((block) => {
      const prefix =
        block.type === "paragraph" && block.marker ? `${block.marker} ` : "";
      const body = block.content
        .map((fragment) => fragmentText(fragment, values))
        .join("");
      return prefix + body;
    })
    .join("\n")
    .normalize("NFC");
}

function fragmentText(fragment: Fragment, values: TermsValues): string {
  return match(fragment)
    .with({ placeholder: PlaceholderKind.enum.version }, () => values.version)
    .with({ placeholder: PlaceholderKind.enum.date }, () => values.date)
    .with({ email: P.string }, (f) => f.email)
    .with({ text: P.string }, (f) => f.text)
    .exhaustive();
}
