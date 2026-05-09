"use client";

import React, { useEffect, useState, useRef, type RefObject } from "react";
import { useCanvasManager } from "../hooks/useCanvasManager";
import { useEditorContext } from "../store/EditorContext";
import type { CanvasManager } from "../canvas/CanvasManager";
import type { FormatKey } from "../canvas/canvasConfig";

interface EditorCanvasProps {
  format: FormatKey;
  bleedMM?: number;
  externalCanvasRef?: RefObject<HTMLCanvasElement | null>;
  externalGetManager?: () => CanvasManager | null;
}

function EditorCanvas({
  format,
  bleedMM = 3,
  externalCanvasRef,
  externalGetManager,
}: EditorCanvasProps) {
  const { canvasRef: internalCanvasRef, setZoom } = useCanvasManager(format, bleedMM);
  const { state } = useEditorContext();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);

  // Логика автоматического зума — запускается безусловно при монтировании контейнера
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateZoom = () => {
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      if (containerW <= 0 || containerH <= 0) return;

      // Если canvas ещё не инициализирован Fabric.js — пропускаем
      if (!canvas.width || !canvas.height) return;

      // Вычисляем внутренний размер холста в пикселях (300 DPI)
      const canvasPixelW = ((state.widthMM + state.bleedMM * 2) * 300) / 25.4;
      const canvasPixelH = ((state.heightMM + state.bleedMM * 2) * 300) / 25.4;

      // Защита от деления на ноль
      if (canvasPixelW <= 0 || canvasPixelH <= 0) return;

      const scaleX = containerW / canvasPixelW;
      const scaleY = containerH / canvasPixelH;
      const zoom = Math.min(scaleX, scaleY);

      setZoom(zoom);
    };

    // Безусловный запуск зума при монтировании
    updateZoom();

    // Следим за изменением размера контейнера
    const observer = new ResizeObserver(() => {
      updateZoom();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [state.format, state.widthMM, state.heightMM, state.bleedMM, setZoom, canvasRef]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex items-center justify-center bg-gray-100 overflow-hidden"
    >
      <canvas
        ref={canvasRef as RefObject<HTMLCanvasElement | null>}
        className="shadow-xl"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    </div>
  );
}

export default EditorCanvas;
