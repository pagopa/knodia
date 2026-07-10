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
  // Starts at 2: the page renders its own single h1, so content nests under it.
  level: z.number().int().min(2).max(6),
  type: z.literal("heading"),
});

const ParagraphBlock = z.strictObject({
  content: z.array(Fragment),
  type: z.literal("paragraph"),
});

// Each item is its own run of fragments; rendered as a semantic <ul>/<li>.
const ListBlock = z.strictObject({
  items: z.array(z.array(Fragment)),
  type: z.literal("list"),
});

export const Block = z.discriminatedUnion("type", [
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
]);
export type Block = z.infer<typeof Block>;

export const AccessibilityDocument = z.strictObject({
  blocks: z.array(Block),
});
export type AccessibilityDocument = z.infer<typeof AccessibilityDocument>;
