import { z } from "zod";

const TextFragment = z.strictObject({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  text: z.string(),
});

// Address doubles as link text and body text; no separate label.
const EmailFragment = z.strictObject({
  email: z.email(),
});

// External hyperlink: `text` is the visible label, `url` the destination.
const LinkFragment = z.strictObject({
  text: z.string(),
  url: z.url(),
});

export const Fragment = z.union([EmailFragment, LinkFragment, TextFragment]);
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

export const AccessibilityDocument = z.strictObject({
  blocks: z.array(Block),
});
export type AccessibilityDocument = z.infer<typeof AccessibilityDocument>;
