"use client";

import React, { useCallback } from "react";
import { useEditorContext } from "../store/EditorContext";
import type { CanvasManager } from "../canvas/CanvasManager";

interface CanvasActionsProps {
  getManager: () => CanvasManager | null;
  onSave?: () => void;
  onExport?: () => void;
}

/**
 * CanvasActions — панель действий над холстом.
 * Zoom, Undo/Redo, Сохранение, Экспорт.
 */
export function CanvasActions({ getManager, onSave, onExport }: CanvasActionsProps) {
  const { state } = useEditorContext();

  const handleZoomIn = useCallback(() => {
    const manager = getManager();
    if (!manager) return;
    const newZoom = Math.min(manager.core.getZoom() + 0.25, 4);
    manager.setZoom(newZoom);
  }, [getManager]);

  const handleZoomOut = useCallback(() => {
    const manager = getManager();
    if (!manager) return;
    const newZoom = Math.max(manager.core.getZoom() - 0.25, 0.25);
    manager.setZoom(newZoom);
  }, [getManager]);

  const handleZoomReset = useCallback(() => {
    const manager = getManager();
    if (!manager) return;
    manager.setZoom(1);
  }, [getManager]);

  const handleUndo = useCallback(() => {
    const manager = getManager();
    if (!manager) return;
    manager.undo();
  }, [getManager]);

  const handleRedo = useCallback(() => {
    const manager = getManager();
    if (!manager) return;
    manager.redo();
  }, [getManager]);

  const handleFitToScreen = useCallback(() => {
    const manager = getManager();
    if (!manager) return;
    manager.setZoom(0.5);
  }, [getManager]);

  return (
    <div className="p-4 border-b border-zinc-200 bg-white">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Действия
      </h3>

      {/* Масштаб */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-zinc-600">Масштаб:</span>
          <span className="text-xs font-medium text-zinc-800 ml-auto">
            {Math.round(state.zoom * 100)}%
          </span>
        </div>
        <div className="flex gap-1">
          <button
            className="flex-1 text-xs px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
            onClick={handleZoomOut}
            title="Уменьшить"
          >
            −
          </button>
          <button
            className="flex-1 text-xs px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
            onClick={handleZoomReset}
            title="100%"
          >
            1:1
          </button>
          <button
            className="flex-1 text-xs px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
            onClick={handleZoomIn}
            title="Увеличить"
          >
            +
          </button>
          <button
            className="flex-1 text-xs px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
            onClick={handleFitToScreen}
            title="По экрану"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-1 mb-3">
        <button
          className="flex-1 text-sm px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
          onClick={handleUndo}
          disabled={!state.canUndo}
          title="Отменить (Ctrl+Z)"
        >
          ↩ Отмена
        </button>
        <button
          className="flex-1 text-sm px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
          onClick={handleRedo}
          disabled={!state.canRedo}
          title="Повторить (Ctrl+Shift+Z)"
        >
          ↪ Повтор
        </button>
      </div>

      {/* Сохранение / Экспорт */}
      <div className="flex gap-1">
        {onSave && (
          <button
            className="flex-1 text-sm px-3 py-1.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
            onClick={onSave}
          >
            💾 Сохранить
          </button>
        )}
        {onExport && (
          <button
            className="flex-1 text-sm px-3 py-1.5 rounded bg-zinc-700 text-white hover:bg-zinc-800 transition-colors"
            onClick={onExport}
          >
            📷 PNG
          </button>
        )}
      </div>
    </div>
  );
}
