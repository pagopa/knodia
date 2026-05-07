import type { bffApi } from "@knodia/bff-client";

import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

import { useHasRole } from "@/contexts/auth";

import { BaseConsumerPurposeTable } from "../BaseConsumerPurposeTable";

export function ConsumerPurposeTable({
  isLoading,
  purposes,
}: {
  isLoading: boolean;
  purposes: bffApi.ConsumerPurpose[];
}) {
  const canManagePurposes = useHasRole("administrative");

  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (purposes.length === 0) {
    if (canManagePurposes) {
      return (
        <Empty
          action={{
            as: "link",
            hierarchy: "brand",
            href: { to: "/consumption/e-services" },
            kind: "filled",
            label: "See E-Services",
          }}
          description="You can create new Purposes for the E-Services for which you have an existing Agreement."
          icon={<SelectionPlusIcon />}
          kind="brand-soft"
          title="You don't have any Purpose yet."
        />
      );
    }

    return (
      <Empty
        description="Purposes will appear here."
        icon={<SelectionPlusIcon />}
        kind="brand-soft"
        title="There are no Purposes yet."
      />
    );
  }

  return <BaseConsumerPurposeTable purposes={purposes} variant="active" />;
}
