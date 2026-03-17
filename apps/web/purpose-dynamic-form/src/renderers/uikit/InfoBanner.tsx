import { Banner } from "@knodia/ui-kit/ui";

interface Props {
  text: string;
}

export function InfoBanner({ text }: Props) {
  return <Banner kind="informative">{text}</Banner>;
}
