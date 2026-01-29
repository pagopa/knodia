import { Navbar } from "@knodia/ui-kit/layout";
import { ButtonIcon, Steps, Typography } from "@knodia/ui-kit/ui";
import { XIcon } from "@phosphor-icons/react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";

import { useAppForm } from "@/contexts/form";
import { StepsProvider } from "@/contexts/steps/StepsProvider";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { EServiceFormProvider } from "@/features/e-service/contexts/EServiceFormContext";
import {
  CREATE_FORM_STEPS,
  ESERVICE_FORM_DEFAULTS,
} from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new")({
  component: NewEServiceLayout,
});

function NewEServiceLayout() {
  const form = useAppForm({
    defaultValues: ESERVICE_FORM_DEFAULTS,
  });
  const navigate = useNavigate();

  const onClose = () => {
    form.reset();
    navigate({ to: "/production/e-services" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <Navbar className="bg-brand-light">
        <Typography className="text-brand-light-high-contrast">
          Create E-Service
        </Typography>
        <ButtonIcon hierarchy="neutral" kind="ghost" onPress={onClose}>
          <XIcon />
        </ButtonIcon>
      </Navbar>
      <StepsProvider stepConfig={CREATE_FORM_STEPS}>
        <form.AppForm>
          <EServiceFormProvider value={form}>
            <NewEServiceLayoutContent />
          </EServiceFormProvider>
        </form.AppForm>
      </StepsProvider>
    </div>
  );
}

function NewEServiceLayoutContent() {
  const { currentStepIndex, steps } = useStepsContext();
  const stepLabels = steps.map((s) => s.label);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Steps
          ariaLabel="E-Service creation steps"
          current={currentStepIndex}
          steps={stepLabels}
        />
      </div>

      <Outlet />
    </div>
  );
}
