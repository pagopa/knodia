import { getAttribute } from "@knodia/attribute-models";
import { BookOpenTextIcon, SealCheckIcon } from "@phosphor-icons/react";
import { Fragment } from "react";

import type { SchemeRef } from "../types/schemeRef";

export function AttributeGroupContainer({
  attributes,
  verified = false,
}: {
  attributes: SchemeRef[];
  verified?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 py-3 px-4 rounded-lg body-md ${
        verified
          ? "bg-success-light text-secondary-light-mid-contrast"
          : "bg-secondary-light text-secondary-light-mid-contrast"
      }`}
    >
      {attributes.map((attribute, index) => (
        <Fragment key={`${attribute.scheme}$${attribute.code}`}>
          {index > 0 && (
            <span className="body-sm text-secondary-light-low-contrast">
              or
            </span>
          )}
          <span className="flex gap-1">
            {getAttribute(attribute.scheme, attribute.code)?.name ??
              attribute.code}
            <BookOpenTextIcon size={20} />
          </span>
        </Fragment>
      ))}
      {verified && (
        <SealCheckIcon
          className="ml-auto shrink-0 text-success-light-low-contrast"
          size={24}
          weight="fill"
        />
      )}
    </div>
  );
}
