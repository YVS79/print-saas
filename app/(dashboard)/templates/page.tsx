"use client";

import { useEffect, useState } from "react";
import { fetchTemplates, TemplateDTO } from "@/lib/api-client";

type FormatFilter = "A4" | "A3" | "all";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FormatFilter>("all");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTemplates(filter === "all" ? undefined : filter)
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-800">📄 Templates</h1>

      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-zinc-600">Format:</span>
        {(["all", "A4", "A3"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1 text-sm ${
              filter === f
                ? "bg-zinc-800 text-white"
                : "border border-zinc-300 bg-white hover:bg-zinc-100"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <p className="text-sm text-zinc-500">Loading templates…</p>}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {!loading && !error && templates.length === 0 && (
        <p className="text-sm text-zinc-500">No templates found.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="rounded border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <h3 className="mb-1 font-semibold text-zinc-800">{t.name}</h3>
            <div className="space-y-1 text-xs text-zinc-500">
              <p>Format: {t.format}</p>
              <p>
                Size: {t.width_mm}×{t.height_mm} mm
              </p>
              <p>Bleed: {t.bleed_mm} mm</p>
              <p>Base design: {t.base_design_id.slice(0, 8)}…</p>
              <p className="text-zinc-400">
                {t.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
