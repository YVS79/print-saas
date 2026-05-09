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

  // Логика автоматического зума
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let mounted = true;

    const updateZoom = () => {
      if (!mounted) return;

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      if (containerW <= 0 || containerH <= 0) return;

      // Если canvas ещё не инициализирован Fabric.js — пропускаем
      if (!canvas.width || !canvas.height) return;

      const scaleX = containerW / canvas.width;
      const scaleY = containerH / canvas.height;
      const zoom = Math.max(0.05, Math.min(scaleX, scaleY));

      setZoom(zoom);
    };

    // Первичный запуск зума
    updateZoom();

    // Следим за изменением размера контейнера
    const observer = new ResizeObserver(() => {
      updateZoom();
    });
    observer.observe(container);

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [setZoom, canvasRef]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex items-center justify-center bg-gray-100 overflow-hidden"
    >
      <canvas
        ref={canvasRef as RefObject<HTMLCanvasElement | null>}
        className="shadow-xl"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

export default EditorCanvas;
