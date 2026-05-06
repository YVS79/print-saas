"use client";

import React, { createContext, useContext, useReducer, useMemo, type ReactNode } from "react";
import { editorReducer } from "./editorReducer";
import { EditorState, initialEditorState, EditorAction } from "./types";

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditorContext must be used within <EditorProvider>");
  }
  return ctx;
}
