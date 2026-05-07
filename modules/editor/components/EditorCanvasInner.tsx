"use client";

import React, { useEffect, useState, type RefObject } from "react";
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
function EditorCanvas({
  format,
  bleedMM = 3,
  externalCanvasRef,
  externalGetManager,
}: EditorCanvasProps) {
  const { canvasRef: internalCanvasRef, setZoom } = useCanvasManager(format, bleedMM);
  const { state } = useEditorContext();

  // Флаг гидратации – предотвращает ошибку React hydration mismatch
  // (на сервере state.error === null, на клиенте может стать не-null)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

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
      <canvas
        ref={canvasRef as RefObject<HTMLCanvasElement | null>}
        className="shadow-xl"
      />
    </div>
  );
}

export default EditorCanvas;
