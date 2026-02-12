interface SectionProps extends React.ComponentProps<"section"> {
  actions?: React.ReactNode;
  title: string;
}

export function Section({ actions, children, title, ...props }: SectionProps) {
  return (
    <section {...props}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="headline-sm-em text-primary-light-high-contrast">
          {title}
        </h2>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </section>
  );
}
