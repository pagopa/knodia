import { getCategory } from "@knodia/category-models";
import { Banner, Chip, Divider } from "@knodia/ui-kit/ui";

import type { SchemeRef } from "@/features/e-service/types/eserviceCreateForm";

import { CopyableValueField } from "@/components/CopyableValueField";
import { GenericInfoCard } from "@/components/GenericInfoCard";
import { useStepsContext } from "@/contexts/steps";
import { useEServiceWizardContext } from "@/features/e-service/contexts/useEServiceFormContext";
import { useCalculateMD5 } from "@/features/e-service/hooks/useCalculateMD5";
import { usePublishEService } from "@/features/e-service/hooks/usePublishEService";
import { downloadFile } from "@/utils/downloadFile";

import { AttributeGroupContainer } from "../../AttributeGroupContainer";
import { DocumentRecap } from "../../DocumentRecap";
import { Footer } from "../components/Footer";
import { StepHeader } from "../components/StepHeader";

// TODO: use real Knode name
const KNODE_NAME = "Orion Knode";

export function RecapStep() {
  const { data } = useEServiceWizardContext();
  const { prevStep } = useStepsContext();
  const { md5Checksum } = useCalculateMD5(data.interfaceDocument);
  const { isError, isPending, publish } = usePublishEService();

  const onPublish = () => publish(data);

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
          document={data.interfaceDocument}
          md5Checksum={md5Checksum}
        />

        <Divider />

        <AttributesSection requiredAttributes={data.requiredAttributes} />
      </div>

      <Banner kind="warning">
        Remember: once published, Technical details and Attributes cannot be
        modified.
      </Banner>

      {isError && (
        <Banner kind="error">
          <div className="flex flex-col gap-2">
            <div className="title-sm-em text-error-light-high-contrast">
              Something went wrong
            </div>
            Please try again. Don't refresh the page to avoid data loss.
          </div>
        </Banner>
      )}

      <Footer
        confirmLabel="Publish"
        isDisabled={isPending}
        onCancel={prevStep}
        onConfirm={onPublish}
      />
    </>
  );
}

function AttributesSection({
  requiredAttributes,
}: {
  requiredAttributes: SchemeRef[][] | undefined;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Attributes</SectionTitle>
      <div className="flex flex-col gap-2">
        {requiredAttributes?.map((group, index) => (
          <AttributeGroupContainer attributes={group} key={index} />
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
      <CopyableValueField value={checksum} />
      {/* <div className="flex gap-4 items-end">
        <span className="body-md text-primary-light-high-contrast flex-1">
          {checksum}
        </span>
        <CopyButton textToCopy={checksum} />
      </div> */}
    </div>
  );
}

function DocumentsSection({
  document,
  md5Checksum,
}: {
  document: File | null | undefined;
  md5Checksum: null | string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Documents</SectionTitle>
      <DocumentRecap
        name={document?.name || "-"}
        onDownload={() => downloadFile(document)}
        showDownloadButton
      />
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
  categories: SchemeRef[] | undefined;
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
                key={`${category.scheme}$${category.code}`}
                kind="neutral"
                label={
                  getCategory(category.scheme, category.code)?.name ??
                  category.code
                }
                type="light"
              />
            ))}
          </div>
        )}
      </div>
    </>
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

      <GenericInfoCard label="Mode">
        {data.mode === "ReceiveData" ? "Receive data" : "Provide data"}
      </GenericInfoCard>

      <FieldGroup title="Access token settings">
        <GenericInfoCard label="Duration">
          {data.accessTokenDuration || "-"}
        </GenericInfoCard>
        <GenericInfoCard label="Audience">
          {data.accessTokenAudience || "-"}
        </GenericInfoCard>
        <GenericInfoCard label="Type">
          {data.accessTokenType || "-"}
        </GenericInfoCard>
      </FieldGroup>

      <FieldGroup title="Max API calls per day">
        <GenericInfoCard label="Per Knode">
          {data.maxDailyCallsPerKnode || "-"}
        </GenericInfoCard>
        <GenericInfoCard label="Per consumer">
          {data.maxDailyCallsPerConsumer || "-"}
        </GenericInfoCard>
      </FieldGroup>

      <FieldGroup title="Signal Hub">
        <GenericInfoCard label="Available on Signal Hub">
          {data.isSignalHubEnabled ? "Yes" : "No"}
        </GenericInfoCard>
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
