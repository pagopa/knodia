import { Button } from "@knodia/ui-kit/ui";

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
    ></Section>
  );
}
