import {
  type Block,
  type Fragment,
  PlaceholderKind,
  type TermsDocument,
} from "@knodia/terms-and-conditions-models";
import { type JSX } from "react";
import { match, P } from "ts-pattern";

import { Link } from "@/components/ui";

interface TermsRendererProps {
  date: string;
  document: TermsDocument;
  knodiaVersion: string;
}

// Renders the same structured document the backend hashes, so shown and hashed text can't diverge.
export function TermsRenderer({
  date,
  document,
  knodiaVersion,
}: TermsRendererProps) {
  return (
    <div className="flex flex-col gap-4">
      {document.blocks.map((block, index) => (
        <BlockNode
          block={block}
          date={date}
          key={index}
          knodiaVersion={knodiaVersion}
        />
      ))}
    </div>
  );
}

function BlockNode({
  block,
  date,
  knodiaVersion,
}: {
  block: Block;
  date: string;
  knodiaVersion: string;
}) {
  const children = block.content.map((fragment, index) => (
    <FragmentNode
      date={date}
      fragment={fragment}
      key={index}
      knodiaVersion={knodiaVersion}
    />
  ));

  return match(block)
    .with({ type: "heading" }, (heading) => {
      // Map level to h1..h6 so the outline stays correct for assistive tech.
      const Heading = `h${heading.level}` as keyof JSX.IntrinsicElements;
      const className =
        heading.level === 1
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

function FragmentNode({
  date,
  fragment,
  knodiaVersion,
}: {
  date: string;
  fragment: Fragment;
  knodiaVersion: string;
}) {
  return match(fragment)
    .with({ placeholder: PlaceholderKind.enum.knodiaVersion }, () => (
      <>{knodiaVersion}</>
    ))
    .with({ placeholder: PlaceholderKind.enum.date }, () => <>{date}</>)
    .with({ email: P.string }, (f) => (
      <Link href={`mailto:${f.email}`}>{f.email}</Link>
    ))
    .with({ bold: true }, (f) => <strong>{f.text}</strong>)
    .with({ italic: true }, (f) => <em>{f.text}</em>)
    .with({ text: P.string }, (f) => <>{f.text}</>)
    .exhaustive();
}
