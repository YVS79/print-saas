"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { CanvasManager } from "../canvas/CanvasManager";
import type { FormatKey } from "../canvas/canvasConfig";
import { useEditorContext } from "../store/EditorContext";

/**
 * Хук для управления CanvasManager в React-компоненте.
 *
 * Использует callback-ref для корректной работы с dynamic() импортом:
 * - Когда dynamic-компонент монтирует <canvas>, ref callback вызывается
 *   и запускает инициализацию CanvasManager.
 * - Инициализируется только один раз.
 * - Уничтожает CanvasManager при размонтировании.
 */
export function useCanvasManager(format: FormatKey, bleedMM: number) {
  const [canvasNode, setCanvasNode] = useState<HTMLCanvasElement | null>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const initStartedRef = useRef(false);
  const { dispatch } = useEditorContext();

  // Callback ref — вызывается React'ом, когда <canvas> появляется/исчезает из DOM
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    setCanvasNode(node);
  }, []);

  // Инициализация CanvasManager при появлении canvas в DOM
  useEffect(() => {
    if (!canvasNode) return;
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const canvasEl = canvasNode;

    // Уничтожаем предыдущий менеджер, если есть
    if (managerRef.current) {
      managerRef.current.destroy();
    }

    const manager = new CanvasManager(format, bleedMM);
    managerRef.current = manager;

    // CanvasCore.init() сам делает двойной rAF для fitToContainer.
    // Здесь запускаем без дополнительной обёртки.
    const initCanvas = async () => {
      try {
        await manager.init(canvasEl);
      } catch (err) {
        console.error("CanvasManager init failed:", err);
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Failed to init canvas",
        });
      }
    };

    initCanvas();

    // Подписка на изменение зума
    manager.eventBus.on("zoomChanged", ({ zoom }) => {
      dispatch({ type: "SET_ZOOM", payload: zoom });
    });

    // Подписка на историю
    manager.eventBus.on("historyChanged", ({ canUndo, canRedo }) => {
      dispatch({ type: "SET_HISTORY", payload: { canUndo, canRedo } });
    });

    // Устанавливаем размеры по умолчанию (A4)
    const defaultWidthMM = 210;
    const defaultHeightMM = 297;

    dispatch({
      type: "SET_LOADED",
      payload: {
        format,
        widthMM: defaultWidthMM,
        heightMM: defaultHeightMM,
        bleedMM,
      },
    });

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
      initStartedRef.current = false;
    };
  }, [canvasNode, format, bleedMM, dispatch]);

  const setZoom = useCallback((zoom: number) => {
    console.log("Вызван setZoom с зумом:", zoom);
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
