import { bffApi } from "@knodia/bff-client";
import { Banner, Divider } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { CopyableValueField } from "@/components/CopyableValueField";
import { SettingsCard } from "@/components/SettingCard";
import { client } from "@/libs/axios";
import { downloadFile } from "@/utils/downloadFile";
import { formatNumber } from "@/utils/formatters";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import { AttributeGroupContainer } from "../AttributeGroupContainer";
import { DocumentRecap } from "../DocumentRecap";
import { Section } from "../Section";

export function ProductionEServiceDetailsTab() {
  return (
    <>
      <ConsumptionRequirementsSection />
      <Divider className="my-10" />
      <DocumentsSection />
      <Divider className="my-10" />
      <AccessTokenSettingsSection />
      <Divider className="my-10" />
      <MaxAPICallsPerDaySection />
      <Divider className="my-10" />
      <SignalHubSection />
    </>
  );
}

function AccessTokenSettingsSection() {
  const {
    version: { accessTokenAudience, accessTokenDuration, accessTokenType },
  } = useProductionEserviceDetailsContext();

  return (
    <Section title="Access token settings">
      <div className="grid grid-cols-3 gap-4">
        <SettingsCard label="Duration">
          {Math.floor(accessTokenDuration / 60)} minutes
        </SettingsCard>
        <SettingsCard label="Audience">
          {accessTokenAudience.join(", ")}
        </SettingsCard>
        <SettingsCard label="Type">{accessTokenType}</SettingsCard>
      </div>
    </Section>
  );
}

function ConsumptionRequirementsSection() {
  const {
    version: { requiredAttributes },
  } = useProductionEserviceDetailsContext();

  return (
    <Section title="Consumption requirements">
      <div className="grid grid-cols-2 gap-10">
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Attributes
          </h3>
          <ul className="gap-2 flex flex-col" role="list">
            {requiredAttributes.map((group, index) => (
              <li key={index}>
                <AttributeGroupContainer attributes={group} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="title-sm-em text-primary-light-low-contrast mb-4">
            Identification
          </h3>
          {/** It depends on the Knode, this could be set with a env flag? */}
          <Banner kind="informative">Identification required</Banner>
        </div>
      </div>
    </Section>
  );
}

function DocumentsSection() {
  const {
    id,
    version: { interfaceDocument },
  } = useProductionEserviceDetailsContext();

  async function downloadInterfaceDocument() {
    const response = await bffApi.getProducerEserviceLatestVersionInterface({
      client,
      path: { eserviceId: id },
    });

    const file = new File([response.data], interfaceDocument.prettyName.en, {
      type: response.headers["content-type"],
    });

    downloadFile(file);
  }

  return (
    <Section title="Documents">
      <DocumentRecap
        name={interfaceDocument.prettyName.en}
        onDownload={downloadInterfaceDocument}
        showDownloadButton
      />
      <CopyableValueField
        className="mt-6"
        label="Checksum:"
        value={interfaceDocument.checksum}
      />
    </Section>
  );
}

function MaxAPICallsPerDaySection() {
  const { version } = useProductionEserviceDetailsContext();

  return (
    <Section title="Max API calls per day">
      <div className="grid grid-cols-2 gap-4">
        <SettingsCard label="Per Knode">
          {formatNumber(version.maxDailyCallsPerKnode)}
        </SettingsCard>
        <SettingsCard label="Per Consumer">
          {formatNumber(version.maxDailyCallsPerConsumer)}
        </SettingsCard>
      </div>
    </Section>
  );
}

function SignalHubSection() {
  const { isSignalHubEnabled } = useProductionEserviceDetailsContext();

  return (
    <Section className="mb-6" title="Signal hub">
      <p className="body-lg text-primary-dark">
        {match(isSignalHubEnabled)
          .with(true, () => "This E-Service is available on Signal Hub.")
          .with(false, () => "This E-Service is not available on Signal Hub.")
          .exhaustive()}
      </p>
    </Section>
  );
}
