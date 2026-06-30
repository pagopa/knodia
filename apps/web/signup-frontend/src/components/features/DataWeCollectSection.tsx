import { DownloadIcon } from "@/components/icons";
import { Button } from "@/components/ui";

interface DataWeCollectSectionProps {
  onDownload: () => void;
}

export function DataWeCollectSection({
  onDownload,
}: DataWeCollectSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-style-section-title text-neutral-graphite">
        Your personal data
      </h2>
      <p className="text-style-body text-neutral-medium-gray">
        We collected some of your data to set up your access.
      </p>
      <div className="flex flex-col gap-4">
        <Button
          className="gap-2 self-start"
          onPress={onDownload}
          variant="text"
        >
          Download your data in JSON format
          <DownloadIcon className="size-6" />
        </Button>
      </div>
    </div>
  );
}
