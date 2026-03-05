import { getAttribute } from "@knodia/attribute-models";
import { BookOpenTextIcon, SealCheckIcon } from "@phosphor-icons/react";
import { Fragment } from "react";

import type { SchemeRef } from "../types/schemeRef";

interface AttributeWithPossession extends SchemeRef {
  possessed?: boolean;
}

export function AttributeGroupContainer({
  attributes,
}: {
  attributes: AttributeWithPossession[];
}) {
  const isGroupSatisfied = attributes.some((attr) => attr.possessed === true);

  return (
    <div
      className={`flex items-center gap-4 py-3 px-4 rounded-lg body-md text-secondary-light-mid-contrast ${
        isGroupSatisfied ? "bg-success-light" : "bg-secondary-light"
      }`}
    >
      {attributes.map((attribute, index) => (
        <Fragment key={`${attribute.scheme}$${attribute.code}`}>
          {index > 0 && (
            <span className="body-sm text-secondary-light-low-contrast">
              or
            </span>
          )}
          <span
            className={`flex gap-1 ${attribute.possessed ? "body-md-em text-primary-dark" : ""}`}
          >
            {getAttribute(attribute)?.name ?? attribute.code}
            <BookOpenTextIcon size={20} />
          </span>
        </Fragment>
      ))}
      {isGroupSatisfied && (
        <SealCheckIcon
          className="ml-auto shrink-0 text-success-light-low-contrast"
          size={24}
          weight="fill"
        />
      )}
    </div>
  );
}
