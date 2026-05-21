import type { bffApi } from "@knodia/bff-client";

import { categories } from "@knodia/category-models";
import { KnodeId } from "@knodia/common-models/ids";
import {
  Button,
  ComboBox,
  ComboBoxItem,
  Empty,
  Loader,
} from "@knodia/ui-kit/ui";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { config } from "@/config/config";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import { CreateEServiceForm } from "@/features/e-service/components/CreateEServiceForm";
import { CreateEserviceFullPageModal } from "@/features/e-service/components/CreateEserviceFullPageModal";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import {
  eserviceTemplateSearchDefaultValues,
  eserviceTemplateSearchSchema,
} from "@/features/e-service/models/search-params";
import {
  eserviceTemplateDetailsQuery,
  eserviceTemplatesQuery,
} from "@/features/e-service/services/queries";
import {
  parseSchemeRefKey,
  toSchemeRefOptions,
} from "@/features/e-service/utils/schemeRef";
import { useLeaveConfirmModal } from "@/hooks/useLeaveConfirmModal";
import { requireRole } from "@/libs/routeGuards";

const knodeOptions = KnodeId.options.map((id) => ({ id, label: id }));

const categoryOptions = toSchemeRefOptions(categories);

export const Route = createFileRoute(
  "/_authenticated/production/e-services/from-template",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { knodeId, templateId } }) => ({
    knodeId,
    templateId,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context, deps: { templateId, knodeId } }) => {
    requireRole(context, "technical");
    if (templateId) {
      context.queryClient.prefetchQuery(
        eserviceTemplateDetailsQuery(templateId, knodeId),
      );
    }
    context.queryClient.prefetchQuery(eserviceTemplatesQuery(knodeId));
  },
  search: {
    middlewares: [stripSearchParams(eserviceTemplateSearchDefaultValues)],
  },
  validateSearch: eserviceTemplateSearchSchema,
});

function EserviceTemplateCard({
  categories,
  description,
  id,
  mode,
  onSelect,
  title,
}: {
  categories: bffApi.EserviceCategory[];
  description: string;
  id: string;
  mode: bffApi.EserviceMode;
  onSelect: (templateId: string) => void;
  title: string;
}) {
  return (
    <article className="p-4 flex flex-col gap-4 rounded-eservice-card elevation-1 border border-eservice-card-border">
      <header className="flex gap-10 items-start">
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="min-w-0 title-md-em truncate">{title}</h3>
          <p className="body-md text-primary-light-low-contrast line-clamp-2">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            aria-label="Use template"
            hierarchy="neutral"
            kind="outlined"
            onPress={() => onSelect(id)}
            size="icon-md"
          >
            <ArrowRightIcon />
          </Button>
        </div>
      </header>
      <footer className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <EserviceModeChip mode={mode} />
          {categories.map((category, i) => (
            <CategoryChip key={i} {...category} />
          ))}
        </div>
      </footer>
    </article>
  );
}

function RouteComponent() {
  const navigate = Route.useNavigate();
  const onClose = () =>
    navigate({ replace: true, to: "/production/e-services" });

  const { knodeId, templateId } = Route.useSearch();

  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose);

  const { data: templateDetails, isLoading: isLoadingTemplateDetails } =
    useQuery({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ...eserviceTemplateDetailsQuery(templateId!, knodeId),
      enabled: !!templateId,
    });

  return (
    <>
      <CreateEserviceFullPageModal onClose={handleShowLeaveConfirm}>
        {!templateId && <TemplatesListSelector />}
        {templateId && isLoadingTemplateDetails && (
          <Loader className="mx-auto my-20" label="Loading template..." />
        )}
        {templateId && templateDetails && (
          <CreateEServiceForm
            onLeave={handleShowLeaveConfirm}
            template={templateDetails}
          />
        )}
      </CreateEserviceFullPageModal>
      {leaveConfirmModal}
    </>
  );
}

function TemplatesListContent({
  isLoading,
  onSelectTemplate,
  templates,
}: {
  isLoading: boolean;
  onSelectTemplate: (templateId: string) => void;
  templates: bffApi.EserviceTemplate[];
}) {
  if (isLoading) {
    return <Loader className="mx-auto mb-10" label="Loading templates..." />;
  }
  if (templates.length === 0) {
    return (
      <Empty
        className="mt-4"
        description="Try with different filters."
        icon={<MagnifyingGlassIcon />}
        kind="brand-soft"
        title="No results found for your search."
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {templates.map((template) => (
        <EserviceTemplateCard
          categories={template.categories}
          description={template.description.en}
          id={template.id}
          key={template.id}
          mode={template.mode}
          onSelect={() => onSelectTemplate(template.id)}
          title={template.name.en}
        />
      ))}
    </div>
  );
}

function TemplatesListSelector() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { data, isLoading: isLoadingTemplates } = useQuery(
    eserviceTemplatesQuery(search.knodeId),
  );

  const handleFilterChange = (values: Partial<typeof search>) => {
    navigate({
      replace: true,
      search: (prev) => ({ ...prev, ...values }),
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    navigate({
      search: { knodeId: search.knodeId, templateId },
    });
  };

  const selectedCategory =
    search.category && parseSchemeRefKey(search.category);

  const templates = (data ?? []).filter((template) =>
    selectedCategory
      ? template.categories.some(
          (c) =>
            c.code === selectedCategory.code &&
            c.scheme === selectedCategory.scheme,
        )
      : true,
  );

  return (
    <div className="mx-auto max-w-160 p-10 pb-16">
      <h2 className="headline-lg-em text-primary-light-high-contrast mb-10">
        Choose template
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <ComboBox
          defaultItems={knodeOptions}
          label="Knode"
          onSelectionChange={(key) =>
            handleFilterChange({
              knodeId: (key as bffApi.KnodeId) ?? config.knodeId,
            })
          }
          placeholder="Select a Knode"
          selectedKey={search.knodeId}
        >
          {(option) => (
            <ComboBoxItem id={option.id}>{option.label}</ComboBoxItem>
          )}
        </ComboBox>

        <ComboBox
          defaultItems={categoryOptions}
          isClearable
          label="Category"
          onSelectionChange={(key) =>
            handleFilterChange({ category: (key as string) ?? "" })
          }
          placeholder="Select a Category"
          selectedKey={search.category || null}
        >
          {(option) => (
            <ComboBoxItem id={option.id}>{option.label}</ComboBoxItem>
          )}
        </ComboBox>
      </div>

      <TemplatesListContent
        isLoading={isLoadingTemplates}
        onSelectTemplate={handleSelectTemplate}
        templates={templates}
      />
    </div>
  );
}
