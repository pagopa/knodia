import { Button } from "@knodia/ui-kit/ui";
import { DownloadSimpleIcon, FileTextIcon } from "@phosphor-icons/react";

interface Props {
  name: string;
  onDownload?: () => void;
  showDownloadButton?: boolean;
}

export const DocumentRecap = ({
  name,
  onDownload,
  showDownloadButton = false,
}: Props) => (
  <div className="bg-primary-light border-slate-100 border py-3 px-4 rounded-2xl flex justify-between elevation-1">
    <div className="flex gap-4 items-center">
      <FileTextIcon className="text-brand-dark" size={24} />
      <span className="body-lg-em text-primary-light-high-contrast">
        {name}
      </span>
    </div>

    {showDownloadButton && (
      <Button
        aria-label={`Download document ${name}`}
        hierarchy="neutral"
        kind="tonal"
        {...(onDownload && { onPress: onDownload })}
        size="icon-md"
      >
        <DownloadSimpleIcon />
      </Button>
    )}
  </div>
);
