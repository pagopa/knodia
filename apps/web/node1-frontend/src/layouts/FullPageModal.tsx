import { Navbar } from "@knodia/ui-kit/layout";
import { ButtonIcon, Typography } from "@knodia/ui-kit/ui";
import { XIcon } from "@phosphor-icons/react";

interface Props {
  onClose: () => void;
}

export function FullPageModal({ onClose }: Props) {
  <div className="fixed inset-0 z-50 bg-white">
    <Navbar className="bg-brand-light">
      <Typography className="text-brand-light-high-contrast">
        Create E-Service
      </Typography>
      <ButtonIcon hierarchy="neutral" kind="ghost" onPress={onClose}>
        <XIcon />
      </ButtonIcon>
    </Navbar>
  </div>;
}
