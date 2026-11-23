import type { ModelClient } from '../../lib/resume'

/**
 * Extension point for a language model.
 *
 * The assistant (lib/resume/assistant) only needs an object with `complete(req) => Promise<string>`.
 * Today no model is connected, so this returns null and the assistant runs its deterministic actions only
 * (fix, check, tailor report, quantify questions, scope refusals).
 *
 * To connect an in-browser model later, return a ModelClient here, for example one that wraps a
 * WebGPU/WASM runtime. Keep it synchronous to construct and lazy to load; the UI calls this on every request
 * and shows "no model connected" whenever it returns null.
 */
export function getModel(): ModelClient | null {
  return null
}
