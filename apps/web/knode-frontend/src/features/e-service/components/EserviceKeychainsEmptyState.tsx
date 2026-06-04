import { Banner } from "@knodia/ui-kit/ui";
import { SelectionIcon, SelectionPlusIcon } from "@phosphor-icons/react";

import { useHasRole } from "@/contexts/auth";

export function EserviceKeychainsEmptyState() {
  const isAdmin = useHasRole("administrative");

  return isAdmin ? (
    <Banner icon={<SelectionPlusIcon />} kind="neutral">
      Link a Production Keychain to sign responses from the E-Service.
    </Banner>
  ) : (
    <Banner icon={<SelectionIcon />} kind="neutral">
      There are no Keychains connected to this E-Service yet.
    </Banner>
  );
}
