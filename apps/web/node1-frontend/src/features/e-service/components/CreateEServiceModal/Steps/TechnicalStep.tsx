import {
  Banner,
  Checkbox,
  Divider,
  NumberField,
  Radio,
  RadioGroup,
  TextField,
} from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import {
  useEServiceWizardContext,
  useTechnicalStepForm,
} from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

type TechnicalStepForm = ReturnType<typeof useTechnicalStepForm>;

export function TechnicalStep() {
  const { data, updateTechnicalStep } = useEServiceWizardContext();
  const { nextStep, prevStep } = useStepsContext();

  const form = useTechnicalStepForm(
    {
      accessTokenAudience: data.accessTokenAudience ?? "",
      accessTokenDuration: data.accessTokenDuration ?? NaN,
      accessTokenType: data.accessTokenType ?? "Bearer",
      isSignalHubEnabled: data.isSignalHubEnabled ?? false,
      maxDailyCallsPerConsumer: data.maxDailyCallsPerConsumer ?? NaN,
      maxDailyCallsPerKnode: data.maxDailyCallsPerKnode ?? NaN,
      mode: data.mode ?? "ProvideData",
    },
    (stepData) => {
      updateTechnicalStep(stepData);
      nextStep();
    },
  );

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

        <DataModeSection form={form} />
        <Divider />
        <AccessTokenSection form={form} />
        <Divider />
        <MaxApiCallsSection form={form} />
        <Divider />
        <SignalHubSection form={form} />
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Footer
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
      <div className="flex flex-col gap-3">
        <h3 className="headline-sm-em text-primary-light-high-contrast">
          Access token settings
        </h3>
        <span className="body-md text-primary-light-high-contrast">
          Define the characteristics of the token you will provide to access
          your E-Service.
        </span>
      </div>
      <form.Field name="accessTokenDuration">
        {(field) => (
          <NumberField
            description="Max 1440 minutes (24 hours)"
            errorMessage={field.state.meta.errors
              .map((e) => {
                const msg = e?.message;
                // ignore "Received NaN" message
                if (msg && RegExp(/nvalid|input/).test(msg)) {
                  return "Must be at least 1.";
                }
                return msg;
              })
              .join(", ")}
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
            errorMessage={field.state.meta.errors
              .map((e) => e?.message)
              .join(", ")}
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

function DataModeSection({ form }: { form: TechnicalStepForm }) {
  return (
    <div className="flex flex-col gap-6">
      <form.Field name="mode">
        {(field) => (
          <RadioGroup
            isRequired
            label="Data mode"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            orientation="horizontal"
            value={field.state.value}
          >
            <Radio value="ProvideData">Provide data</Radio>
            <Radio value="ReceiveData">Receive data</Radio>
          </RadioGroup>
        )}
      </form.Field>
    </div>
  );
}

function MaxApiCallsSection({ form }: { form: TechnicalStepForm }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="headline-sm-em text-primary-light-high-contrast">
          Max API calls per day
        </h3>
        <span className="body-md text-primary-light-high-contrast">
          Define the API calls limit your E-Service can manage in 1 day.
        </span>
      </div>
      <form.Field name="maxDailyCallsPerKnode">
        {(field) => (
          <NumberField
            description="Max number of API calls for each Knode."
            errorMessage={field.state.meta.errors
              .map((e) => {
                const msg = e?.message;
                // ignore "Received NaN" message
                if (msg && RegExp(/nvalid|input/).test(msg)) {
                  return "Must be at least 1.";
                }
                return msg;
              })
              .join(", ")}
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
            errorMessage={field.state.meta.errors
              .map((e) => {
                const msg = e?.message;
                // ignore "Received NaN" message
                if (msg && RegExp(/nvalid|input/).test(msg)) {
                  return "Must be at least 1.";
                }
                return msg;
              })
              .join(", ")}
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

function SignalHubSection({ form }: { form: TechnicalStepForm }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="headline-sm-em text-primary-light-high-contrast">
          Signal Hub
        </h3>
        <span className="body-md text-primary-light-high-contrast">
          Select whether you want to notify your consumers about E-Service's
          changes through Signal Hub.
        </span>
      </div>
      <form.Field name="isSignalHubEnabled">
        {(field) => (
          <Checkbox
            isRequired
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
