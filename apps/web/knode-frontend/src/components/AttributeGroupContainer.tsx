import { getAttribute } from "@knodia/attribute-models";
import { InteractiveIcon, Tooltip } from "@knodia/ui-kit/ui";
import {
  BookOpenTextIcon,
  ExclamationMarkIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { Fragment } from "react";
import { DialogTrigger, TooltipTrigger } from "react-aria-components";

import type { SchemeRef } from "@/types/schemeRef";

import { ORGS_PERSONAL_ATTRIBUTES_INFO } from "@/utils/attributeCopy";
import { toSchemeRefKey } from "@/utils/schemeRef";

import { AttributeDescriptionModal } from "./AttributeDescriptionModal";

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
      {attributes.map((attribute, index) => {
        const resolved = getAttribute(attribute);
        // Org-unique attributes are not in the catalogue: fall back to the org
        // name (encoded as the code) and the shared explanatory copy, so every
        // attribute — standard or org-unique — exposes a description.
        const name = resolved?.name ?? attribute.code;
        const description =
          resolved?.description ?? ORGS_PERSONAL_ATTRIBUTES_INFO;
        return (
          <Fragment key={toSchemeRefKey(attribute)}>
            {index > 0 && (
              <span className="body-sm text-secondary-light-low-contrast">
                or
              </span>
            )}
            <span
              className={`flex items-center gap-2 ${attribute.possessed ? "body-md-em text-primary-dark" : ""}`}
            >
              {name}
              <DialogTrigger>
                <TooltipTrigger>
                  <InteractiveIcon
                    aria-label={`Show description for ${name}`}
                    className="hover:cursor-pointer"
                  >
                    <BookOpenTextIcon size={20} />
                  </InteractiveIcon>
                  <Tooltip>Show description</Tooltip>
                </TooltipTrigger>
                <AttributeDescriptionModal
                  description={description}
                  name={name}
                />
              </DialogTrigger>
            </span>
          </Fragment>
        );
      })}
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
