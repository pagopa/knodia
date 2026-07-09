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
    <div className="flex flex-col [&>*:first-child]:mt-0">
      {document.blocks.map((block, index) => (
        <BlockNode block={block} key={index} />
      ))}
    </div>
  );
}

function BlockNode({ block }: { block: Block }) {
  return match(block)
    .with({ type: "heading" }, (heading) => {
      const Heading = `h${heading.level}` as keyof JSX.IntrinsicElements;
      return (
        <Heading
          className={`${headingClassName(heading.level)} text-primary-violet`}
        >
          <Fragments fragments={heading.content} />
        </Heading>
      );
    })
    .with({ type: "paragraph" }, (paragraph) => (
      <p className="text-style-body mt-4 text-neutral-graphite">
        <Fragments fragments={paragraph.content} />
      </p>
    ))
    .with({ type: "list" }, (list) => (
      <ul className="text-style-body mt-3 list-disc space-y-1.5 pl-6 text-neutral-graphite">
        {list.items.map((item, index) => (
          <li key={index}>
            <Fragments fragments={item} />
          </li>
        ))}
      </ul>
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

function Fragments({ fragments }: { fragments: Fragment[] }) {
  return fragments.map((fragment, index) => (
    <FragmentNode fragment={fragment} key={index} />
  ));
}

// Level → visual tier + top margin. Levels start at 2 (the page owns the h1);
// sections (h3) get a wide gap, sub-sections (h4) a smaller one.
function headingClassName(level: number): string {
  return match(level)
    .with(2, () => "text-style-section-title mt-12")
    .with(3, () => "text-style-subheading mt-12")
    .otherwise(() => "font-heading text-[20px] leading-7 font-semibold mt-8");
}
