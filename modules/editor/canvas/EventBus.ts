/**
 * EventBus — внутренняя шина событий для CanvasManager.
 * Позволяет сервисам общаться через слабую связь (pub/sub).
 */
export type EventHandler<T = unknown> = (payload: T) => void;

type EventMap = {
  objectAdded: { objectId: string };
  objectRemoved: { objectId: string };
  objectModified: { objectId: string };
  selectionChanged: { objectIds: string[] };
  zoomChanged: { zoom: number };
  canvasSizeChanged: { width: number; height: number };
  designLoaded: { isEmpty: boolean };
  historyChanged: { canUndo: boolean; canRedo: boolean };
  [key: string]: unknown;
};

export class EventBus {
  private listeners = new Map<keyof EventMap, Set<EventHandler>>();

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${String(event)}":`, error);
      }
    });
  }

  /** Удаляет все подписки (для cleanup). */
  clear(): void {
    this.listeners.clear();
  }
}
