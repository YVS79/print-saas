"use client";

import React, { useRef, useCallback } from "react";
import { useUpload } from "../hooks/useUpload";
import { useEditorContext } from "../store/EditorContext";
import type { CanvasManager } from "../canvas/CanvasManager";
import { AddImageCommand } from "../canvas/commands/add-image-command";

interface PhotoPanelProps {
  getManager: () => CanvasManager | null;
}

/**
 * PhotoPanel — панель загрузки фотографий.
 * Позволяет выбрать файл, загрузить в S3 и добавить на холст.
 */
export function PhotoPanel({ getManager }: PhotoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload();
  const { dispatch } = useEditorContext();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const manager = getManager();
      if (!manager) return;

      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Загружаем файл в S3
        const result = await uploadFile(file);
        if (!result) throw new Error("Не удалось загрузить файл");

        // Добавляем изображение на холст через команду
        const cmd = new AddImageCommand({
          url: result.previewUrl,
          xMM: 10,
          yMM: 10,
          widthMM: 100,
          heightMM: 100,
          assetId: result.assetId,
        });

        await manager.executeCommand(cmd);
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Ошибка загрузки",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
        // Сбрасываем input чтобы можно было выбрать тот же файл
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [getManager, uploadFile, dispatch],
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
        disabled={isUploading}
      >
        {isUploading ? `Загрузка... ${progress}%` : "Загрузить фото"}
      </button>

      {isUploading && (
        <div className="mt-2 w-full bg-zinc-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
