"use client";

import React, { useCallback } from "react";
import { EditorProvider, useEditorContext } from "@/modules/editor/store/EditorContext";
import EditorCanvas from "@/modules/editor/components/EditorCanvas";
import { TemplateSelector } from "@/modules/editor/components/TemplateSelector";
import { PhotoPanel } from "@/modules/editor/components/PhotoPanel";
import { TextPanel } from "@/modules/editor/components/TextPanel";
import { ObjectProperties } from "@/modules/editor/components/ObjectProperties";
import { CanvasActions } from "@/modules/editor/components/CanvasActions";
import { useCanvasManager } from "@/modules/editor/hooks/useCanvasManager";
import { useExport } from "@/modules/editor/hooks/useExport";
import type { Format } from "@/lib/types/domain";

/**
 * Полноэкранный редактор макетов.
 * URL: /editor/[designId]
 *
 * Layout: h-screen flex-row с fixed сайдбарами шириной 256px каждый.
 * Центральная область использует margin для отступа от сайдбаров.
 * Работает без dashboard layout (без header, без max-w-5xl).
 */
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

  const handleFormatChange = useCallback(
    (format: Format) => {
      const manager = getManager();
      if (!manager) return;

      manager.setCanvasSize(format, 3);
      dispatch({
        type: "SET_LOADED",
        payload: {
          format,
          widthMM: format === "A4" ? 210 : 297,
          heightMM: format === "A4" ? 297 : 420,
          bleedMM: 3,
        },
      });
    },
    [getManager, dispatch],
  );

  const handleTemplateSelect = useCallback(
    async (template: any) => {
      const manager = getManager();
      if (!manager) return;

      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const newFormat = template.format;
        const newWidthMM = Number(template.width_mm);
        const newHeightMM = Number(template.height_mm);

        manager.setCanvasSize(newFormat, 3);

        if (template.base_design_id) {
          const ok = await loadDesign(manager, template.base_design_id);
          if (ok) {
            dispatch({
              type: "SET_LOADED",
              payload: {
                format: newFormat,
                widthMM: newWidthMM,
                heightMM: newHeightMM,
                bleedMM: 3,
              },
            });
            return;
          }
        }
        manager.setTemplate([]);
        dispatch({
          type: "SET_LOADED",
          payload: {
            format: newFormat,
            widthMM: newWidthMM,
            heightMM: newHeightMM,
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
    <>
      {/* Левая панель — фиксирована слева окна */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-200 bg-zinc-50 overflow-y-auto z-20">
        <CanvasActions
          getManager={getManager}
          onSave={handleSave}
          onExport={handleExport}
          onBack={() => window.history.back()}
        />
        <ObjectProperties getManager={getManager} />
      </aside>

      {/* Правая панель — фиксирована справа окна */}
      <aside className="fixed right-0 top-0 h-screen w-64 border-l border-zinc-200 bg-zinc-50 overflow-y-auto z-20">
        <TemplateSelector onSelect={handleTemplateSelect} onFormatChange={handleFormatChange} />
        <PhotoPanel getManager={getManager} />
        <TextPanel getManager={getManager} />
      </aside>

      {/* Холст — занимает всё доступное пространство между панелями */}
      <EditorCanvas
        format="A4"
        bleedMM={3}
        externalCanvasRef={canvasRef}
        externalGetManager={getManager}
      />
    </>
  );
}

/**
 * Страница редактора — полноэкранный режим, без dashboard layout.
 * URL: /editor/[designId]
 */
export default function EditorPage() {
  return (
    <EditorProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-row bg-gray-100">
        <EditorContent />
      </div>
    </EditorProvider>
  );
}
