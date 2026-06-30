import { match, P } from "ts-pattern";

import {
  type Fragment,
  PlaceholderKind,
  type TermsDocument,
} from "./schema.ts";

interface TermsValues {
  date: string;
  version: string;
}

// This text is hashed at acceptance (legal proof), so the exact bytes must stay
// reproducible: no trimming or whitespace collapsing (spaces come from the source JSON),
// display-only attributes (level/indent/bold/italic) excluded, NFC over the whole string.
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
