import {
  Banner,
  Checkbox,
  Divider,
  NumberField,
  Radio,
  RadioGroup,
  TextField,
} from "@knodia/ui-kit/ui";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import {
  useEServiceWizardContext,
  useTechnicalStepForm,
} from "@/features/e-service/contexts/useEServiceFormContext";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import { DefinedByTemplateIconTooltip } from "../components/DefinedByTemplateIconTooltip";
import { getEserviceModeLabel } from "../utils";

type TechnicalStepForm = ReturnType<typeof useTechnicalStepForm>;

export function TechnicalStep() {
  const { nextStep, prevStep } = useStepsContext();
  const form = useTechnicalStepForm(nextStep);
  const { template } = useEServiceWizardContext();

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Define the technical specifications of your E-Service."
          title="Technical details"
        >
          <Banner kind="informative">
            E-Services&apos; technical details cannot be modified after
            publication.
          </Banner>
        </StepHeader>

        <DataModeSection
          form={form}
          isDefinedByTemplate={template !== undefined}
        />
        <Divider />
        <AccessTokenSection form={form} />
        <Divider />
        <MaxApiCallsSection form={form} />
        <Divider />
        <SignalHubSection form={form} />
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <ModalFooter
            isDisabled={!canSubmit}
            onCancel={prevStep}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>
    </>
  );
}

function AccessTokenSection({ form }: { form: TechnicalStepForm }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        description="Define the characteristics of the token you will provide to access your E-Service."
        title="Access token settings"
      />
      <form.Field name="accessTokenDuration">
        {(field) => (
          <NumberField
            description="Max 1440 minutes (24 hours)"
            errorMessage={getFieldErrorMessage(field.state.meta.errors, {
              numberFallback: "Duration must be at least 1 minute.",
            })}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            isRequired
            label="Duration (in minutes)"
            maxValue={1440}
            minValue={1}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="accessTokenAudience">
        {(field) => (
          <TextField
            errorMessage={getFieldErrorMessage(field.state.meta.errors)}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            isRequired
            label="Audience"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="accessTokenType">
        {(field) => (
          <RadioGroup
            isRequired
            label="Type"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            orientation="horizontal"
            value={field.state.value}
          >
            <Radio value="Bearer">Bearer</Radio>
            <Radio value="DPoP">DPoP</Radio>
          </RadioGroup>
        )}
      </form.Field>
    </div>
  );
}

function DataModeSection({
  form,
  isDefinedByTemplate,
}: {
  form: TechnicalStepForm;
  isDefinedByTemplate: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <form.Field name="mode">
        {(field) => {
          const value = field.state.value;

          if (isDefinedByTemplate) {
            return (
              <TextField
                endIcon={<DefinedByTemplateIconTooltip />}
                isReadOnly
                label="Data mode"
                name={field.name}
                size="lg"
                value={getEserviceModeLabel(value)}
              />
            );
          }

          return (
            <RadioGroup
              isRequired
              label="Data mode"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              orientation="horizontal"
              value={value}
            >
              <Radio value="ProvideData">
                {getEserviceModeLabel("ProvideData")}
              </Radio>
              <Radio isDisabled value="ReceiveData">
                {getEserviceModeLabel("ReceiveData")}
              </Radio>
            </RadioGroup>
          );
        }}
      </form.Field>
    </div>
  );
}

function MaxApiCallsSection({ form }: { form: TechnicalStepForm }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        description="Define the API calls limit your E-Service can manage in 1 day."
        title="Max API calls per day"
      />
      <form.Field name="maxDailyCallsPerKnode">
        {(field) => (
          <NumberField
            description="Max number of API calls for each Knode."
            errorMessage={getFieldErrorMessage(field.state.meta.errors, {
              numberFallback: "Must be at least 1.",
            })}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            isRequired
            label="Per Knode"
            minValue={1}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            value={field.state.value}
          />
        )}
      </form.Field>
      <form.Field name="maxDailyCallsPerConsumer">
        {(field) => (
          <NumberField
            description="Max number of API calls for a single organization. Consumers should declare that their number of API calls per day doesn't exceed this number."
            errorMessage={getFieldErrorMessage(field.state.meta.errors, {
              numberFallback: "Must be at least 1.",
            })}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            isRequired
            label="Per consumer"
            minValue={1}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            value={field.state.value}
          />
        )}
      </form.Field>
    </div>
  );
}

function SectionHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="headline-sm-em text-primary-light-high-contrast">
        {title}
      </h3>
      <span className="body-md text-primary-dark">{description}</span>
    </div>
  );
}

function SignalHubSection({ form }: { form: TechnicalStepForm }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        description="Select whether you want to notify your consumers about E-Service's changes through Signal Hub."
        title="Signal Hub"
      />
      <form.Field name="isSignalHubEnabled">
        {(field) => (
          <Checkbox
            // TODO: make isRequired again when Signal Hub is re-enabled
            isDisabled
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            isSelected={field.state.value}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
          >
            I will notify data changes on Signal Hub
          </Checkbox>
        )}
      </form.Field>
    </div>
  );
}
