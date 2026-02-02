import { FileTrigger, type FileTriggerProps } from "react-aria-components";

import { Button } from "./Button";
import { Description } from "./Field";

const DEFAULT_ACCEPTED_FILE_TYPES = [".yaml", ".yml", ".json", ".xml"];

interface FileUploadProps extends Pick<
  FileTriggerProps,
  "acceptedFileTypes" | "allowsMultiple" | "onSelect"
> {
  /** Text shown on the file trigger button */
  buttonLabel?: string;
  /** Description text (e.g., "Accepted format: YAML, JSON, XML") */
  description?: string;
  /** Whether the field is disabled */
  isDisabled?: boolean;
}

export function FileUpload({
  acceptedFileTypes = DEFAULT_ACCEPTED_FILE_TYPES,
  allowsMultiple = false,
  buttonLabel = "Choose file",
  description = "Accepted format: YAML, JSON, XML",
  isDisabled = false,
  onSelect,
}: FileUploadProps) {
  return (
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
  );
}
