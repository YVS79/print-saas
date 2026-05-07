"use client";

import React, { useRef, useCallback, useState } from "react";
import { useEditorContext } from "../store/EditorContext";
import type { CanvasManager } from "../canvas/CanvasManager";
import { AddImageCommand } from "../canvas/commands/add-image-command";

interface PhotoPanelProps {
  getManager: () => CanvasManager | null;
}

/**
 * PhotoPanel — панель загрузки фотографий.
 * Позволяет выбрать файл и добавить на холст через FileReader.
 */
export function PhotoPanel({ getManager }: PhotoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useEditorContext();
  const [isReading, setIsReading] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const manager = getManager();
      if (!manager) return;

      setIsReading(true);
      dispatch({ type: "SET_LOADING", payload: true });

      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;

          // Добавляем фото на холст через команду
          const cmd = new AddImageCommand({
            url: dataUrl,
          });

          await manager.executeCommand(cmd);
        } catch (err) {
          dispatch({
            type: "SET_ERROR",
            payload: err instanceof Error ? err.message : "Ошибка загрузки",
          });
        } finally {
          setIsReading(false);
          dispatch({ type: "SET_LOADING", payload: false });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        dispatch({ type: "SET_ERROR", payload: "Ошибка чтения файла" });
        setIsReading(false);
        dispatch({ type: "SET_LOADING", payload: false });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      reader.readAsDataURL(file);
    },
    [getManager, dispatch],
  );

  return (
    <div className="p-4 border-b border-zinc-200 bg-white">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
        Фотографии
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        className="w-full text-sm px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        disabled={isReading}
      >
        {isReading ? "Загрузка..." : "Загрузить фото"}
      </button>
    </div>
  );
}
