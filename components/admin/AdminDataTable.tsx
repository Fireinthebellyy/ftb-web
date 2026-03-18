"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage: string;
  filterColumnId?: string;
  filterPlaceholder?: string;
  toolbarActions?: ReactNode;
  pageSize?: number;
  tableId?: string;
}

const DEFAULT_VISIBILITY_STATE: VisibilityState = {};

const isValidVisibilityState = (parsed: unknown): parsed is VisibilityState => {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return false;
  }

  return Object.values(parsed as Record<string, unknown>).every(
    (value) => typeof value === "boolean"
  );
};

export function AdminDataTable<TData, TValue>({
  columns,
  data,
  emptyMessage,
  filterColumnId,
  filterPlaceholder = "Search...",
  toolbarActions,
  pageSize = 10,
  tableId,
}: AdminDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [hasRestoredVisibility, setHasRestoredVisibility] = useState(false);

  const storageKey = tableId ? `admin-table-columns:${tableId}` : null;

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      setHasRestoredVisibility(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);

        if (isValidVisibilityState(parsed)) {
          setColumnVisibility(parsed);
        } else {
          setColumnVisibility(DEFAULT_VISIBILITY_STATE);
        }
      } else {
        setColumnVisibility(DEFAULT_VISIBILITY_STATE);
      }
    } catch {
      // Ignore invalid stored state and continue with defaults.
      setColumnVisibility(DEFAULT_VISIBILITY_STATE);
    } finally {
      setHasRestoredVisibility(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (
      !storageKey ||
      !hasRestoredVisibility ||
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [columnVisibility, hasRestoredVisibility, storageKey]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const hideableColumns = useMemo(
    () => table.getAllLeafColumns().filter((column) => column.getCanHide()),
    [table]
  );

  const getColumnLabel = (column: (typeof hideableColumns)[number]) => {
    const header = column.columnDef.header;

    if (typeof header === "string") {
      return header;
    }

    const fallback = column.id.replace(/_/g, " ");
    return `${fallback.charAt(0).toUpperCase()}${fallback.slice(1)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {filterColumnId ? (
          <Input
            placeholder={filterPlaceholder}
            value={String(
              table.getColumn(filterColumnId)?.getFilterValue() ?? ""
            )}
            onChange={(event) =>
              table
                .getColumn(filterColumnId)
                ?.setFilterValue(event.target.value)
            }
            className="w-full sm:max-w-sm"
          />
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {hideableColumns.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                  >
                    {getColumnLabel(column)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {toolbarActions ? (
            <div className="flex items-center gap-2">{toolbarActions}</div>
          ) : null}
        </div>
      </div>

      <div className="bg-background overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted/35">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border/80 bg-muted/35 hover:bg-muted/35"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-foreground/90 h-11 px-4 first:pl-6"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 h-8 gap-1 px-2"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    index % 2 === 0
                      ? "bg-background hover:bg-muted/40 data-[state=selected]:bg-muted/55"
                      : "bg-muted/20 hover:bg-muted/40 data-[state=selected]:bg-muted/55"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 first:pl-6">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 px-4 text-center first:pl-6"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} filtered rows
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
