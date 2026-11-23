export type Action = 'fix' | 'rewrite' | 'strengthen' | 'shorten' | 'quantify' | 'tailor' | 'check' | 'explain' | 'summarize' | 'unknown'

export interface Intent {
  action: Action
  params: Record<string, unknown>
}

const WORD_NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20 }

function toNum(s: string): number | undefined {
  const n = Number(s.replace(/,/g, ''))
  if (isFinite(n)) return n
  return WORD_NUM[s.toLowerCase()]
}

const NUM = '(\\d[\\d,]*|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)'

export function parseIntent(prompt: string): Intent {
  const raw = typeof prompt === 'string' ? prompt : ''
  const p = raw.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim()
  const params: Record<string, unknown> = {}
  if (!p) return { action: 'unknown', params }

  // parameters
  let m = p.match(new RegExp(`\\b${NUM}\\s*-?\\s*(?:words?)\\b`))
  if (m && toNum(m[1]) !== undefined && /\b(under|below|within|to|max|at most|up to|less than|fewer than|no more than|around|about)\b/.test(p)) params.maxWords = toNum(m[1])
  m = p.match(new RegExp(`\\b${NUM}\\s*-?\\s*(?:characters?|chars?)\\b`))
  if (m && toNum(m[1]) !== undefined) params.maxChars = toNum(m[1])
  m = p.match(new RegExp(`\\b${NUM}\\s*-?\\s*lines?\\b`))
  if (m && toNum(m[1]) !== undefined) params.lines = toNum(m[1])
  if (/\bone[- ]page\b|\b(1|one) page\b|\bfit (it |this |everything )?(on|onto|in|to) (a |one |1 )?(single )?page\b|\bsingle page\b/.test(p)) params.pages = 1
  else if (/\btwo[- ]page\b|\b(2|two) pages?\b/.test(p)) params.pages = 2
  m = p.match(new RegExp(`\\b${NUM}\\s+(?:bullets?|points?|items?)\\b`))
  if (m && toNum(m[1]) !== undefined) params.count = toNum(m[1])
  if (/\b(everything|all of it|whole|entire|every bullet|all (my )?bullets|all problems|all issues|all of them)\b/.test(p)) params.all = true
  if (/\bone line\b|\bsingle line\b|\bone-liner\b/.test(p)) params.lines = 1

  const has = (re: RegExp) => re.test(p)

  // explain / check style questions come before editing verbs
  if (has(/^(why|what'?s? (is )?wrong|what does .* mean|explain)\b/) || has(/\bwhy (is|was|does|did|are)\b.*\b(flag|warn|problem|error|issue|weak|bad|fail|mark)/)) {
    return { action: 'explain', params }
  }
  if (has(/\b(pass|passes|passing|meet|meets|satisf|comply|complies)\b.*\b(criteria|criterion|rules|checks|ats|requirements)\b/) || has(/\b(criteria|ats|applicant tracking)\b/) && has(/\b(check|does|do|is|are|score|audit|validate|run|test|evaluate|review)\b/)) {
    return { action: 'check', params }
  }
  if (has(/\bquantif|\badd (some )?(numbers|metrics|stats|figures|percentages|data)\b|\bmeasurable\b|\bmore (numbers|metrics)\b|\bnumbers\b.*\b(add|missing|needs?)\b/)) {
    return { action: 'quantify', params }
  }
  if (has(/\btailor|\bmatch (it |my resume |this )?(to|with) (the |this )?(job|posting|role|jd|description)|\b(job posting|job description|jd)\b|\bkeywords?\b|\btarget(ed|ing)? (this|the) (job|role)\b/)) {
    return { action: 'tailor', params }
  }
  if (has(/\b(shorten|shorter|trim|cut|condense|tighten|compress|concise|brief|reduce|fewer words|less wordy|too long|one page|single page|fit on|shrink|abbreviate|crisper)\b/) || params.pages === 1 && !has(/\bcheck|does\b/)) {
    return { action: 'shorten', params }
  }
  if (has(/\b(summari[sz]e|summary|objective|elevator pitch|profile blurb)\b/)) {
    return { action: 'summarize', params }
  }
  if (has(/\b(fix|clean ?up|correct|proofread|typos?|grammar|spelling|spell[- ]?check|lint|repair|errors?)\b/) || params.all && has(/\bfix\b/)) {
    return { action: 'fix', params }
  }
  if (has(/\b(stronger|strengthen|strong|punch(y|ier)?|impact(ful)?|improve|better|polish|sharpen|sharper|enhance|boost|compelling|powerful|upgrade|level up|elevate|impressive|more confident|professional)\b/)) {
    return { action: 'strengthen', params }
  }
  if (has(/\b(rewrite|rephrase|reword|redo|rework|revise|edit|change|reshape|restructure|rewrite|simplify|update|refresh|expand|lengthen|flesh)\b|\bmake .* (sound|read)\b/)) {
    return { action: 'rewrite', params }
  }
  if (has(/\b(check|review|audit|validate|score|evaluate|analy[sz]e|lint|ats)\b|^(does|is|are|do)\b|\bany (problems|issues)\b|\bhow (long|many|good|strong)\b/)) {
    return { action: 'check', params }
  }
  return { action: 'unknown', params }
}
