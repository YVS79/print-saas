"use client";

import { useCallback } from "react";
import type { Format } from "@/lib/types/domain";
import { useEditorContext } from "../store/EditorContext";

// Тип, возвращаемый API /api/templates
interface TemplateRecord {
  id: string;
  shop_id: string;
  name: string;
  format: Format;
  width_mm: string;
  height_mm: string;
  bleed_mm: string;
  base_design_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseTemplateReturn {
  fetchTemplates: (format?: Format) => Promise<TemplateRecord[]>;
  isLoading: boolean;
}

/**
 * Хук для загрузки списка шаблонов с API.
 */
export function useTemplate(): UseTemplateReturn {
  const { state, dispatch } = useEditorContext();

  const fetchTemplates = useCallback(
    async (format?: Format): Promise<TemplateRecord[]> => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const params = format ? `?format=${format}` : "";
        const res = await fetch(`/api/templates${params}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to fetch templates");
        }
        const json = await res.json();
        const templates: TemplateRecord[] = json.data;
        return templates;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        dispatch({ type: "SET_ERROR", payload: message });
        return [];
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [dispatch],
  );

  return {
    fetchTemplates,
    isLoading: state.isLoading,
  };
}
