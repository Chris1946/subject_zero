"use client";

import React from "react";
import { DataTable, ColumnDef } from "@/components/DataTable";
import { ToolProps } from "@/rounds/types";

export interface ProcessLogRow {
  processId: string;
  projectTag: string;
  status: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface ProcessTableData {
  rows?: ProcessLogRow[];
}

const DEFAULT_ROWS: ProcessLogRow[] = [
  { processId: "314", projectTag: "SZ", status: "SUCCESS", timestamp: "23:07:48" },
  { processId: "428", projectTag: "SZ", status: "FAILED", timestamp: "23:09:12" },
  { processId: "721", projectTag: "SZ", status: "SUCCESS", timestamp: "23:12:31" },
];

export function ProcessTable({ data }: ToolProps<unknown>) {
  const tableData = (data && typeof data === "object" ? data : {}) as ProcessTableData;
  const rows = tableData?.rows && tableData.rows.length > 0 ? tableData.rows : DEFAULT_ROWS;

  const columns: ColumnDef<ProcessLogRow>[] = [
    {
      key: "processId",
      header: "PROCESS ID",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-[var(--accent)] tracking-wider">
          {row.processId}
        </span>
      ),
    },
    {
      key: "projectTag",
      header: "PROJECT TAG",
      sortable: true,
      render: (row) => (
        <span className="text-[var(--text)] tracking-wider">{row.projectTag}</span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      sortable: true,
      render: (row) => {
        const isSuccess = row.status === "SUCCESS";
        return (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase border ${
              isSuccess
                ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "timestamp",
      header: "TIMESTAMP",
      sortable: true,
      render: (row) => (
        <span className="tabular-nums tracking-widest text-[var(--text-muted)]">
          {row.timestamp}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full my-3 space-y-2 font-mono">
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.processId}
        caption="TERMINAL 02 // SZ SYSTEM PROCESS BUFFER"
        showCheckboxes={false}
      />
      <div className="text-[10px] text-[var(--text-muted)] tracking-wider">
        Operator Tip: Click column headers to sort records. Review the data and enter the matching Process ID below.
      </div>
    </div>
  );
}

export default ProcessTable;
