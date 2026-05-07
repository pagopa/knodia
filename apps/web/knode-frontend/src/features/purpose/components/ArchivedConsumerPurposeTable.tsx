import type { bffApi } from "@knodia/bff-client";

import { Empty, Loader } from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";

import { useHasRole } from "@/contexts/auth";

import { BaseConsumerPurposeTable } from "./BaseConsumerPurposeTable";

export function ArchivedConsumerPurposeTable({
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
    return (
      <Empty
        description="Archived Purposes will appear here."
        icon={<ArchiveIcon />}
        title={
          canManagePurposes
            ? "You haven't archived any Purpose yet."
            : "There are no archived Purposes."
        }
      />
    );
  }

  return <BaseConsumerPurposeTable purposes={purposes} variant="archived" />;
}
