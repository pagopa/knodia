import type { ReactNode } from "react";

import { Navbar } from "@knodia/ui-kit/layout";
import { Button } from "@knodia/ui-kit/ui";
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
        <span className="text-brand-light-high-contrast headline-sm">
          {title}
        </span>
        <Button
          hierarchy="neutral"
          kind="ghost"
          onPress={onClose}
          size="icon-md"
        >
          <XIcon />
        </Button>
      </Navbar>
      {children}
    </div>
  );
}
