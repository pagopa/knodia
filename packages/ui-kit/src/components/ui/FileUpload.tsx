import { FileTrigger, type FileTriggerProps } from "react-aria-components";

import { Button } from "./Button";
import { Description } from "./Field";

const DEFAULT_ACCEPTED_FILE_TYPES = [".yaml", ".yml", ".json"];

interface FileUploadProps extends Pick<
  FileTriggerProps,
  "acceptedFileTypes" | "allowsMultiple" | "onSelect"
> {
  /** Text shown on the file trigger button */
  buttonLabel?: string;
  /** Description text (e.g., "Accepted format: YAML, JSON") */
  description?: string;
  /** Error message to display */
  errorMessage?: string;
  /** Whether the field is disabled */
  isDisabled?: boolean;
}

export function FileUpload({
  acceptedFileTypes = DEFAULT_ACCEPTED_FILE_TYPES,
  allowsMultiple = false,
  buttonLabel = "Choose file",
  description = "Accepted format: YAML, JSON",
  errorMessage,
  isDisabled = false,
  onSelect,
}: FileUploadProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <FileTrigger
          acceptedFileTypes={acceptedFileTypes}
          allowsMultiple={allowsMultiple}
          {...(onSelect && { onSelect })}
        >
          <Button hierarchy="neutral" isDisabled={isDisabled} kind="tonal">
            {buttonLabel}
          </Button>
        </FileTrigger>
        {description && <Description>{description}</Description>}
      </div>
      {errorMessage && (
        <span className="body-sm text-error-light-low-contrast">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
