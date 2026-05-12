"use client";

import React, { useEffect, useState, type RefCallback, useCallback } from "react";
import { useCanvasManager } from "../hooks/useCanvasManager";
import type { CanvasManager } from "../canvas/CanvasManager";
import type { FormatKey } from "../canvas/canvasConfig";

interface EditorCanvasProps {
  format: FormatKey;
  bleedMM?: number;
  externalCanvasRef?: RefCallback<HTMLCanvasElement>;
  externalGetManager?: () => CanvasManager | null;
}

function EditorCanvas({
  format,
  bleedMM = 3,
  externalCanvasRef,
  externalGetManager,
}: EditorCanvasProps) {
  // Если передан внешний менеджер — не создаём свой, чтобы избежать двойной инициализации
  const hasExternal = !!externalGetManager;
  const { canvasRef: internalCanvasRef } = hasExternal
    ? { canvasRef: undefined as any }
    : useCanvasManager(format, bleedMM);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Объединяем refs: вызываем все переданные callback refs
  const combinedRef: RefCallback<HTMLCanvasElement> = useCallback(
    (node) => {
      if (externalCanvasRef) externalCanvasRef(node);
    },
    [externalCanvasRef],
  );

  const refToUse = externalCanvasRef ? combinedRef : internalCanvasRef;

  return (
    <div
      className="relative flex-1 min-w-0 min-h-0 overflow-hidden bg-gray-100"
      style={{ marginLeft: "256px", marginRight: "256px" }}
    >
      <canvas
        ref={refToUse}
        className="shadow-xl"
      />
    </div>
  );
}

export default EditorCanvas;
