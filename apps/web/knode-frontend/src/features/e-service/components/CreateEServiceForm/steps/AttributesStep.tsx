import { attributes } from "@knodia/attribute-models";
import { getOrganizationsOptions } from "@knodia/bff-client/tanstack-query";
import { KnodeId } from "@knodia/common-models/ids";
import {
  Banner,
  Button,
  Chip,
  Label,
  MultiSelectComboBox,
  MultiSelectComboBoxItem,
} from "@knodia/ui-kit/ui";
import { BookOpenTextIcon, TrashIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DialogTrigger } from "react-aria-components";

import { AttributesListModal } from "@/components/AttributesListModal";
import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { config } from "@/config/config";
import { useStepsContext } from "@/contexts/steps";
import {
  useAttributesStepForm,
  useEServiceWizardContext,
} from "@/features/e-service/contexts/useEServiceFormContext";
import {
  getSchemeRefLabel,
  parseSchemeRefKeys,
  toSchemeRefKey,
  toSchemeRefOptions,
} from "@/features/e-service/utils/schemeRef";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { client } from "@/libs/axios";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

// The other knode: e-service consumption is always cross-knode, and (for now)
// there are exactly two knodes, so the "other" knode is the one that isn't ours.
const otherKnodeId =
  KnodeId.options.find((id) => id !== config.knodeId) ?? config.knodeId;

// TODO(KN-843): replace hardcoded limit with infinite scroll when the other knode's organizations grow
const REMOTE_ORGANIZATIONS_PAGE_SIZE = 50;

// The standard set is a static dictionary; flatten it once at module load.
const STANDARD_ATTRIBUTE_OPTIONS = toSchemeRefOptions(attributes);

type AttributesStepForm = ReturnType<typeof useAttributesStepForm>;

export function AttributesStep() {
  const { nextStep, prevStep } = useStepsContext();
  const form = useAttributesStepForm(nextStep);
  const { template } = useEServiceWizardContext();

  const handleAddGroup = () => {
    const currentGroups = form.getFieldValue("requiredAttributes") ?? [];
    form.setFieldValue("requiredAttributes", [...currentGroups, []]);
  };

  const handleRemoveGroup = (index: number) => {
    const currentGroups = form.getFieldValue("requiredAttributes") ?? [];
    form.setFieldValue(
      "requiredAttributes",
      currentGroups.filter((_, i) => i !== index),
    );
  };

  const areDefinedByTemplate = template !== undefined;

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Choose which organizations can request an Agreement for your E-Service."
          title="Attributes"
        >
          <Banner kind="informative">
            E-Services' attributes cannot be modified after publication.
          </Banner>
          <p className="body-md text-primary-dark">
            Organizations must have at least one attribute within a group to
            request an Agreement for your E-Service. If you want to request that
            Consumers have more than one attribute, create separate groups.
          </p>
        </StepHeader>

        <form.Field mode="array" name="requiredAttributes">
          {(field) => (
            <div className="flex flex-col gap-10">
              {field.state.value?.map((_, groupIndex) => (
                <div className="flex flex-col gap-6" key={groupIndex}>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3 justify-between">
                      <h3 className="headline-sm-em text-primary-light-high-contrast flex-1">
                        Group {groupIndex + 1}
                      </h3>

                      {!areDefinedByTemplate && groupIndex > 0 && (
                        <Button
                          aria-label={`Delete Group ${groupIndex + 1}`}
                          hierarchy="danger"
                          kind="tonal"
                          onPress={() => handleRemoveGroup(groupIndex)}
                          size="icon-sm"
                        >
                          <TrashIcon />
                        </Button>
                      )}
                    </div>
                    <span className="body-md text-primary-light-high-contrast">
                      Organizations must have at least one attribute inside this
                      group.
                    </span>
                  </div>
                  <AttributesField
                    areDefinedByTemplate={areDefinedByTemplate}
                    form={form}
                    groupIndex={groupIndex}
                  />
                </div>
              ))}
            </div>
          )}
        </form.Field>

        {!areDefinedByTemplate && (
          <Button
            className="self-start"
            hierarchy="neutral"
            kind="tonal"
            onPress={handleAddGroup}
          >
            Add group
          </Button>
        )}
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

function AttributesField({
  areDefinedByTemplate,
  form,
  groupIndex,
}: {
  areDefinedByTemplate: boolean;
  form: AttributesStepForm;
  groupIndex: number;
}) {
  // Template-defined attributes are locked into a read-only field; the searchable
  // picker (standard set + other-knode organizations) is for from-scratch creation.
  return areDefinedByTemplate ? (
    <TemplateAttributesField form={form} groupIndex={groupIndex} />
  ) : (
    <SearchableAttributesField form={form} groupIndex={groupIndex} />
  );
}

function AttributesListCTA() {
  return (
    <DialogTrigger>
      <Button className="shrink-0" hierarchy="neutral" kind="ghost" size="lg">
        <BookOpenTextIcon />
        Attributes list
      </Button>
      <AttributesListModal />
    </DialogTrigger>
  );
}

function SearchableAttributesField({
  form,
  groupIndex,
}: {
  form: AttributesStepForm;
  groupIndex: number;
}) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedName] = useDebounceValue(inputValue, 500);

  // Other-knode organizations, server-filtered by name (single page — infinite
  // scroll is deferred). On failure the field silently degrades to the standard set.
  const { data, isError } = useQuery({
    ...getOrganizationsOptions({
      client,
      query: {
        knodeId: otherKnodeId,
        limit: REMOTE_ORGANIZATIONS_PAGE_SIZE,
        ...(debouncedName ? { name: debouncedName } : {}),
        offset: 0,
      },
    }),
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => {
    const search = debouncedName.toLowerCase();
    // The standard set is local, so it is filtered client-side; the remote orgs
    // are already filtered server-side by `name`.
    const standardItems = STANDARD_ATTRIBUTE_OPTIONS.filter((item) =>
      item.label.toLowerCase().includes(search),
    );
    // Drop remote orgs on error (degraded mode = standard set only); otherwise
    // keepPreviousData would keep stale orgs from the last successful query.
    const organizationItems = isError
      ? []
      : (data?.results ?? []).map((organization) => ({
          id: toSchemeRefKey({
            code: organization.name,
            scheme: organization.knodeId,
          }),
          label: organization.name,
        }));
    return [...standardItems, ...organizationItems];
  }, [debouncedName, data, isError]);

  return (
    <form.Field name={`requiredAttributes[${groupIndex}]`}>
      {(groupField) => {
        const keys = (groupField.state.value ?? []).map(toSchemeRefKey);

        return (
          <MultiSelectComboBox
            action={<AttributesListCTA />}
            errorMessage={getFieldErrorMessage(groupField.state.meta.errors)}
            inputValue={inputValue}
            isInvalid={!groupField.state.meta.isValid}
            isRequired
            items={items}
            label="Attributes"
            onChange={(newKeys) =>
              groupField.handleChange(parseSchemeRefKeys([...newKeys]))
            }
            onInputChange={setInputValue}
            placeholder="Select one or more attributes"
            value={keys}
          >
            {(item) => (
              <MultiSelectComboBoxItem id={item.id}>
                {item.label}
              </MultiSelectComboBoxItem>
            )}
          </MultiSelectComboBox>
        );
      }}
    </form.Field>
  );
}

function TemplateAttributesField({
  form,
  groupIndex,
}: {
  form: AttributesStepForm;
  groupIndex: number;
}) {
  return (
    <form.Field name={`requiredAttributes[${groupIndex}]`}>
      {(groupField) => {
        const tags = (groupField.state.value ?? []).map(toSchemeRefKey);

        return (
          // Template attributes are locked, so they are displayed as static
          // chips rather than an editable (disabled) field.
          <div className="flex flex-col gap-1">
            <Label>Attributes</Label>
            <div className="flex gap-4 items-center">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {tags.map((key) => (
                  <Chip key={key} label={getSchemeRefLabel(key)} type="light" />
                ))}
              </div>
              <AttributesListCTA />
            </div>
          </div>
        );
      }}
    </form.Field>
  );
}
