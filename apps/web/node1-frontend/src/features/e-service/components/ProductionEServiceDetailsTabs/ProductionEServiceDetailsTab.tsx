import { bffApi } from "@knodia/bff-client";
import { Banner, Divider } from "@knodia/ui-kit/ui";

import { AttributeGroupContainer } from "@/components/AttributeGroupContainer";
import { client } from "@/libs/axios";
import { downloadResponseAsFile } from "@/utils/downloadFile";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import {
  AccessTokenSettingsSection,
  DocumentsSection,
  MaxAPICallsPerDaySection,
  SignalHubSection,
} from "../EserviceDetailSections";
import { Section } from "../Section";

export function ProductionEServiceDetailsTab() {
  return (
    <>
      <ConsumptionRequirementsSection />
      <Divider className="my-10" />
      <DocumentsSectionAdapter />
      <Divider className="my-10" />
      <AccessTokenSettingsSectionAdapter />
      <Divider className="my-10" />
      <MaxAPICallsPerDaySectionAdapter />
      <Divider className="my-10" />
      <SignalHubSectionAdapter />
    </>
  );
}

function AccessTokenSettingsSectionAdapter() {
  const {
    version: { accessTokenAudience, accessTokenDuration, accessTokenType },
  } = useProductionEserviceDetailsContext();

  return (
    <AccessTokenSettingsSection
      audience={accessTokenAudience.join(", ")}
      durationInMinutes={Math.floor(accessTokenDuration / 60)}
      type={accessTokenType}
    />
  );
}

function ConsumptionRequirementsSection() {
  const {
    isConsumerOperatorIdentificationRequired,
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
          <Banner kind="neutral">
            {isConsumerOperatorIdentificationRequired
              ? "Identification required"
              : "Identification not required"}
          </Banner>
        </div>
      </div>
    </Section>
  );
}

function DocumentsSectionAdapter() {
  const {
    id,
    version: { interfaceDocument },
  } = useProductionEserviceDetailsContext();

  async function downloadInterfaceDocument() {
    const response = await bffApi.getProducerEserviceLatestVersionInterface({
      client,
      path: { eserviceId: id },
    });

    downloadResponseAsFile(
      response.data,
      interfaceDocument.prettyName.en,
      response.headers["content-type"],
    );
  }

  return (
    <DocumentsSection
      checksum={interfaceDocument.checksum}
      name={interfaceDocument.prettyName.en}
      onDownload={downloadInterfaceDocument}
    />
  );
}

function MaxAPICallsPerDaySectionAdapter() {
  const { version } = useProductionEserviceDetailsContext();

  return (
    <MaxAPICallsPerDaySection
      perConsumer={version.maxDailyCallsPerConsumer}
      perKnode={version.maxDailyCallsPerKnode}
    />
  );
}

function SignalHubSectionAdapter() {
  const { isSignalHubEnabled } = useProductionEserviceDetailsContext();

  return <SignalHubSection isSignalHubEnabled={isSignalHubEnabled} />;
}
