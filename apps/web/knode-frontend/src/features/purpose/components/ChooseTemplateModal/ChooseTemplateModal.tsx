import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { Banner, Button } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { StepHeader } from "@/components/StepHeader";
import {
  purposeTemplateDetailsQuery,
  purposeTemplatesQuery,
} from "@/features/purpose/services/queries";
import { FullPageModal } from "@/layouts/FullPageModal";

interface Props {
  eserviceId: EserviceId;
  knodeId: KnodeId;
  onClose: () => void;
  onTemplateSelected: (template: bffApi.PurposeTemplateDetails) => void;
}

export function ChooseTemplateModal({
  eserviceId,
  knodeId,
  onClose,
  onTemplateSelected,
}: Props) {
  const queryClient = useQueryClient();
  const [isSelecting, setIsSelecting] = useState(false);

  const { data, isError, isPending } = useQuery(
    purposeTemplatesQuery(knodeId, eserviceId),
  );

  const handleSelect = async (templateId: string) => {
    setIsSelecting(true);
    try {
      const details = await queryClient.fetchQuery(
        purposeTemplateDetailsQuery(
          // The generated client types `id` as plain string; the underlying
          // value is a UUID, so we forward it as-is to the detail query.
          templateId as Parameters<typeof purposeTemplateDetailsQuery>[0],
          knodeId,
        ),
      );
      onTemplateSelected(details);
    } finally {
      setIsSelecting(false);
    }
  };

  const eserviceTemplates =
    data?.filter((t) => t.eserviceId === eserviceId) ?? [];
  const genericTemplates =
    data?.filter((t) => t.eserviceId === undefined) ?? [];

  return (
    <FullPageModal onClose={onClose} title="Create Purpose">
      <div className="mx-auto flex max-w-160 flex-col gap-10 p-10 pb-16">
        <StepHeader description="" title="Choose template" />

        {isPending && (
          <span className="body-lg text-primary-light-low-contrast">
            Loading templates...
          </span>
        )}

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
            isDisabled={isSelecting}
            onSelect={handleSelect}
            templates={eserviceTemplates}
            title="Purpose templates for this E-Service"
          />
        )}

        {genericTemplates.length > 0 && (
          <TemplateSection
            isDisabled={isSelecting}
            onSelect={handleSelect}
            templates={genericTemplates}
            title="Purpose templates for this Knode"
          />
        )}
      </div>
    </FullPageModal>
  );
}

function TemplateCard({
  isDisabled,
  onSelect,
  template,
}: {
  isDisabled: boolean;
  onSelect: () => void;
  template: bffApi.PurposeTemplate;
}) {
  return (
    <article className="flex items-start gap-10 rounded-2xl border border-slate-100 elevation-1 p-4">
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
        isDisabled={isDisabled}
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
  isDisabled,
  onSelect,
  templates,
  title,
}: {
  isDisabled: boolean;
  onSelect: (templateId: string) => void;
  templates: bffApi.PurposeTemplate[];
  title: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="title-md text-primary-light-high-contrast">{title}</h2>
      {templates.map((template) => (
        <TemplateCard
          isDisabled={isDisabled}
          key={template.id}
          onSelect={() => onSelect(template.id)}
          template={template}
        />
      ))}
    </section>
  );
}
