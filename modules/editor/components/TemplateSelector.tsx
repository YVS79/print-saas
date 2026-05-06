"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTemplate } from "../hooks/useTemplate";
import type { Format } from "@/lib/types/domain";

interface TemplateItem {
  id: string;
  name: string;
  format: Format;
  width_mm: string;
  height_mm: string;
  base_design_id: string;
}

interface TemplateSelectorProps {
  onSelect: (template: TemplateItem) => void;
}

/**
 * TemplateSelector — панель выбора шаблона.
 * Загружает список шаблонов с API и позволяет выбрать один.
 */
export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const { fetchTemplates, isLoading } = useTemplate();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [formatFilter, setFormatFilter] = useState<Format | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates(formatFilter || undefined)
      .then((data) => {
        setTemplates(data as TemplateItem[]);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Ошибка загрузки шаблонов");
      });
  }, [fetchTemplates, formatFilter]);

  return (
    <div className="p-4 border-b border-zinc-200 bg-white">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Шаблоны
      </h3>

      {/* Фильтр по формату */}
      <select
        className="w-full text-sm border border-zinc-300 rounded px-2 py-1 mb-3"
        value={formatFilter}
        onChange={(e) => setFormatFilter(e.target.value as Format | "")}
      >
        <option value="">Все форматы</option>
        <option value="A4">A4</option>
        <option value="A3">A3</option>
      </select>

      {error && (
        <div className="text-xs text-red-600 mb-2">{error}</div>
      )}

      {/* Список шаблонов */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="text-xs text-zinc-400 text-center py-4">Загрузка...</div>
        ) : templates.length === 0 ? (
          <div className="text-xs text-zinc-400 text-center py-4">
            Нет шаблонов
          </div>
        ) : (
          templates.map((t) => (
            <button
              key={t.id}
              className="w-full text-left text-sm px-3 py-2 rounded border border-zinc-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => onSelect(t)}
            >
              <div className="font-medium text-zinc-800">{t.name}</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {t.format} · {t.width_mm}×{t.height_mm} мм
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
