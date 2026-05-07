"use client";

import { useRef, useEffect, useCallback } from "react";
import { CanvasManager } from "../canvas/CanvasManager";
import type { FormatKey } from "../canvas/canvasConfig";
import { useEditorContext } from "../store/EditorContext";

/**
 * Хук для управления CanvasManager в React-компоненте.
 * - Создаёт CanvasManager при монтировании
 * - Передаёт ref на <canvas> элемент
 * - Уничтожает при размонтировании (cleanup)
 */
export function useCanvasManager(format: FormatKey, bleedMM: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const { dispatch } = useEditorContext();
  const initCalledRef = useRef(false);

  const initCanvas = useCallback(async () => {
    console.log("useCanvasManager called, canvasRef:", canvasRef.current);
    if (!canvasRef.current) return;

    // Уничтожаем предыдущий менеджер, если есть
    if (managerRef.current) {
      managerRef.current.destroy();
    }

    const manager = new CanvasManager(format, bleedMM);
    await manager.init(canvasRef.current);
    managerRef.current = manager;

    // Подписка на изменение зума
    manager.eventBus.on("zoomChanged", ({ zoom }) => {
      dispatch({ type: "SET_ZOOM", payload: zoom });
    });

    // Подписка на историю
    manager.eventBus.on("historyChanged", ({ canUndo, canRedo }) => {
      dispatch({ type: "SET_HISTORY", payload: { canUndo, canRedo } });
    });

    dispatch({
      type: "SET_LOADED",
      payload: {
        format,
        widthMM: 0, // будет установлено при загрузке шаблона
        heightMM: 0,
        bleedMM,
      },
    });
  }, [format, bleedMM, dispatch]);

  // Инициализация при монтировании
  useEffect(() => {
    if (!canvasRef.current) return; // ждём, пока canvas появится в DOM
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    initCanvas().catch((err) => {
      console.error("CanvasManager init failed:", err);
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Failed to init canvas",
      });
    });

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
      initCalledRef.current = false;
    };
  }, [initCanvas, canvasRef.current, dispatch]);

  const setZoom = useCallback((zoom: number) => {
    managerRef.current?.setZoom(zoom);
  }, []);

  const getManager = useCallback((): CanvasManager | null => {
    return managerRef.current;
  }, []);

  return {
    canvasRef,
    managerRef,
    setZoom,
    getManager,
  };
}
