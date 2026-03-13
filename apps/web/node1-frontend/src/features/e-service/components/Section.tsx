interface SectionProps extends React.ComponentProps<"section"> {
  actions?: React.ReactNode;
  description?: string;
  title: string;
}

export function Section({ actions, children, title, ...props }: SectionProps) {
  return (
    <section {...props}>
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="headline-sm-em text-primary-light-high-contrast">
            {title}
          </h2>
          {props.description && (
            <p className="body-md text-primary-dark mt-2">
              {props.description}
            </p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </section>
  );
}
