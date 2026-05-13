import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { Banner, Button, Loader } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { StepHeader } from "@/components/StepHeader";
import { purposeTemplatesQuery } from "@/features/purpose/services/queries";
import { FullPageModal } from "@/layouts/FullPageModal";

interface Props {
  eserviceId: EserviceId;
  knodeId: KnodeId;
  onClose: () => void;
  onTemplateSelected: (templateId: string) => void;
}

export function ChooseTemplateModal({
  eserviceId,
  knodeId,
  onClose,
  onTemplateSelected,
}: Props) {
  const { data, isError, isPending } = useQuery(
    purposeTemplatesQuery(knodeId, eserviceId),
  );

  const eserviceTemplates =
    data?.filter((t) => t.eserviceId === eserviceId) ?? [];
  const genericTemplates =
    data?.filter((t) => t.eserviceId === undefined) ?? [];

  return (
    <FullPageModal onClose={onClose} title="Create Purpose">
      <div className="mx-auto flex max-w-160 flex-col gap-10 p-10 pb-16">
        <StepHeader title="Choose template" />

        <Banner kind="warning">
          Selecting a template pre-fills the Purpose fields. You can edit any
          field, and you remain responsible for the accuracy of the final
          answers.
        </Banner>

        {isPending && <Loader className="mx-auto mt-10" label="Loading..." />}

        {isError && (
          <Banner kind="error">
            Failed to load purpose templates. Please try again later.
          </Banner>
        )}

        {data && data.length === 0 && (
          <Banner kind="neutral">
            No templates available for this E-Service.
          </Banner>
        )}

        {eserviceTemplates.length > 0 && (
          <TemplateSection
            onSelect={onTemplateSelected}
            templates={eserviceTemplates}
            title="Purpose templates for this E-Service"
          />
        )}

        {genericTemplates.length > 0 && (
          <TemplateSection
            onSelect={onTemplateSelected}
            templates={genericTemplates}
            title="Purpose templates for this Knode"
          />
        )}
      </div>
    </FullPageModal>
  );
}

function TemplateCard({
  onSelect,
  template,
}: {
  onSelect: () => void;
  template: bffApi.PurposeTemplate;
}) {
  return (
    <article className="flex items-start gap-10 rounded-card border border-card-border shadow-card p-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="title-md-em text-primary-light-high-contrast">
          {template.name.en}
        </h3>
        <p className="body-md text-primary-light-low-contrast">
          {template.description.en}
        </p>
      </div>
      <Button
        aria-label={`Use template ${template.name.en}`}
        hierarchy="neutral"
        kind="outlined"
        onPress={onSelect}
        size="icon-md"
      >
        <ArrowRightIcon />
      </Button>
    </article>
  );
}

function TemplateSection({
  onSelect,
  templates,
  title,
}: {
  onSelect: (templateId: string) => void;
  templates: bffApi.PurposeTemplate[];
  title: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="title-md text-primary-light-high-contrast">{title}</h2>
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          onSelect={() => onSelect(template.id)}
          template={template}
        />
      ))}
    </section>
  );
}
