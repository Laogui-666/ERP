export const EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:status-changed',
  ORDER_ASSIGNED: 'order:assigned',
  ORDER_CLAIMED: 'order:claimed',
  DOCUMENT_UPLOADED: 'document:uploaded',
  NOTIFICATION_NEW: 'notification:new',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

type EventHandler = (data: unknown) => void

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  on(event: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  emit(event: EventName, data: unknown): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error)
        }
      })
    }
  }
}

export const eventBus = new EventBus()
