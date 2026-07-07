export function ServiceCard({ children }: { children: React.ReactNode }) {
  return (
    <article className="p-4 flex flex-col gap-4 rounded-service-card shadow-service-card border border-service-card-border">
      {children}
    </article>
  );
}

export function ServiceCardHeader({
  children,
  description,
  headingLevel = 3,
  title,
}: {
  children?: React.ReactNode;
  description?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  title: string;
}) {
  const HeadingTag = `h${headingLevel}` as const;

  return (
    <header
      className={`flex gap-10 ${description ? "items-start" : "items-center"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <HeadingTag className="min-w-0 title-md-em truncate">
          {title}
        </HeadingTag>
        {description && (
          <p className="body-md text-primary-light-low-contrast line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </header>
  );
}
