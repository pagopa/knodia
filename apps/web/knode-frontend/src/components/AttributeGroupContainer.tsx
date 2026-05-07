import { getAttribute } from "@knodia/attribute-models";
import {
  BookOpenTextIcon,
  ExclamationMarkIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { Fragment } from "react";

import type { SchemeRef } from "@/types/schemeRef";

interface AttributeWithPossession extends SchemeRef {
  possessed?: boolean;
}

export function AttributeGroupContainer({
  attributes,
}: {
  attributes: AttributeWithPossession[];
}) {
  const isGroupSatisfied = attributes.some((attr) => attr.possessed === true);
  const hasPossessionInfo = attributes.some(
    (attr) => attr.possessed !== undefined,
  );

  return (
    <div
      className={`flex items-center gap-4 py-3 px-4 rounded-attribute-group body-md text-secondary-light-mid-contrast ${getGroupStyle(isGroupSatisfied, hasPossessionInfo)}`}
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
      {!isGroupSatisfied && hasPossessionInfo && (
        <ExclamationMarkIcon
          className="ml-auto shrink-0 text-error-light-low-contrast"
          size={24}
          weight="bold"
        />
      )}
    </div>
  );
}

function getGroupStyle(isGroupSatisfied: boolean, hasPossessionInfo: boolean) {
  if (isGroupSatisfied) return "bg-success-light";
  if (hasPossessionInfo) return "bg-error-light";
  return "bg-secondary-light";
}
