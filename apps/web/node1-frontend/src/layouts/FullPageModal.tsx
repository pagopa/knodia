import type { ReactNode } from "react";

import { Navbar } from "@knodia/ui-kit/layout";
import { ButtonIcon, Typography } from "@knodia/ui-kit/ui";
import { XIcon } from "@phosphor-icons/react";

interface Props {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function FullPageModal({ children, onClose, title }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <Navbar className="bg-brand-light">
        <Typography className="text-brand-light-high-contrast">
          {title}
        </Typography>
        <ButtonIcon hierarchy="neutral" kind="ghost" onPress={onClose}>
          <XIcon />
        </ButtonIcon>
      </Navbar>
      {children}
    </div>
  );
}
