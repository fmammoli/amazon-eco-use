"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function DataTableModal<TData, TValue>({
  data,
  columns,
  title,
  description,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  triggerLabel = "View Data",
}: {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  title: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  triggerLabel?: string
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  })

  const toCsvCell = (value: unknown) => {
    if (value == null) return ""

    const normalized =
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value)

    const escaped = normalized.replace(/"/g, '""')
    return `"${escaped}"`
  }

  const getColumnHeader = (columnId: string) => {
    const column = table.getColumn(columnId)
    if (!column) return columnId

    const header = column.columnDef.header
    return typeof header === "string" ? header : columnId
  }

  const downloadCsv = () => {
    const exportColumns = table.getAllLeafColumns()
    const exportRows = table.getSortedRowModel().rows

    const headers = ["#", ...exportColumns.map((column) => getColumnHeader(column.id))]
    const csvLines = [headers.map(toCsvCell).join(",")]

    exportRows.forEach((row, index) => {
      const cells = [
        index + 1,
        ...exportColumns.map((column) => row.getValue(column.id)),
      ]
      csvLines.push(cells.map(toCsvCell).join(","))
    })

    const csvContent = csvLines.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    const safeTitle = title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")

    link.href = url
    link.download = `${safeTitle || "chart-data"}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
          className="text-[11px]"
        >
          {triggerLabel}
        </Button>
      ) : null}
      <DialogContent className="flex max-h-[85vh] w-[96vw] max-w-7xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <TableHead className="w-14 text-xs">#</TableHead>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex cursor-pointer items-center gap-1 text-left hover:underline"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() === "asc"
                            ? "▲"
                            : header.column.getIsSorted() === "desc"
                              ? "▼"
                              : "↕"}
                        </button>
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
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="py-4 text-center text-xs text-muted-foreground"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        row.index +
                        1}
                    </TableCell>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 text-xs">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
          <div className="text-xs text-muted-foreground">
            Showing{" "}
            {table.getRowModel().rows.length === 0
              ? 0
              : table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                1}{" "}
            to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} rows
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCsv}
              className="text-xs"
            >
              Download CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
