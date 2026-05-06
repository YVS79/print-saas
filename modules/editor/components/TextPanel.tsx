"use client";

import React, { useState, useCallback } from "react";
import { useEditorContext } from "../store/EditorContext";
import type { CanvasManager } from "../canvas/CanvasManager";
import { AddImageCommand } from "../canvas/commands/add-image-command";
import { UpdateTextCommand } from "../canvas/commands/update-text-command";

interface TextPanelProps {
  getManager: () => CanvasManager | null;
}

/**
 * TextPanel — панель добавления и редактирования текста.
 */
export function TextPanel({ getManager }: TextPanelProps) {
  const { state, dispatch } = useEditorContext();
  const [textContent, setTextContent] = useState("Новый текст");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [color, setColor] = useState("#000000");

  const selected = state.selectedObjects[0];
  const isTextSelected = selected?.type === "text";

  const handleAddText = useCallback(async () => {
    const manager = getManager();
    if (!manager) return;

    // Временно используем addText напрямую через ObjectService
    // TODO: создать AddTextCommand
    manager.objectService.addText(textContent, {
      xMM: 30,
      yMM: 30,
      widthMM: 150,
      fontSizePt: fontSize,
      fontFamily,
      color,
      align: "left",
    });
  }, [getManager, textContent, fontSize, fontFamily, color]);

  const handleUpdateText = useCallback(async () => {
    if (!isTextSelected || !selected) return;
    const manager = getManager();
    if (!manager) return;

    const cmd = new UpdateTextCommand(selected.id, {
      text: textContent,
      fontSizePt: fontSize,
      fontFamily,
      color,
      align: "left",
    });

    await manager.executeCommand(cmd);
  }, [getManager, isTextSelected, selected, textContent, fontSize, fontFamily, color]);

  // Заполняем поля при выборе текстового объекта
  React.useEffect(() => {
    if (isTextSelected && selected) {
      setTextContent(selected.text ?? "");
      setFontSize(selected.fontSizePt ?? 24);
      setFontFamily(selected.fontFamily ?? "Arial");
      setColor(selected.color ?? "#000000");
    }
  }, [isTextSelected, selected]);

  return (
    <div className="p-4 border-b border-zinc-200 bg-white">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Текст
      </h3>

      {/* Текст */}
      <label className="block text-xs text-zinc-600 mb-1">Текст</label>
      <input
        className="w-full text-sm border border-zinc-300 rounded px-2 py-1 mb-2"
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
      />

      {/* Размер шрифта */}
      <label className="block text-xs text-zinc-600 mb-1">Размер (pt)</label>
      <input
        type="number"
        className="w-full text-sm border border-zinc-300 rounded px-2 py-1 mb-2"
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
        min={8}
        max={200}
      />

      {/* Шрифт */}
      <label className="block text-xs text-zinc-600 mb-1">Шрифт</label>
      <select
        className="w-full text-sm border border-zinc-300 rounded px-2 py-1 mb-2"
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
      >
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
      </select>

      {/* Цвет */}
      <label className="block text-xs text-zinc-600 mb-1">Цвет</label>
      <div className="flex gap-2 mb-3">
        <input
          type="color"
          className="w-10 h-8 border border-zinc-300 rounded cursor-pointer"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <span className="text-xs text-zinc-500 self-center">{color}</span>
      </div>

      {/* Кнопки */}
      <div className="flex gap-2">
        <button
          className="flex-1 text-sm px-3 py-1.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          onClick={handleAddText}
        >
          + Добавить
        </button>

        {isTextSelected && (
          <button
            className="flex-1 text-sm px-3 py-1.5 rounded bg-zinc-700 text-white hover:bg-zinc-800 transition-colors"
            onClick={handleUpdateText}
          >
            Применить
          </button>
        )}
      </div>
    </div>
  );
}
