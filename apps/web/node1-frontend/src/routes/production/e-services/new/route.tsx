import { Steps } from "@knodia/ui-kit/ui";
import { createFileRoute, Outlet } from "@tanstack/react-router";

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

  return (
    <StepsProvider stepConfig={CREATE_FORM_STEPS}>
      <form.AppForm>
        <EServiceFormProvider value={form}>
          <NewEServiceLayoutContent />
        </EServiceFormProvider>
      </form.AppForm>
    </StepsProvider>
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
