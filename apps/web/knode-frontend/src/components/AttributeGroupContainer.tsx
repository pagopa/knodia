import { type Attribute, getAttribute } from "@knodia/attribute-models";
import { InteractiveIcon, Tooltip } from "@knodia/ui-kit/ui";
import {
  BookOpenTextIcon,
  ExclamationMarkIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { Fragment, useState } from "react";
import { TooltipTrigger } from "react-aria-components";

import type { SchemeRef } from "@/types/schemeRef";

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
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
    null,
  );

  return (
    <div
      className={`flex items-center gap-4 py-3 px-4 rounded-attribute-group body-md text-secondary-light-mid-contrast ${getGroupStyle(isGroupSatisfied, hasPossessionInfo)}`}
    >
      {attributes.map((attribute, index) => {
        const resolved = getAttribute(attribute);
        return (
          <Fragment key={toSchemeRefKey(attribute)}>
            {index > 0 && (
              <span className="body-sm text-secondary-light-low-contrast">
                or
              </span>
            )}
            <span
              className={`flex items-center gap-1 ${attribute.possessed ? "body-md-em text-primary-dark" : ""}`}
            >
              {resolved?.name ?? attribute.code}
              {resolved && (
                <TooltipTrigger>
                  <InteractiveIcon
                    aria-label={`Show description for ${resolved.name}`}
                    onPress={() => setSelectedAttribute(resolved)}
                  >
                    <BookOpenTextIcon size={20} />
                  </InteractiveIcon>
                  <Tooltip>Show description</Tooltip>
                </TooltipTrigger>
              )}
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
      <AttributeDescriptionModal
        attribute={selectedAttribute}
        isOpen={selectedAttribute !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAttribute(null);
          }
        }}
      />
    </div>
  );
}

function getGroupStyle(isGroupSatisfied: boolean, hasPossessionInfo: boolean) {
  if (isGroupSatisfied) return "bg-success-light";
  if (hasPossessionInfo) return "bg-error-light";
  return "bg-secondary-light";
}
