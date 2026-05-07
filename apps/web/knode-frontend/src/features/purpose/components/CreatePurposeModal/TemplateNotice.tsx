import { Banner } from "@knodia/ui-kit/ui";

import { usePurposeWizardContext } from "@/features/purpose/contexts/usePurposeFormContext";

export function TemplateNotice() {
  const { selectedTemplate } = usePurposeWizardContext();
  if (!selectedTemplate) return null;

  return (
    <Banner kind="informative">
      Answers were prepopulated from the selected template. They remain
      editable, and you (the Consumer) are responsible for the accuracy of all
      answers.
    </Banner>
  );
}
