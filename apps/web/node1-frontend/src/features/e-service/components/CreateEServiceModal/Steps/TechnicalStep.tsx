import {
  Banner,
  Checkbox,
  Divider,
  Radio,
  RadioGroup,
  TextField,
} from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function TechnicalStep() {
  const form = useEServiceFormContext();
  const { nextStep, prevStep } = useStepsContext();

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

        <div className="flex flex-col gap-6">
          <form.Field name="mode">
            {(field) => (
              <RadioGroup
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

        <Divider />

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
              <TextField
                description="Max 1440 minutes (24 hours)"
                label="Duration (in minutes)"
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

        <Divider />

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
              <TextField
                description="Max number of API calls for each Knode."
                label="Per Knode"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>
          <form.Field name="maxDailyCallsPerConsumer">
            {(field) => (
              <TextField
                description="Max number of API calls for a single organization. Consumers should declare that their number of API calls per day doesn't exceed this number."
                label="Per consumer"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>
        </div>

        <Divider />

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
                isSelected={Boolean(field.state.value)}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              >
                I will notify data changes on Signal Hub
              </Checkbox>
            )}
          </form.Field>
        </div>
      </div>

      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </>
  );
}
