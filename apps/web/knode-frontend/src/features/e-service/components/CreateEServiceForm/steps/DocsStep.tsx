import { bffApi } from "@knodia/bff-client";
import {
  Banner,
  Button,
  Divider,
  FileUpload,
  TextField,
  toastQueue,
} from "@knodia/ui-kit/ui";
import { TrashIcon } from "@phosphor-icons/react";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import {
  useDocsStepForm,
  useEServiceWizardContext,
} from "@/features/e-service/contexts/useEServiceFormContext";
import { client } from "@/libs/axios";
import { downloadResponseAsFile } from "@/utils/downloadFile";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import { DocumentRecap } from "../../DocumentRecap";
import { RemovableDocumentRecap } from "../components/RemovableDocumentRecap";

type DocsStepForm = ReturnType<typeof useDocsStepForm>;

export function DocsStep() {
  const { nextStep, prevStep } = useStepsContext();
  const form = useDocsStepForm(nextStep);
  const { template } = useEServiceWizardContext();

  return (
    <>
      <div className="flex flex-col gap-10">
        {template ? (
          <TemplateDocsStepContent form={form} template={template} />
        ) : (
          <ScratchDocsStepContent form={form} />
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

function ContactDataSection({ form }: { form: DocsStepForm }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        description="Add your E-Service contact data."
        title="Contact data"
      />

      <form.Field name="contactName">
        {(field) => (
          <TextField
            errorMessage={getFieldErrorMessage(field.state.meta.errors)}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            isRequired
            label="Contact name"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            size="lg"
            value={field.state.value}
          />
        )}
      </form.Field>

      <form.Field name="contactEmail">
        {(field) => (
          <TextField
            errorMessage={getFieldErrorMessage(field.state.meta.errors)}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            isRequired
            label="Contact email"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            size="lg"
            value={field.state.value}
          />
        )}
      </form.Field>

      <form.Field name="contactUrl">
        {(field) => (
          <TextField
            errorMessage={getFieldErrorMessage(field.state.meta.errors)}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            label="Contact URL (optional)"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            size="lg"
            value={field.state.value}
          />
        )}
      </form.Field>
    </div>
  );
}

function ScratchDocsStepContent({ form }: { form: DocsStepForm }) {
  return (
    <>
      <StepHeader description="Upload the API specs files." title="Documents">
        <Banner kind="informative">
          The API specs file cannot be modified after publication.
        </Banner>
      </StepHeader>

      <div className="flex flex-col gap-6">
        <h3 className="title-sm-em text-secondary-light-low-contrast">
          API specs
        </h3>

        <div className="flex flex-col gap-4">
          <form.Subscribe selector={(state) => state.values}>
            {(values) =>
              values.interfaceDocument && (
                <RemovableDocumentRecap
                  name={values.interfaceDocument.name}
                  onRemove={() => form.setFieldValue("interfaceDocument", null)}
                />
              )
            }
          </form.Subscribe>
          <form.Field name="interfaceDocument">
            {(field) => (
              <FileUpload
                ariaLabel="API specs file"
                description="Accepted format: YAML, JSON (up to 1 MB)."
                errorMessage={getFieldErrorMessage(field.state.meta.errors)}
                onSelect={(files) => {
                  const file = files?.[0] ?? null;
                  field.handleChange(file);
                }}
              />
            )}
          </form.Field>
        </div>
      </div>
    </>
  );
}

function ServerUrlsSection({ form }: { form: DocsStepForm }) {
  const handleAddServerUrl = () => {
    const serverUrls = form.getFieldValue("serverUrls") ?? [];
    form.setFieldValue("serverUrls", [...serverUrls, ""]);
  };

  const handleRemoveServerUrl = (index: number) => {
    const serverUrls = form.getFieldValue("serverUrls") ?? [];
    form.setFieldValue(
      "serverUrls",
      serverUrls.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <form.Field mode="array" name="serverUrls">
        {(field) => (
          <div className="flex flex-col gap-4">
            {field.state.value?.map((_, index) => (
              <div className="flex items-end gap-6" key={index}>
                <form.Field name={`serverUrls[${index}]`}>
                  {(serverUrlField) => (
                    <TextField
                      className="flex-1"
                      errorMessage={getFieldErrorMessage(
                        serverUrlField.state.meta.errors,
                      )}
                      isInvalid={
                        serverUrlField.state.meta.isTouched &&
                        !serverUrlField.state.meta.isValid
                      }
                      isRequired
                      label={
                        index === 0 ? "Server URL" : `Server URL ${index + 1}`
                      }
                      name={serverUrlField.name}
                      onBlur={serverUrlField.handleBlur}
                      onChange={serverUrlField.handleChange}
                      size="lg"
                      value={serverUrlField.state.value}
                    />
                  )}
                </form.Field>

                {index > 0 && (
                  <Button
                    aria-label={`Delete Server URL ${index + 1}`}
                    hierarchy="danger"
                    kind="tonal"
                    onPress={() => handleRemoveServerUrl(index)}
                    size="icon-sm"
                  >
                    <TrashIcon />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </form.Field>

      <Button
        className="self-start"
        hierarchy="neutral"
        kind="tonal"
        onPress={handleAddServerUrl}
      >
        Add server URL
      </Button>
    </div>
  );
}

function TemplateDocsStepContent({
  form,
  template,
}: {
  form: DocsStepForm;
  template: bffApi.EserviceTemplateDetails;
}) {
  const interfaceDocument = template.eserviceFields.interfaceDocument;

  const handleInterfaceDownload = async () => {
    try {
      const response = await bffApi.downloadEserviceTemplateInterface({
        client,
        path: { eserviceTemplateId: template.id },
        query: { knodeId: template.knodeId },
      });

      downloadResponseAsFile(
        response.data,
        interfaceDocument.name,
        response.headers["content-type"],
      );
    } catch {
      toastQueue.add({
        description: "Retry later",
        kind: "error",
        title: "Download failed",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Customize the API specs file template."
          title="Documents"
        />

        <DocumentRecap
          name={interfaceDocument.prettyName.en}
          onDownload={handleInterfaceDownload}
          showDownloadButton
        />
      </div>

      <ServerUrlsSection form={form} />

      <form.Field name="termsOfServiceUrl">
        {(field) => (
          <TextField
            errorMessage={getFieldErrorMessage(field.state.meta.errors)}
            isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            label="Terms and Conditions URL (optional)"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            size="lg"
            value={field.state.value}
          />
        )}
      </form.Field>

      <Divider />

      <ContactDataSection form={form} />
    </>
  );
}
