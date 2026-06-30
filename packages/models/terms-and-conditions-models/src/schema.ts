import { z } from "zod";

// `bold`/`italic` are display-only: excluded from the canonical digest text.
const TextFragment = z.strictObject({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  text: z.string(),
});

export const PlaceholderKind = z.enum(["version", "date"]);
export type PlaceholderKind = z.infer<typeof PlaceholderKind>;

// No inline value: substituted identically on render and digest, so they can't diverge.
const PlaceholderFragment = z.strictObject({
  placeholder: PlaceholderKind,
});

// Address doubles as link text and digest text; no separate label.
const EmailFragment = z.strictObject({
  email: z.email(),
});

export const Fragment = z.union([
  PlaceholderFragment,
  EmailFragment,
  TextFragment,
]);
export type Fragment = z.infer<typeof Fragment>;

const HeadingBlock = z.strictObject({
  content: z.array(Fragment),
  level: z.number().int().min(1).max(6),
  type: z.literal("heading"),
});

const ParagraphBlock = z.strictObject({
  content: z.array(Fragment),
  indent: z.number().int().positive().optional(),
  marker: z.string().min(1).optional(),
  type: z.literal("paragraph"),
});

export const Block = z.discriminatedUnion("type", [
  HeadingBlock,
  ParagraphBlock,
]);
export type Block = z.infer<typeof Block>;

export const TermsDocument = z.strictObject({
  blocks: z.array(Block),
});
export type TermsDocument = z.infer<typeof TermsDocument>;
