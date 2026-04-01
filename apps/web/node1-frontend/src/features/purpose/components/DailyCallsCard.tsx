import { SettingsCard } from "@/components/SettingCard";
import { formatNumber } from "@/utils/formatters";

export function DailyCallsCard({
  dailyCalls,
  maxDailyCallsPerConsumer,
}: {
  dailyCalls: number;
  maxDailyCallsPerConsumer: number;
}) {
  return (
    <SettingsCard label="Declared API calls per day">
      {formatNumber(dailyCalls)}{" "}
      <span className="title-md font-normal">
        (max {formatNumber(maxDailyCallsPerConsumer)})
      </span>
    </SettingsCard>
  );
}
