"use client";

import React, { useCallback } from "react";
import { EditorProvider, useEditorContext } from "@/modules/editor/store/EditorContext";
import { EditorCanvas } from "@/modules/editor/components/EditorCanvas";
import { TemplateSelector } from "@/modules/editor/components/TemplateSelector";
import { PhotoPanel } from "@/modules/editor/components/PhotoPanel";
import { TextPanel } from "@/modules/editor/components/TextPanel";
import { ObjectProperties } from "@/modules/editor/components/ObjectProperties";
import { CanvasActions } from "@/modules/editor/components/CanvasActions";
import { useCanvasManager } from "@/modules/editor/hooks/useCanvasManager";
import { useExport } from "@/modules/editor/hooks/useExport";

/** Внутренний компонент, который использует хуки редактора. */
function EditorContent() {
  const { canvasRef, getManager } = useCanvasManager("A4", 3);
  const { saveDesign, exportToPNG, loadDesign } = useExport();
  const { state, dispatch } = useEditorContext();
  const designId = "new"; // TODO: брать из URL params

  const handleSave = useCallback(async () => {
    const manager = getManager();
    if (!manager) return;
    const ok = await saveDesign(manager, designId);
    if (ok) alert("Дизайн сохранён");
  }, [getManager, saveDesign, designId]);

  const handleExport = useCallback(() => {
    const manager = getManager();
    if (!manager) return;
    const dataUrl = exportToPNG(manager);
    if (dataUrl) {
      const win = window.open();
      if (win) win.document.write(`<img src="${dataUrl}" />`);
    }
  }, [getManager, exportToPNG]);

  const handleTemplateSelect = useCallback(
    async (template: any) => {
      const manager = getManager();
      if (!manager) return;

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        if (template.base_design_id) {
          const ok = await loadDesign(manager, template.base_design_id);
          if (ok) return;
        }
        manager.setTemplate([]);
        dispatch({
          type: "SET_LOADED",
          payload: {
            format: template.format,
            widthMM: Number(template.width_mm),
            heightMM: Number(template.height_mm),
            bleedMM: 3,
          },
        });
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Ошибка загрузки шаблона" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [getManager, loadDesign, dispatch],
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Левая панель — инструменты */}
      <aside className="w-64 border-r border-zinc-200 bg-zinc-50 overflow-y-auto flex-shrink-0">
        <CanvasActions getManager={getManager} onSave={handleSave} onExport={handleExport} />
        <ObjectProperties getManager={getManager} />
      </aside>

      {/* Холст — передаём внешний canvasRef чтобы не создавать второй CanvasManager */}
      <EditorCanvas
        format="A4"
        bleedMM={3}
        externalCanvasRef={canvasRef}
        externalGetManager={getManager}
      />

      {/* Правая панель — библиотека */}
      <aside className="w-64 border-l border-zinc-200 bg-zinc-50 overflow-y-auto flex-shrink-0">
        <TemplateSelector onSelect={handleTemplateSelect} />
        <PhotoPanel getManager={getManager} />
        <TextPanel getManager={getManager} />
      </aside>
    </div>
  );
}

/**
 * Страница редактора макетов.
 * URL: /editor/[designId]
 */
export default function EditorPage() {
  return (
    <EditorProvider>
      <div className="flex flex-col h-screen">
        {/* Верхняя панель */}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-zinc-800">Редактор макетов</h1>
          <button
            className="px-3 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-sm"
            onClick={() => window.history.back()}
          >
            ← Назад
          </button>
        </header>

        {/* Контент редактора */}
        <EditorContent />
      </div>
    </EditorProvider>
  );
}
