import { ReactNode } from "react";

interface AdminTabLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  children: ReactNode;
}

export function AdminTabLayout({
  title,
  description,
  actions,
  stats,
  children,
}: AdminTabLayoutProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
          {stats ? <div className="pt-1">{stats}</div> : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
