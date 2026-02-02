interface Props {
  description: string;
  title: string;
}
export const StepTitle = ({ description, title }: Props) => (
  <div className="space-y-3">
    <h2 className="headline-lg-em text-primary-light-high-contrast">{title}</h2>
    <span className="body-md text-primary-dark">{description}</span>
  </div>
);
