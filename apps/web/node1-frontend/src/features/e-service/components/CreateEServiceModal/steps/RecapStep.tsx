import { Banner, Chip, CopyButton, Divider } from "@knodia/ui-kit/ui";
import { BookOpenTextIcon } from "@phosphor-icons/react";
import { Fragment } from "react";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceWizardContext } from "@/features/e-service/contexts/useEServiceFormContext";
import { useCalculateChecksum } from "@/features/e-service/hooks/useCalculateChecksum";

import { DocumentRecap } from "../components/DocumentRecap";
import { Footer } from "../components/Footer";
import { StepHeader } from "../components/StepHeader";

// TODO: use real Knode name
const KNODE_NAME = "Orion Knode";

export function RecapStep() {
  const { data } = useEServiceWizardContext();
  const { prevStep } = useStepsContext();
  const { md5Checksum } = useCalculateChecksum(data.interfaceDocument);

  const onPublish = () => {
    console.log("Publishing form: ", data);
  };

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Check that everything is correct before the publication."
          title="Recap"
        >
          <Banner kind="warning">
            Remember: once published, Technical details, Documents, and
            Attributes cannot be modified.
          </Banner>
        </StepHeader>

        <GeneralInfoSection
          categories={data.categories}
          description={data.description}
          name={data.name}
        />

        <Divider />

        <TechnicalDetailsSection data={data} />

        <Divider />

        <DocumentsSection
          documentName={data.interfaceDocument?.name}
          md5Checksum={md5Checksum}
        />

        <Divider />

        <AttributesSection requiredAttributes={data.requiredAttributes} />
      </div>

      <Banner kind="warning">
        Remember: once published, Technical details and Attributes cannot be
        modified.
      </Banner>

      <Footer
        confirmLabel="Publish"
        onCancel={prevStep}
        onConfirm={onPublish}
      />
    </>
  );
}

function AttributeGroup({ attributes }: { attributes: { code: string }[] }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-secondary-light rounded-lg text-secondary-light-mid-contrast body-md">
      {attributes.map((attribute, index) => (
        <Fragment key={attribute.code}>
          {index > 0 && (
            <span className="body-sm text-secondary-light-low-contrast">
              or
            </span>
          )}
          <span className="flex gap-1">
            {attribute.code} <BookOpenTextIcon size={20} />
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function AttributesSection({
  requiredAttributes,
}: {
  requiredAttributes: undefined | { code: string }[][];
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Attributes</SectionTitle>
      <div className="flex flex-col gap-2">
        {requiredAttributes?.map((group, index) => (
          <AttributeGroup attributes={group} key={index} />
        ))}
      </div>
    </div>
  );
}

function ChecksumDisplay({ checksum }: { checksum: string }) {
  return (
    <div>
      <div className="body-sm-em text-primary-light-high-contrast">
        MD5 checksum
      </div>
      <div className="flex gap-4 items-end">
        <span className="body-md text-primary-light-high-contrast flex-1">
          {checksum}
        </span>
        <CopyButton className="p-1" textToCopy={checksum} />
      </div>
    </div>
  );
}

function DocumentsSection({
  documentName,
  md5Checksum,
}: {
  documentName: string | undefined;
  md5Checksum: null | string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Documents</SectionTitle>
      <DocumentRecap name={documentName || "-"} />
      {md5Checksum && <ChecksumDisplay checksum={md5Checksum} />}
    </div>
  );
}

function FieldGroup({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SubsectionTitle>{title}</SubsectionTitle>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function GeneralInfoSection({
  categories,
  description,
  name,
}: {
  categories: string[] | undefined;
  description: string | undefined;
  name: string | undefined;
}) {
  return (
    <>
      <SectionTitle>General information</SectionTitle>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <SubsectionTitle>{name || "-"}</SubsectionTitle>
          <p className="body-md text-primary-light-low-contrast">
            {description || "-"}
          </p>
        </div>
        {categories && categories.length > 0 && (
          <div className="flex gap-3">
            {categories.map((category) => (
              <Chip
                key={category}
                kind="neutral"
                label={category}
                type="light"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function RecapField({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-3 px-4 bg-secondary-light rounded-lg">
      <span className="text-secondary-light-mid-contrast body-md">{label}</span>
      <span className="body-md-em">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="headline-sm-em text-primary-light-high-contrast">
      {children}
    </h3>
  );
}

function SubsectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="title-sm-em text-primary-light-high-contrast">{children}</h4>
  );
}

function TechnicalDetailsSection({
  data,
}: {
  data: ReturnType<typeof useEServiceWizardContext>["data"];
}) {
  return (
    <>
      <SectionTitle>Technical details</SectionTitle>

      <RecapField
        label="Mode"
        value={data.mode === "ReceiveData" ? "Receive data" : "Provide data"}
      />

      <FieldGroup title="Access token settings">
        <RecapField label="Duration" value={data.accessTokenDuration || "-"} />
        <RecapField label="Audience" value={data.accessTokenAudience || "-"} />
        <RecapField label="Type" value={data.accessTokenType || "-"} />
      </FieldGroup>

      <FieldGroup title="Max API calls per day">
        <RecapField
          label="Per Knode"
          value={data.maxDailyCallsPerKnode || "-"}
        />
        <RecapField
          label="Per consumer"
          value={data.maxDailyCallsPerConsumer || "-"}
        />
      </FieldGroup>

      <FieldGroup title="Signal Hub">
        <RecapField
          label="Available on Signal Hub"
          value={data.isSignalHubEnabled ? "Yes" : "No"}
        />
        {data.isSignalHubEnabled && (
          <DocumentRecap
            name={`Appoint ${KNODE_NAME} as the data processor`}
            showDownloadButton
          />
        )}
      </FieldGroup>
    </>
  );
}
