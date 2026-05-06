"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useEditorContext } from "../store/EditorContext";
import type { CanvasManager } from "../canvas/CanvasManager";
import { UpdateTextCommand } from "../canvas/commands/update-text-command";
import { DeleteObjectCommand } from "../canvas/commands/delete-object-command";

interface ObjectPropertiesProps {
  getManager: () => CanvasManager | null;
}

/**
 * ObjectProperties — панель свойств выделенного объекта.
 * Позволяет изменять позицию, размер, поворот и прозрачность.
 */
export function ObjectProperties({ getManager }: ObjectPropertiesProps) {
  const { state, dispatch } = useEditorContext();
  const selected = state.selectedObjects[0];

  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(100);

  // Заполняем поля при выборе объекта
  useEffect(() => {
    if (selected) {
      setXPos(Math.round(selected.xMM * 10) / 10);
      setYPos(Math.round(selected.yMM * 10) / 10);
      setWidth(Math.round(selected.widthMM * 10) / 10);
      setHeight(Math.round(selected.heightMM * 10) / 10);
      setRotation(Math.round(selected.rotationDeg));
      setOpacity(Math.round(selected.opacity * 100));
    }
  }, [selected]);

  const applyChanges = useCallback(() => {
    if (!selected) return;
    const manager = getManager();
    if (!manager) return;

    const props: Record<string, unknown> = {};
    if (xPos !== selected.xMM) props.xMM = xPos;
    if (yPos !== selected.yMM) props.yMM = yPos;
    if (width !== selected.widthMM) props.widthMM = width;
    if (height !== selected.heightMM) props.heightMM = height;
    if (rotation !== selected.rotationDeg) props.rotationDeg = rotation;
    if (opacity / 100 !== selected.opacity) props.opacity = opacity / 100;

    if (Object.keys(props).length === 0) return;

    if (selected.type === "text") {
      const cmd = new UpdateTextCommand(selected.id, props);
      manager.executeCommand(cmd);
    } else {
      // Для image/shape — обновляем напрямую
      manager.objectService.update(selected.id, props);
    }
  }, [selected, getManager, xPos, yPos, width, height, rotation, opacity]);

  const handleDelete = useCallback(() => {
    if (!selected) return;
    const manager = getManager();
    if (!manager) return;

    const cmd = new DeleteObjectCommand(selected.id);
    manager.executeCommand(cmd);
  }, [selected, getManager]);

  if (!selected) {
    return (
      <div className="p-4 border-b border-zinc-200 bg-white">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Свойства
        </h3>
        <p className="text-xs text-zinc-400 text-center py-4">
          Выберите объект на холсте
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-zinc-200 bg-white">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Свойства
      </h3>

      <div className="text-xs text-zinc-500 mb-2">
        {selected.type === "image" ? "Изображение" : selected.type === "text" ? "Текст" : "Фигура"}
        {selected.assetId && (
          <span className="ml-1 text-zinc-400">(ID: {selected.assetId.slice(0, 8)}...)</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* X */}
        <div>
          <label className="block text-xs text-zinc-600">X (мм)</label>
          <input
            type="number"
            className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            value={xPos}
            onChange={(e) => setXPos(Number(e.target.value))}
            step={0.1}
          />
        </div>

        {/* Y */}
        <div>
          <label className="block text-xs text-zinc-600">Y (мм)</label>
          <input
            type="number"
            className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            value={yPos}
            onChange={(e) => setYPos(Number(e.target.value))}
            step={0.1}
          />
        </div>

        {/* Ширина */}
        <div>
          <label className="block text-xs text-zinc-600">Ширина (мм)</label>
          <input
            type="number"
            className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            step={0.1}
            min={1}
          />
        </div>

        {/* Высота */}
        <div>
          <label className="block text-xs text-zinc-600">Высота (мм)</label>
          <input
            type="number"
            className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            step={0.1}
            min={1}
          />
        </div>

        {/* Поворот */}
        <div>
          <label className="block text-xs text-zinc-600">Поворот (°)</label>
          <input
            type="number"
            className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            step={1}
          />
        </div>

        {/* Прозрачность */}
        <div>
          <label className="block text-xs text-zinc-600">Непрозрачность (%)</label>
          <input
            type="number"
            className="w-full text-sm border border-zinc-300 rounded px-2 py-1"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            min={0}
            max={100}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          className="flex-1 text-sm px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          onClick={applyChanges}
        >
          Применить
        </button>
        <button
          className="text-sm px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
          onClick={handleDelete}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
