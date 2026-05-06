import { EditorState, initialEditorState, EditorAction } from "./types";

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_LOADED":
      return {
        ...state,
        isLoaded: true,
        format: action.payload.format,
        widthMM: action.payload.widthMM,
        heightMM: action.payload.heightMM,
        bleedMM: action.payload.bleedMM,
        isLoading: false,
        error: null,
      };

    case "SET_ZOOM":
      return { ...state, zoom: action.payload };

    case "SET_SELECTED_OBJECTS":
      return { ...state, selectedObjects: action.payload };

    case "SET_OBJECTS":
      return { ...state, objects: action.payload };

    case "SET_HISTORY":
      return {
        ...state,
        canUndo: action.payload.canUndo,
        canRedo: action.payload.canRedo,
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "RESET":
      return initialEditorState;

    default:
      return state;
  }
}
