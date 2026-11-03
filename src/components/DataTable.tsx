"use client";

import React, { useState, useId } from "react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  caption?: string;
  className?: string;
  showCheckboxes?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  caption,
  className = "",
  showCheckboxes = false,
}: DataTableProps<T>) {
  const tableId = useId();
  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleToggleRow = (key: string) => {
    setCheckedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir("asc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Sort data without automatic filtering or highlighting of any row
  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numeric vs string compare
      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }

      const comp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? comp : -comp;
    });
  }, [data, sortKey, sortDir]);

  return (
    <div
      className={`w-full border border-[var(--panel-border)] bg-[var(--bg)]/90 overflow-hidden font-mono text-xs rounded-xs ${className}`}
    >
      {caption && (
        <div className="p-2.5 sm:p-3 border-b border-[var(--panel-border)] bg-[var(--panel)]/70 flex items-center justify-between text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
          <span>{caption}</span>
          <span className="text-[10px] text-[var(--text-muted)]/60">[SORTABLE LOG BUFFER]</span>
        </div>
      )}

      {/* Internal scroll container prevents page horizontal scroll */}
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse min-w-[340px]">
          <thead>
            <tr className="border-b border-[var(--panel-border)] bg-[var(--panel)]/50 text-[10px] uppercase tracking-wider text-[var(--text-muted)] select-none">
              {/* Optional Checkbox column for operator bookmarking */}
              {showCheckboxes && (
                <th className="py-2.5 px-3 w-10 text-center" scope="col">
                  <span className="sr-only">Bookmark row</span>
                  <span>#</span>
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-2.5 px-3 font-semibold ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {col.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="min-h-[44px] flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] tracking-wider"
                        aria-label={`Sort by ${col.header} ${
                          isSorted ? (sortDir === "asc" ? "descending" : "unsorted") : "ascending"
                        }`}
                      >
                        <span>{col.header}</span>
                        <span className="text-[10px] text-[var(--accent)] font-bold">
                          {isSorted ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    ) : (
                      <span className="min-h-[44px] flex items-center">{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--panel-border)]/60 text-xs">
            {sortedData.map((row, index) => {
              const rId = rowKey(row, index);
              const isChecked = Boolean(checkedRows[rId]);
              const rowInputId = `${tableId}-row-${rId}`;

              return (
                <tr
                  key={rId}
                  className={`transition-colors ${
                    isChecked
                      ? "bg-[var(--accent)]/10 text-[var(--text)]"
                      : "hover:bg-[var(--panel)]/40 text-[var(--text)]/90"
                  }`}
                >
                  {/* Optional Row note-taking checkbox */}
                  {showCheckboxes && (
                    <td className="py-2 px-3 text-center">
                      <label
                        htmlFor={rowInputId}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer m-auto"
                      >
                        <input
                          id={rowInputId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(rId)}
                          className="w-4 h-4 accent-[var(--accent)] cursor-pointer bg-[var(--bg)] border border-[var(--panel-border)] rounded-none"
                          aria-label={`Bookmark row ${index + 1}`}
                        />
                      </label>
                    </td>
                  )}

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-2 px-3 tracking-wider ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
