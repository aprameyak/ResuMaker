// Safe wrapper over localStorage. Every access is wrapped; a blocked or full store never throws.

export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const PREFIX = 'resumaker:ide:'
export const KEYS = {
  doc: PREFIX + 'doc',
  settings: PREFIX + 'settings',
  history: PREFIX + 'history',
  prompts: PREFIX + 'prompts',
} as const

export class Store {
  available: boolean
  lastError: string | null = null
  private kv: KV | null

  constructor(getter: () => KV | null | undefined) {
    let kv: KV | null = null
    try {
      kv = getter() ?? null
      if (kv) {
        const probe = PREFIX + 'probe'
        kv.setItem(probe, '1')
        kv.removeItem(probe)
      }
    } catch (e) {
      kv = null
      this.lastError = e instanceof Error ? e.message : String(e)
    }
    this.kv = kv
    this.available = kv !== null
  }

  get(key: string): string | null {
    if (!this.kv) return null
    try { return this.kv.getItem(key) } catch (e) { this.fail(e); return null }
  }

  set(key: string, value: string): boolean {
    if (!this.kv) return false
    try { this.kv.setItem(key, value); return true } catch (e) { this.fail(e); return false }
  }

  remove(key: string): void {
    if (!this.kv) return
    try { this.kv.removeItem(key) } catch (e) { this.fail(e) }
  }

  getJSON(key: string): unknown {
    const raw = this.get(key)
    if (raw === null) return undefined
    try { return JSON.parse(raw) } catch { return undefined }
  }

  setJSON(key: string, value: unknown): boolean {
    try { return this.set(key, JSON.stringify(value)) } catch (e) { this.fail(e); return false }
  }

  private fail(e: unknown) {
    this.lastError = e instanceof Error ? e.message : String(e)
  }
}

export function browserStore(): Store {
  return new Store(() => (typeof window === 'undefined' ? null : window.localStorage))
}

/** In-memory KV for tests and as a stand-in when storage is blocked. */
export function memoryKV(): KV & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: k => (data.has(k) ? data.get(k)! : null),
    setItem: (k, v) => { data.set(k, v) },
    removeItem: k => { data.delete(k) },
  }
}
