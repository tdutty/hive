interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full">
        {/* Table Header */}
        <thead>
          <tr className="bg-slate-50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-slate-500 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-100 transition-colors duration-200 ${
                  onRowClick ? "cursor-pointer hover:bg-slate-50" : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${String(column.key)}`}
                    className="px-6 py-4 text-sm text-slate-900"
                  >
                    {column.render
                      ? column.render(
                          row[column.key as keyof T],
                          row
                        )
                      : String(row[column.key as keyof T] || "-")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
