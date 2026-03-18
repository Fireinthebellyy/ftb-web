import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

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
        <div className="flex items-center justify-center">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          <span className="sr-only">Loading</span>
        </div>
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
