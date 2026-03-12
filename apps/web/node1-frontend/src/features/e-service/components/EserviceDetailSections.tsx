import { toastQueue } from "@knodia/ui-kit/ui";

import { CopyableValueField } from "@/components/CopyableValueField";
import { SettingsCard } from "@/components/SettingCard";
import { formatNumber } from "@/utils/formatters";

import { DocumentRecap } from "./DocumentRecap";
import { Section } from "./Section";

export function AccessTokenSettingsSection({
  audience,
  durationInMinutes,
  type,
}: {
  audience: string;
  durationInMinutes: number;
  type: string;
}) {
  return (
    <Section title="Access token settings">
      <div className="grid grid-cols-3 gap-4">
        <SettingsCard label="Duration">
          {durationInMinutes} minutes
        </SettingsCard>
        <SettingsCard label="Audience">{audience}</SettingsCard>
        <SettingsCard label="Type">{type}</SettingsCard>
      </div>
    </Section>
  );
}

export function DocumentsSection({
  checksum,
  name,
  onDownload,
}: {
  checksum: string;
  name: string;
  onDownload?: () => Promise<void>;
}) {
  async function handleDownload() {
    try {
      await onDownload?.();
    } catch {
      toastQueue.add({
        description: "Retry later",
        kind: "error",
        title: "Download failed",
      });
    }
  }

  return (
    <Section title="Documents">
      <DocumentRecap
        name={name}
        onDownload={handleDownload}
        showDownloadButton
      />
      <CopyableValueField className="mt-6" label="Checksum:" value={checksum} />
    </Section>
  );
}

export function MaxAPICallsPerDaySection({
  perConsumer,
  perKnode,
}: {
  perConsumer: number;
  perKnode: number;
}) {
  return (
    <Section title="Max API calls per day">
      <div className="grid grid-cols-2 gap-4">
        <SettingsCard label="Per Knode">{formatNumber(perKnode)}</SettingsCard>
        <SettingsCard label="Per Consumer">
          {formatNumber(perConsumer)}
        </SettingsCard>
      </div>
    </Section>
  );
}

export function SignalHubSection({
  isSignalHubEnabled,
}: {
  isSignalHubEnabled: boolean;
}) {
  return (
    <Section className="mb-6" title="Signal hub">
      <p className="body-lg text-primary-dark">
        {isSignalHubEnabled
          ? "This E-Service is available on Signal Hub."
          : "This E-Service is not available on Signal Hub."}
      </p>
    </Section>
  );
}
