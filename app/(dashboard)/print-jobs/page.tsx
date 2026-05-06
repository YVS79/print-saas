"use client";

import { useEffect, useState } from "react";
import { fetchPrintJobs, PrintJobDTO } from "@/lib/api-client";

const STATUS_COLORS: Record<PrintJobDTO["status"], string> = {
  queued: "text-yellow-600 bg-yellow-50 border-yellow-300",
  rendering: "text-blue-600 bg-blue-50 border-blue-300",
  ready: "text-green-600 bg-green-50 border-green-300",
  failed: "text-red-600 bg-red-50 border-red-300",
};

export default function PrintJobsPage() {
  const [jobs, setJobs] = useState<PrintJobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchPrintJobs()
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-800">🖨️ Print Jobs</h1>
        <button
          onClick={load}
          disabled={loading}
          className="rounded border border-zinc-300 bg-white px-3 py-1 text-sm hover:bg-zinc-100 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">Error: {error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p className="text-sm text-zinc-500">No print jobs yet.</p>
      )}

      {/* Summary counters */}
      {jobs.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-4">
          {(["queued", "rendering", "ready", "failed"] as const).map((s) => {
            const count = jobs.filter((j) => j.status === s).length;
            return (
              <div
                key={s}
                className={`rounded border px-4 py-2 text-sm ${STATUS_COLORS[s]}`}
              >
                <span className="font-semibold">{count}</span> {s}
              </div>
            );
          })}
          <div className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-600">
            <span className="font-semibold">{jobs.length}</span> total
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600">ID</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Format</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Design</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Bleed</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Error</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {j.id.slice(0, 12)}…
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[j.status]?.split(" ")[0] ?? "text-zinc-600"} ${STATUS_COLORS[j.status]?.split(" ")[1] ?? "bg-zinc-100"}`}
                  >
                    {j.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">{j.printer_format}</td>
                <td className="px-4 py-3 text-zinc-500">
                  v{j.design_version}
                </td>
                <td className="px-4 py-3 text-zinc-500">{j.bleed_mm}mm</td>
                <td className="px-4 py-3 text-red-500">
                  {j.error_message ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {j.created_at ? new Date(j.created_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
