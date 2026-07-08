import { type bffApi } from "@knodia/bff-client";
import { getCategory } from "@knodia/category-models";
import { Banner, Chip, Divider } from "@knodia/ui-kit/ui";

import type { SchemeRef } from "@/types/schemeRef";

import { AttributeGroupContainer } from "@/components/AttributeGroupContainer";
import { CopyableValueField } from "@/components/CopyableValueField";
import { GenericInfoCard } from "@/components/GenericInfoCard";
import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import { useEServiceWizardContext } from "@/features/e-service/contexts/useEServiceFormContext";
import { useCalculateChecksum } from "@/features/e-service/hooks/useCalculateChecksum";
import { usePublishEService } from "@/features/e-service/hooks/usePublishEService";
import {
  eserviceFromScratchFormSchema,
  eserviceFromTemplateFormSchema,
} from "@/features/e-service/types/eserviceCreateForm";
import { downloadFile } from "@/utils/downloadFile";
import { formatNumber } from "@/utils/formatters";

import { DocumentRecap } from "../../DocumentRecap";
import { downloadTemplateInterface, getEserviceModeLabel } from "../utils";

export function RecapStep() {
  const { data, template } = useEServiceWizardContext();
  const { prevStep } = useStepsContext();
  const { sha256Checksum } = useCalculateChecksum(data.interfaceDocument);
  const { isError, isPending, publish, publishFromTemplate } =
    usePublishEService();

  const onPublish = () => {
    if (template) {
      publishFromTemplate(eserviceFromTemplateFormSchema.parse(data), template);
      return;
    }

    publish(eserviceFromScratchFormSchema.parse(data), sha256Checksum);
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

        {template ? (
          <TemplateDocumentsSection data={data} template={template} />
        ) : (
          <DocumentsSection
            document={data.interfaceDocument}
            sha256Checksum={sha256Checksum}
          />
        )}

        <Divider />

        <AttributesSection requiredAttributes={data.requiredAttributes} />
      </div>

      <div className="flex flex-col gap-8">
        <Banner kind="warning">
          Remember: once published, Technical details, Documents, and Attributes
          cannot be modified.
        </Banner>

        {isError && (
          <Banner kind="error" size="md" title="Something went wrong">
            Please try again. Don&apos;t refresh the page to avoid data loss.
          </Banner>
        )}

        <ModalFooter
          confirmLabel="Publish"
          isDisabled={isPending}
          onCancel={prevStep}
          onConfirm={onPublish}
        />
      </div>
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
        Checksum
      </div>
      <CopyableValueField value={checksum} />
    </div>
  );
}

function DocumentsSection({
  document,
  sha256Checksum,
}: {
  document: File | null | undefined;
  sha256Checksum: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Documents</SectionTitle>
      <DocumentRecap
        name={document?.name || "-"}
        onDownload={() => downloadFile(document)}
        showDownloadButton
      />
      {sha256Checksum && <ChecksumDisplay checksum={sha256Checksum} />}
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

      <GenericInfoCard label="Type">
        {getEserviceModeLabel(data.mode)}
      </GenericInfoCard>

      <FieldGroup title="Access token settings">
        <GenericInfoCard label="Duration">
          {`${formatNumber(data.accessTokenDuration)} minutes`}
        </GenericInfoCard>
        <GenericInfoCard label="Audience">
          {data.accessTokenAudience || "-"}
        </GenericInfoCard>
        <GenericInfoCard label="Type">
          {data.accessTokenType === "Bearer" ? "Bearer token" : "DPoP token"}
        </GenericInfoCard>
      </FieldGroup>

      <FieldGroup title="Max API calls per day">
        <GenericInfoCard label="Per Knode">
          {formatNumber(data.maxDailyCallsPerKnode)}
        </GenericInfoCard>
        <GenericInfoCard label="Per consumer">
          {formatNumber(data.maxDailyCallsPerConsumer)}
        </GenericInfoCard>
      </FieldGroup>

      <FieldGroup title="Signal Hub">
        <GenericInfoCard label="Available on Signal Hub">
          {data.isSignalHubEnabled ? "Yes" : "No"}
        </GenericInfoCard>
      </FieldGroup>
    </>
  );
}

function TemplateDocumentsSection({
  data,
  template,
}: {
  data: ReturnType<typeof useEServiceWizardContext>["data"];
  template: bffApi.EserviceTemplateDetails;
}) {
  const interfaceDocument = template.eserviceFields.interfaceDocument;

  return (
    <>
      <SectionTitle>Documents</SectionTitle>

      <DocumentRecap
        name={interfaceDocument.prettyName.en}
        onDownload={() =>
          downloadTemplateInterface(template.id, template.knodeId)
        }
        showDownloadButton
      />

      <div className="flex flex-col gap-2">
        {data.serverUrls.map((serverUrl, index) => (
          <GenericInfoCard
            key={`${serverUrl}-${index}`}
            label={index === 0 ? "Server URL" : `Server URL ${index + 1}`}
          >
            <span className="underline">{serverUrl}</span>
          </GenericInfoCard>
        ))}

        <GenericInfoCard label="Terms and Conditions URL">
          {data.termsOfServiceUrl ? (
            <span className="underline">{data.termsOfServiceUrl}</span>
          ) : (
            "-"
          )}
        </GenericInfoCard>
      </div>

      <FieldGroup title="Contact data">
        <GenericInfoCard label="Contact name">
          {data.contactName || "-"}
        </GenericInfoCard>
        <GenericInfoCard label="Contact email">
          {data.contactEmail || "-"}
        </GenericInfoCard>
        <GenericInfoCard label="Contact URL">
          {data.contactUrl ? (
            <span className="underline">{data.contactUrl}</span>
          ) : (
            "-"
          )}
        </GenericInfoCard>
      </FieldGroup>
    </>
  );
}
