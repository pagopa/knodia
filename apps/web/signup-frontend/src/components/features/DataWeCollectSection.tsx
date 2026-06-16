import { ArrowForwardIcon, DownloadIcon } from "@/components/icons";
import { Button } from "@/components/ui";

const COLLECTED_DATA = [
  "Full name",
  "Birth date",
  "Identity provider identifier",
  "Email address",
];

interface DataWeCollectSectionProps {
  onChangeEmail: () => void;
  onDownload: () => void;
}

export function DataWeCollectSection({
  onChangeEmail,
  onDownload,
}: DataWeCollectSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-style-section-title text-neutral-graphite">
        Data we collect
      </h2>
      <div className="flex flex-col gap-2">
        <p className="text-style-body text-neutral-medium-gray">
          To set up your access, we collect the following data:
        </p>
        <ul className="text-style-body list-disc pl-6 text-neutral-medium-gray">
          {COLLECTED_DATA.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <Button
          className="gap-2 self-start"
          onPress={onChangeEmail}
          variant="text"
        >
          Change email address
          <ArrowForwardIcon className="size-6" />
        </Button>
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
