import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { Button, Menu, MenuItem, MenuTrigger } from "@knodia/ui-kit/ui";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";

import { ButtonLinkWithPreload } from "@/components/routerLinks";

interface Props {
  eserviceId: EserviceId;
  eserviceMode: bffApi.EserviceMode;
  isBlocked: boolean;
  knodeId: KnodeId;
  onBlockedPress: () => void;
}

export function CreatePurposeButton({
  eserviceId,
  eserviceMode,
  isBlocked,
  knodeId,
  onBlockedPress,
}: Props) {
  const navigate = useNavigate();

  if (isBlocked) {
    return (
      <Button
        hierarchy="neutral"
        kind="tonal"
        onPress={onBlockedPress}
        size="sm"
      >
        Create Purpose
      </Button>
    );
  }

  if (eserviceMode !== "ProvideData") {
    return (
      <ButtonLinkWithPreload
        hierarchy="neutral"
        kind="tonal"
        params={{ id: eserviceId }}
        search={{ knodeId }}
        size="sm"
        to="/consumption/e-services/$id/purposes/new"
      >
        Create Purpose
      </ButtonLinkWithPreload>
    );
  }

  return (
    <MenuTrigger>
      <Button hierarchy="neutral" kind="tonal" size="sm">
        Create Purpose
        <CaretDownIcon />
      </Button>
      <Menu
        onAction={(key) => {
          if (key !== "scratch" && key !== "template") return;
          navigate({
            params: { id: eserviceId },
            search: {
              knodeId,
              ...(key === "template" && { from: "template" }),
            },
            to: "/consumption/e-services/$id/purposes/new",
          });
        }}
      >
        <MenuItem id="scratch">From scratch</MenuItem>
        <MenuItem id="template">From template</MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
