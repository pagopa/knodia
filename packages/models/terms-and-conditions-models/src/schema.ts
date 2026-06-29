import { z } from "zod";

// `bold`/`italic` are display-only: excluded from the canonical digest text.
export const TextFragment = z.strictObject({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  text: z.string(),
});
export type TextFragment = z.infer<typeof TextFragment>;

export const PlaceholderKind = z.enum(["version", "date"]);
export type PlaceholderKind = z.infer<typeof PlaceholderKind>;

// Carries no inline value — substituted identically on render and digest, so the two can't diverge.
export const PlaceholderFragment = z.strictObject({
  placeholder: PlaceholderKind,
});
export type PlaceholderFragment = z.infer<typeof PlaceholderFragment>;

// The address doubles as the visible link text and the digest text — there is no separate label.
export const EmailFragment = z.strictObject({
  email: z.email(),
});
export type EmailFragment = z.infer<typeof EmailFragment>;

export const Fragment = z.union([
  PlaceholderFragment,
  EmailFragment,
  TextFragment,
]);
export type Fragment = z.infer<typeof Fragment>;

export const HeadingBlock = z.strictObject({
  content: z.array(Fragment),
  level: z.number().int().min(1).max(6),
  type: z.literal("heading"),
});
export type HeadingBlock = z.infer<typeof HeadingBlock>;

export const ParagraphBlock = z.strictObject({
  content: z.array(Fragment),
  indent: z.number().int().positive().optional(),
  marker: z.string().min(1).optional(),
  type: z.literal("paragraph"),
});
export type ParagraphBlock = z.infer<typeof ParagraphBlock>;

export const Block = z.discriminatedUnion("type", [
  HeadingBlock,
  ParagraphBlock,
]);
export type Block = z.infer<typeof Block>;

export const TermsDocument = z.strictObject({
  blocks: z.array(Block),
});
export type TermsDocument = z.infer<typeof TermsDocument>;
