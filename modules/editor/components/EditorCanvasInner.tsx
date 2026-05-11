"use client";

import React, { useEffect, useState, type RefObject } from "react";
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
  const { canvasRef: internalCanvasRef } = useCanvasManager(format, bleedMM);
  const { state } = useEditorContext();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const canvasRef = externalCanvasRef ?? internalCanvasRef;

  return (
    <div className="relative flex-1 flex items-center justify-center bg-gray-100 overflow-hidden">
      {/*
        Fabric сам управляет canvas-элементом (создаёт .canvas-container wrapper,
        ставит inline-стили width/height). Наша задача — только центрировать.
        Зум "вписать в контейнер" устанавливается в CanvasCore.init().
      */}
      <canvas
        ref={canvasRef as RefObject<HTMLCanvasElement | null>}
        className="shadow-xl"
      />
    </div>
  );
}

export default EditorCanvas;
