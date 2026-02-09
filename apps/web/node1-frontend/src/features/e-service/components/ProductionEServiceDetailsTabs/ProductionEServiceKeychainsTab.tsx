import { Banner, Button } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

import { Section } from "./Section";

export function ProductionEServiceKeychainsTab() {
  return (
    <Section
      actions={
        <Button hierarchy="neutral" kind="tonal" size="sm">
          Link Keychain
        </Button>
      }
      title="Keychains"
    >
      <Banner icon={<SelectionPlusIcon />} kind="neutral">
        Link a Production Keychain to sign responses from the E-Service.
      </Banner>
    </Section>
  );
}
