"use client";

import React, { useEffect, type RefObject } from "react";
import { useCanvasManager } from "../hooks/useCanvasManager";
import { useEditorContext } from "../store/EditorContext";
import type { CanvasManager } from "../canvas/CanvasManager";
import type { FormatKey } from "../canvas/canvasConfig";

interface EditorCanvasProps {
  format: FormatKey;
  bleedMM?: number;
  /** Внешний canvasRef — если CanvasManager создан в родителе */
  externalCanvasRef?: RefObject<HTMLCanvasElement | null>;
  /** Внешний getManager — если CanvasManager создан в родителе */
  externalGetManager?: () => CanvasManager | null;
}

/**
 * EditorCanvas — компонент-обёртка для Fabric.js канвы.
 * Если передан externalCanvasRef и externalGetManager — использует их,
 * иначе создаёт свои (автономный режим).
 */
export function EditorCanvas({
  format,
  bleedMM = 3,
  externalCanvasRef,
  externalGetManager,
}: EditorCanvasProps) {
  const { canvasRef: internalCanvasRef, setZoom } = useCanvasManager(format, bleedMM);
  const { state } = useEditorContext();

  // Используем внешний или внутренний ref
  const canvasRef = externalCanvasRef ?? internalCanvasRef;

  // Fit-to-screen при загрузке
  useEffect(() => {
    if (state.isLoaded) {
      setZoom(0.5);
    }
  }, [state.isLoaded, setZoom]);

  return (
    <div className="relative flex-1 flex items-center justify-center bg-gray-100 overflow-hidden">
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-50">
          <span className="text-sm text-gray-500">Загрузка...</span>
        </div>
      )}

      {state.error && (
        <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50">
          {state.error}
          <button
            className="ml-2 underline"
            onClick={() => window.location.reload()}
          >
            Перезагрузить
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef as RefObject<HTMLCanvasElement | null>}
        className="shadow-xl"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
    </div>
  );
}
