"use client";

import React from "react";
import { EditorProvider } from "@/modules/editor/store/EditorContext";
import { EditorCanvas } from "@/modules/editor/components/EditorCanvas";

/**
 * Страница редактора макетов.
 * URL: /editor/[designId]
 *
 * TODO (следующие спринты):
 * - Загрузка шаблона по designId
 * - Панели инструментов
 * - Сохранение
 */
export default function EditorPage() {
  return (
    <EditorProvider>
      <div className="flex flex-col h-full">
        {/* Верхняя панель (временная) */}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-zinc-800">Редактор макетов</h1>
          <div className="flex gap-2 text-sm text-zinc-600">
            <button
              className="px-3 py-1 rounded bg-zinc-100 hover:bg-zinc-200"
              onClick={() => window.history.back()}
            >
              ← Назад
            </button>
          </div>
        </header>

        {/* Холст */}
        <EditorCanvas format="A4" bleedMM={3} />
      </div>
    </EditorProvider>
  );
}
