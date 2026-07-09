import {
  type AccessibilityDocument,
  type Block,
  type Fragment,
} from "@knodia/accessibility-models";
import { type JSX } from "react";
import { match, P } from "ts-pattern";

import { OpenInNewIcon } from "@/components/icons";
import { Link } from "@/components/ui";

interface AccessibilityRendererProps {
  document: AccessibilityDocument;
}

export function AccessibilityRenderer({
  document,
}: AccessibilityRendererProps) {
  return (
    <div className="flex flex-col gap-6">
      {document.blocks.map((block, index) => (
        <BlockNode block={block} key={index} />
      ))}
    </div>
  );
}

function BlockNode({ block }: { block: Block }) {
  const children = block.content.map((fragment, index) => (
    <FragmentNode fragment={fragment} key={index} />
  ));

  return match(block)
    .with({ type: "heading" }, (heading) => {
      // Map level to h2..h6 so the outline nests under the page's single h1.
      const Heading = `h${heading.level}` as keyof JSX.IntrinsicElements;
      const className =
        heading.level <= 2
          ? "text-style-section-title text-primary-violet"
          : "text-style-subheading text-primary-violet";
      return <Heading className={className}>{children}</Heading>;
    })
    .with({ type: "paragraph" }, (paragraph) => (
      <p
        className="text-style-body text-neutral-graphite"
        style={
          paragraph.indent
            ? { marginLeft: `${paragraph.indent * 1.5}rem` }
            : undefined
        }
      >
        {paragraph.marker ? `${paragraph.marker} ` : ""}
        {children}
      </p>
    ))
    .exhaustive();
}

function FragmentNode({ fragment }: { fragment: Fragment }) {
  return match(fragment)
    .with({ email: P.string }, (f) => (
      <Link href={`mailto:${f.email}`}>{f.email}</Link>
    ))
    .with({ url: P.string }, (f) => (
      <Link
        className="inline-flex items-center gap-2 text-[18px] leading-7 font-medium tracking-normal no-underline"
        href={f.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {f.text}
        <OpenInNewIcon className="size-6 shrink-0" />
        <span className="sr-only"> (opens in a new tab)</span>
      </Link>
    ))
    .with({ bold: true }, (f) => <strong>{f.text}</strong>)
    .with({ italic: true }, (f) => <em>{f.text}</em>)
    .with({ text: P.string }, (f) => <>{f.text}</>)
    .exhaustive();
}
