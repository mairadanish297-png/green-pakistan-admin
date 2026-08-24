"use client";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title: string;
  actions?: (row: any) => React.ReactNode;
}

export default function DataTable({ columns, data, title, actions }: DataTableProps) {
  return (
    <div
      className="rounded-xl border overflow-hidden animate-fade-in"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div
        className="p-5 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <span
          className="text-sm px-3 py-1 rounded-full"
          style={{ background: "rgba(46,204,113,0.1)", color: "var(--emerald)" }}
        >
          {data.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--bg-secondary)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                className="border-t transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 text-sm" style={{ color: "var(--text-primary)" }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && <td className="px-5 py-4">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-12 text-center" style={{ color: "var(--text-secondary)" }}>
          No records found
        </div>
      )}
    </div>
  );
}