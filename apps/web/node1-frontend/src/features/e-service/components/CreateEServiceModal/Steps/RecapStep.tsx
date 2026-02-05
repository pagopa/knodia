import { Banner, Button, Chip, Divider } from "@knodia/ui-kit/ui";
import { BookOpenTextIcon, CopyIcon } from "@phosphor-icons/react";
import { Fragment } from "react/jsx-runtime";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceWizardContext } from "@/features/e-service/contexts/useEServiceFormContext";
import { useCalculateChecksum } from "@/features/e-service/hooks/useCalculateChecksum";

import { DocumentRecap } from "../DocumentRecap";
import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

interface Props {
  onPublish: () => void;
}

// TODO: use real Knode name
const KNODE_NAME = "Orion Knode";

export function RecapStep({ onPublish }: Props) {
  const { data } = useEServiceWizardContext();
  const { prevStep } = useStepsContext();

  const { md5Checksum } = useCalculateChecksum(data.interfaceDocument);

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
        <h2 className="headline-sm-em text-primary-light-high-contrast">
          General information
        </h2>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h3 className="title-sm-em text-primary-light-high-contrast">
              {data.name || "-"}
            </h3>
            <p className="body-md text-primary-light-low-contrast">
              {data.description || "-"}
            </p>
          </div>

          <div className="flex gap-3">
            {data.categories?.map((category) => (
              <Chip
                key={category}
                kind="neutral"
                label={category}
                type="light"
              />
            ))}
          </div>
        </div>

        <Divider />

        <h2 className="headline-sm-em text-primary-light-high-contrast">
          Technical details
        </h2>

        <RecapField
          label="Mode"
          value={data.mode === "ReceiveData" ? "Receive data" : "Provide data"}
        />

        <div className="flex flex-col gap-6">
          <h3 className="title-sm-em text-primary-light-high-contrast">
            Access token settings
          </h3>
          <div className="flex flex-col gap-2">
            <RecapField
              label="Duration"
              value={data.accessTokenDuration || "-"}
            />
            <RecapField
              label="Audience"
              value={data.accessTokenAudience || "-"}
            />
            <RecapField label="Type" value={data.accessTokenType || "-"} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="title-sm-em text-primary-light-high-contrast">
            Max API calls per day
          </h3>
          <div className="flex flex-col gap-2">
            <RecapField
              label="Per Knode"
              value={data.maxDailyCallsPerKnode || "-"}
            />
            <RecapField
              label="Per consumer"
              value={data.maxDailyCallsPerConsumer || "-"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="title-sm-em text-primary-light-high-contrast">
            Signal Hub
          </h3>
          <div className="flex flex-col gap-2">
            <RecapField
              label="Available on Signal Hub"
              value={data.isSignalHubEnabled ? "Yes" : "No"}
            />
          </div>
          {data.isSignalHubEnabled ? (
            <DocumentRecap
              name={`Appoint ${KNODE_NAME} as the data processor`}
              showDownloadButton
            />
          ) : null}
        </div>

        <Divider />

        <div className="flex flex-col gap-6">
          <h2 className="headline-sm-em text-primary-light-high-contrast">
            Documents
          </h2>
          <DocumentRecap name={data.interfaceDocument?.name || "-"} />
          {md5Checksum ? (
            <div>
              <div className="body-sm-em text-primary-light-high-contrast">
                MD5 checksum
              </div>
              <div className="flex gap-4 items-end">
                <span className="body-md text-primary-light-high-contrast flex-1">
                  {md5Checksum}
                </span>
                <Button
                  className="p-0"
                  hierarchy="neutral"
                  kind="ghost"
                  onClick={() => navigator.clipboard.writeText(md5Checksum)}
                  size="icon-md"
                >
                  <CopyIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <Divider />

        <div className="flex flex-col gap-6">
          <h2 className="headline-sm-em text-primary-light-high-contrast">
            Attributes
          </h2>
          <div className="flex flex-col gap-2">
            {data.requiredAttributes?.map((group, index) => (
              <RecapFieldCustom key={index}>
                {group.map((attribute, attIdx) => (
                  <Fragment key={attribute.code}>
                    {attIdx > 0 && (
                      <span className="body-sm text-secondary-light-low-contrast">
                        or
                      </span>
                    )}

                    <span className="flex gap-1">
                      {attribute.code} <BookOpenTextIcon size={20} />
                    </span>
                  </Fragment>
                ))}
              </RecapFieldCustom>
            ))}
          </div>
        </div>
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

function RecapFieldCustom({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-secondary-light rounded-lg text-secondary-light-mid-contrast body-md ">
      {children}
    </div>
  );
}
