import { ReactNode } from "react";

interface AdminTableStateProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

export function AdminTableState({
  isLoading,
  isError,
  errorMessage = "Something went wrong while loading data.",
  isEmpty,
  emptyMessage,
  children,
}: AdminTableStateProps) {
  if (isLoading) {
    return (
      <div className="bg-background rounded-lg border p-10 text-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-background rounded-lg border p-10 text-center">
        <p className="text-destructive text-sm font-medium">{errorMessage}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-background rounded-lg border p-10 text-center">
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
