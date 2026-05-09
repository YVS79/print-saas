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

  // Флаг гидратации
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);

  // Стабильная ссылка на setZoom, чтобы не пересоздавать useEffect
  const setZoomRef = useRef(setZoom);
  setZoomRef.current = setZoom;

  // Логика автоматического зума
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let mounted = true;
    let rafId: number | null = null;

    const updateZoom = () => {
      if (!mounted) return;

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      if (containerW <= 0 || containerH <= 0) return;

      // Если canvas ещё не инициализирован Fabric.js — повторяем попытку
      if (!canvas.width || !canvas.height) {
        rafId = requestAnimationFrame(updateZoom);
        return;
      }

      const scaleX = containerW / canvas.width;
      const scaleY = containerH / canvas.height;
      const zoom = Math.min(scaleX, scaleY);

      setZoomRef.current(zoom);
    };

    // Первичный запуск зума с requestAnimationFrame
    rafId = requestAnimationFrame(updateZoom);

    // Следим за изменением размера контейнера
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateZoom);
    });
    observer.observe(container);

    return () => {
      mounted = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);  // Пустой массив зависимостей — эффект запускается один раз при монтировании

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
