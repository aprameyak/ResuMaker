export interface ModelRequest {
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
}

export interface ModelClient {
  complete(req: ModelRequest): Promise<string>
}

type Scripted = string | Error | ((req: ModelRequest, callIndex: number) => string | Promise<string>)

/**
 * Test double. Returns queued responses in order and records every request.
 * When the queue runs dry it repeats `fallback` (if given) or throws.
 */
export class ScriptedModel implements ModelClient {
  readonly requests: ModelRequest[] = []
  private queue: Scripted[]
  private fallback?: Scripted

  constructor(responses: Scripted[] = [], fallback?: Scripted) {
    this.queue = responses.slice()
    this.fallback = fallback
  }

  get calls(): number {
    return this.requests.length
  }

  enqueue(...responses: Scripted[]): this {
    this.queue.push(...responses)
    return this
  }

  /** Every string the model was sent, system prompt included. */
  sentText(index?: number): string {
    const reqs = index === undefined ? this.requests : [this.requests[index]]
    return reqs
      .filter(Boolean)
      .map(r => r.system + '\n' + r.messages.map(m => m.content).join('\n'))
      .join('\n----\n')
  }

  async complete(req: ModelRequest): Promise<string> {
    const index = this.requests.length
    this.requests.push({
      system: req.system,
      messages: req.messages.map(m => ({ role: m.role, content: m.content })),
      maxTokens: req.maxTokens,
      temperature: req.temperature,
      signal: req.signal,
    })
    const next = this.queue.length ? this.queue.shift() : this.fallback
    if (next === undefined) throw new Error('ScriptedModel: no more responses queued')
    if (next instanceof Error) throw next
    if (typeof next === 'function') return next(req, index)
    return next
  }
}
