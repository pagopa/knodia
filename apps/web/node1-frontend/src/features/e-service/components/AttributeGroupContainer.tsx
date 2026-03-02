import { getAttribute } from "@knodia/attribute-models";
import { BookOpenTextIcon } from "@phosphor-icons/react";
import { Fragment } from "react";

import type { SchemeRef } from "../types/eserviceCreateForm";

export function AttributeGroupContainer({
  attributes,
}: {
  attributes: SchemeRef[];
}) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-secondary-light rounded-lg text-secondary-light-mid-contrast body-md">
      {attributes.map((attribute, index) => (
        <Fragment key={`${attribute.scheme}$${attribute.code}`}>
          {index > 0 && (
            <span className="body-sm text-secondary-light-low-contrast">
              or
            </span>
          )}
          <span className="flex gap-1">
            {getAttribute(attribute)?.name ?? attribute.code}
            <BookOpenTextIcon size={20} />
          </span>
        </Fragment>
      ))}
    </div>
  );
}
