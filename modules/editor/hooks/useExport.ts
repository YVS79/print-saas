"use client";

import { useCallback, useState } from "react";
import type { CanvasManager } from "../canvas/CanvasManager";
import { useEditorContext } from "../store/EditorContext";

interface UseExportReturn {
  saveDesign: (manager: CanvasManager, designId: string) => Promise<boolean>;
  exportToPNG: (manager: CanvasManager, multiplier?: number) => string;
  loadDesign: (manager: CanvasManager, designId: string) => Promise<boolean>;
  isSaving: boolean;
  isLoading: boolean;
}

/**
 * Хук для сохранения/загрузки дизайнов через API.
 */
export function useExport(): UseExportReturn {
  const { dispatch } = useEditorContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveDesign = useCallback(
    async (manager: CanvasManager, designId: string): Promise<boolean> => {
      setIsSaving(true);
      try {
        const objects = manager.exportService.toDesignJSON();
        const res = await fetch(`/api/designs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designId, objects }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to save design");
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        dispatch({ type: "SET_ERROR", payload: message });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch],
  );

  const exportToPNG = useCallback(
    (manager: CanvasManager, multiplier: number = 3.125): string => {
      return manager.exportService.toDataURL(multiplier);
    },
    [],
  );

  const loadDesign = useCallback(
    async (manager: CanvasManager, designId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/designs?design_id=${designId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load design");
        }
        const json = await res.json();
        const objects = json.data?.objects ?? json.objects ?? [];
        if (objects.length > 0) {
          manager.exportService.fromDesignJSON(objects);
        }
        dispatch({
          type: "SET_LOADED",
          payload: {
            format: json.data?.format ?? "A4",
            widthMM: Number(json.data?.width_mm ?? 0),
            heightMM: Number(json.data?.height_mm ?? 0),
            bleedMM: Number(json.data?.bleed_mm ?? 3),
          },
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        dispatch({ type: "SET_ERROR", payload: message });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch],
  );

  return { saveDesign, exportToPNG, loadDesign, isSaving, isLoading };
}
