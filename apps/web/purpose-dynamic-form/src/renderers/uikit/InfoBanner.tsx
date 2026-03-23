import { Banner } from "@knodia/ui-kit/ui";

interface Props {
  text: string;
  variant?: "error" | "info" | "warning";
}

const KINDS = {
  error: "error",
  info: "informative",
  warning: "warning",
} as const;

export function InfoBanner({ text, variant = "info" }: Props) {
  return <Banner kind={KINDS[variant]}>{text}</Banner>;
}
