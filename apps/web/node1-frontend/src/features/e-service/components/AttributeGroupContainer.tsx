import { BookOpenTextIcon } from "@phosphor-icons/react";
import { Fragment } from "react";

export function AttributeGroupContainer({
  attributes,
}: {
  attributes: { code: string }[];
}) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-secondary-light rounded-lg text-secondary-light-mid-contrast body-md">
      {attributes.map((attribute, index) => (
        <Fragment key={attribute.code}>
          {index > 0 && (
            <span className="body-sm text-secondary-light-low-contrast">
              or
            </span>
          )}
          <span className="flex gap-1">
            {attribute.code} <BookOpenTextIcon size={20} />
          </span>
        </Fragment>
      ))}
    </div>
  );
}
