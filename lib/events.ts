// Lightweight client-side event bus to decouple modules

export type EventMap = {
  'ticks:new': { symbol: string; price: number; ts: number }
  'orders:changed': { type: 'insert' | 'update' | 'delete'; row: any }
  'trades:new': { row: any }
  'leaderboard:updated': {}
}

type Handler<T> = (payload: T) => void

class EventBus {
  private handlers: { [K in keyof EventMap]?: Set<Handler<EventMap[K]>> } = {}

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
    if (!this.handlers[event]) this.handlers[event] = new Set()
    this.handlers[event]!.add(handler as Handler<any>)
    return () => this.off(event, handler)
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>) {
    this.handlers[event]?.delete(handler as Handler<any>)
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    this.handlers[event]?.forEach((h) => h(payload as any))
  }
}

export const events = new EventBus()
