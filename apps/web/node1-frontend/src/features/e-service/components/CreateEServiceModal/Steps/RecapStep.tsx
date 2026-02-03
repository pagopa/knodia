import { Banner, Button, Chip, Divider } from "@knodia/ui-kit/ui";
import { BookOpenTextIcon, CopyIcon } from "@phosphor-icons/react";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { DocumentRecap } from "../DocumentRecap";
import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function RecapStep() {
  const form = useEServiceFormContext();
  const { prevStep } = useStepsContext();
  const values = form.state.values;

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
              Requesting proof of residence
            </h3>
            <span className="body-md text-primary-light-low-contrast">
              Confirmation of registration at the current address on the date.
            </span>
          </div>

          <div className="flex gap-3">
            <Chip kind="neutral" label="Residence place" type="light" />
            <Chip kind="neutral" label="Digital domicile" type="light" />
          </div>
        </div>

        <Divider />

        <h2 className="headline-sm-em text-primary-light-high-contrast">
          Technical details
        </h2>

        <RecapField
          label="Mode"
          value={
            values.mode === "ReceiveData" ? "Receive data" : "Provide data"
          }
        />

        <div className="flex flex-col gap-6">
          <h3 className="title-sm-em text-primary-light-high-contrast">
            Access token settings
          </h3>
          <div className="flex flex-col gap-2">
            <RecapField
              label="Duration"
              value={values.accessTokenDuration || "-"}
            />
            <RecapField
              label="Audience"
              value={values.accessTokenAudience || "-"}
            />
            <RecapField label="Type" value={values.accessTokenType || "-"} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="title-sm-em text-primary-light-high-contrast">
            Max API calls per day
          </h3>
          <div className="flex flex-col gap-2">
            <RecapField
              label="Per Knode"
              value={values.maxDailyCallsPerKnode || "-"}
            />
            <RecapField
              label="Per consumer"
              value={values.maxDailyCallsPerConsumer || "-"}
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
              value={values.isSignalHubEnabled ? "Yes" : "No"}
            />
          </div>
          {/* TODO: handle documents */}
          <DocumentRecap
            name="Appoint Orion Knode as the data processor"
            showDownloadButton
          />
        </div>

        <Divider />

        <div className="flex flex-col gap-6">
          <h2 className="headline-sm-em text-primary-light-high-contrast">
            Documents
          </h2>
          <DocumentRecap name="api_spec.pdf" />
          {/* TODO: only show if checksum. */}
          {/* TODO: use component */}
          <div>
            <div className="body-sm-em text-primary-light-high-contrast">
              MD5 checksum
            </div>
            <div className="flex gap-4 items-end">
              <span className="body-md text-primary-light-high-contrast flex-1">
                3f653f35f8311c870e209cc672dfc3698081eefe84cc40f1af5bd61db2c54287
              </span>
              {/* TODO: handle tooltip and click */}
              <Button
                className="p-0"
                hierarchy="neutral"
                kind="ghost"
                size="icon-md"
              >
                <CopyIcon />
              </Button>
            </div>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-6">
          <h2 className="headline-sm-em text-primary-light-high-contrast">
            Attributes
          </h2>
          <div className="flex flex-col gap-2">
            <RecapField>
              <span className="flex items-center gap-4">
                <span className="flex gap-1">
                  NUTS1 <BookOpenTextIcon size={20} />
                </span>
                <span className="body-sm text-secondary-light-low-contrast">
                  or
                </span>
                <span className="flex gap-1">
                  NUTS2 <BookOpenTextIcon size={20} />
                </span>
              </span>
            </RecapField>
            <RecapField label="NUTS3" />
            <RecapField label="NUTS0" />
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
        onConfirm={() => form.handleSubmit()}
      />
    </>
  );
}

function RecapField({
  children,
  label,
  value,
}: {
  children?: React.ReactNode;
  label?: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-3 px-4 bg-secondary-light rounded-lg">
      <span className="text-secondary-light-mid-contrast body-md">
        {label}
        {children}
      </span>
      <span className="body-md-em">{value}</span>
    </div>
  );
}
