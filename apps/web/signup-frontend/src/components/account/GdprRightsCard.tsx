import { SecurityIcon } from "@/components/icons";
import { Card } from "@/components/ui";

import { GdprActionItem } from "./GdprActionItem";

interface GdprRightsCardProps {
  onRequestErasure: () => void;
  onRequestRestriction: () => void;
}

export function GdprRightsCard({
  onRequestErasure,
  onRequestRestriction,
}: GdprRightsCardProps) {
  return (
    <Card className="flex min-h-[300px] flex-col gap-8">
      <h3 className="text-style-card-title text-neutral-graphite">
        Manage your GDPR rights
      </h3>
      <div className="flex flex-col gap-3">
        <GdprActionItem
          icon={SecurityIcon}
          label="Request data erasure"
          onPress={onRequestErasure}
        />
        <GdprActionItem
          icon={SecurityIcon}
          label="Request restriction of processing"
          onPress={onRequestRestriction}
        />
      </div>
    </Card>
  );
}
