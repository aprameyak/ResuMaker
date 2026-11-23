import { parseResume } from '../parse'

export interface ScopeResult {
  inScope: boolean
  reason: string
  refusal?: string
}

export const REFUSAL =
  "I can only help with your resume: rewrite or tighten bullets, fix problems, add real numbers, tailor to a job posting, or check your criteria. Try \"make this stronger\"."

const deny = (reason: string): ScopeResult => ({ inScope: false, reason, refusal: REFUSAL })
const allow = (reason: string): ScopeResult => ({ inScope: true, reason })

// Attempts to change the assistant's role or extract its instructions.
const JAILBREAK: RegExp[] = [
  /\b(ignore|disregard|forget|override|bypass|skip)\b.{0,30}\b(previous|prior|above|earlier|all|your|any|the|these|those)\b.{0,25}\b(instructions?|rules?|prompts?|guidelines?|constraints?|restrictions?|directives?)\b/,
  /\b(system|developer|hidden|initial|original) (prompt|message|instructions?)\b/,
  /\byour (instructions?|prompt|rules|guidelines|programming|directives)\b/,
  /\b(reveal|show|print|repeat|leak|display|dump|output|tell me)\b.{0,25}\b(prompt|instructions?|rules|secret|configuration)\b/,
  /\b(pretend|imagine|act|behave|roleplay|role-play|respond|speak|talk)\b.{0,12}\b(to be|you are|you're|as if|as an?|as the|like an?|like a)\b/,
  /\b(role[- ]?play|role play|pretend|jailbreak|dan mode|developer mode|god mode|do anything now)\b/,
  /\byou are (now|no longer)\b|\bfrom now on\b|\bnew (persona|role|identity)\b/,
  /\bact as\b|\bplay the (role|part)\b|\bstay in character\b/,
  /\bwhat were you (told|instructed|programmed)\b/,
  /\bbegin your (reply|response|answer) with\b/,
]

// Off-task payloads. Checked before anything else, so they cannot hide behind a resume word.
const OFF_TASK: RegExp[] = [
  /\b(poem|poems|poetry|haiku|limerick|sonnet|rhyme|rap|lyrics?|song|sing|story|stories|fable|joke|jokes|riddle|pun|puns|screenplay|monologue|speech|toast)\b/,
  /\b(quantum|physics|chemistry|biology|astronomy|calculus|algebra|geometry|trigonometry|relativity|philosophy|theology|history of|world war|french revolution)\b/,
  /\b(recipe|cook|bake|weather|forecast|horoscope|astrology|trivia|capital of|population of|president of|prime minister|stock price|bitcoin|crypto price|sports? score|lottery|movie|tv show|netflix|restaurant|vacation|travel itinerary|workout|diet)\b/,
  /\b(homework|assignment answers?|exam answers?|quiz|solve|integral|derivative|equation|prove that|math problem)\b/,
  /\d+\s*[+*/^=x×÷]\s*\d+|\bwhat is \d|\bsquare root\b/,
  /\b(write|create|build|generate|debug|code|implement|compile|refactor)\b.{0,40}\b(code|script|function|program|app|application|website|web ?site|bot|regex|query|algorithm|class|component|snippet|sql query|python script|game)\b/,
  /\b(cover letter|thank[- ]you (note|letter|email)|resignation letter|recommendation letter|reference letter|personal statement|statement of purpose|motivation letter|follow[- ]up email|cold email|linkedin (post|message|dm)|tweet|blog( post)?|article|essay|thesis|dissertation|business plan|press release|newsletter|slogan|caption|speech)\b/,
  /\b(write|draft|compose|send|reply to)\b.{0,25}\b(e-?mail|message|text|dm|note|letter|post)\b/,
  /\b(translate|explain|teach|tell|describe)\b.{0,40}\b(to me )?(how|why|what)\b.{0,40}\b(works?|is|are|happens?|do|does)\b(?!.{0,40}\b(resume|cv|bullet|criteria|warning|flag|problem|issue|score|section|ats)\b)/,
  /\b(who|what|when|where) (is|was|were|are|invented|discovered|founded)\b(?!.{0,60}\b(wrong|my|this|resume|cv|bullets?|problems?|warnings?|issues?|section|score|weak|weakest|strongest|missing|flagged|criteria|ats|summary|skills|keywords?)\b)/,
  /\b(how (do|does|can|to|did) (i|you|we|one)? ?(make|cook|bake|build|learn|lose|get rich|invest|fix my (car|computer|phone|code)))\b(?!.{0,30}\b(resume|cv|bullet|section)\b)/,
  /\b(meaning of life|tell me about yourself|who are you|what are you|are you (an? )?(ai|bot|human|chatgpt|gpt)|how are you|good (morning|evening)|chat with me|let'?s chat|talk to me|i'?m (bored|sad|lonely))\b/,
  /\b(use|using|based on|from|with|read) (my |the |this )?(resume|cv)\b.{0,40}\b(to|and) (explain|write|teach|tell|solve|calculate|compute|compose|generate|draw|plan|predict|diagnose|recommend|summari[sz]e the)\b(?!.{0,30}\b(tailor|bullet|section|keyword|criteria)\b)/,
  /\b(medical|legal|tax|investment|relationship|dating|mental health) advice\b/,
  /\b(horoscope|fortune|predict my future|will i get (the|a) job|salary negotiation script)\b/,
  /\b(write|create|generate|draft|build|make) (me )?(an? )(new |fake |sample |example |brand new )?(resume|cv)\b/,
  /\bgenerate (an? )?(image|picture|logo|photo|meme)\b|\bdraw\b/,
]

const COVER = /\bcover letter\b/

// Words that tie a request to the resume itself.
const ANCHOR =
  /\b(resume|resumes|r[ée]sum[ée]s?|cv|bullets?|bullet points?|role|roles|job|jobs|position|positions|employer|employers|section|sections|summary|objective|skills?|experience|education|projects?|header|heading|headings|contact( info| details)?|ats|applicant tracking|keywords?|criteria|criterion|posting|job description|jd|one[- ]page|two[- ]page|pages?|length|format|formatting|layout|font|margins?|gpa|dates?|title|titles|internship|achievements?|accomplishments?|responsibilit(y|ies)|action verbs?|verbs?|metrics|numbers|figures|percentages|passive|tense|buzzwords?|typos?|lint|warnings?|problems?|issues?|errors?|flag(s|ged)?|score|wording|phrasing|capitali[sz]ation|spelling|grammar|punctuation|tone|casing|buzzwords?|jargon|filler|fluff|cliches?|word count)\b/

const CONTACT = /\b(my|the) (name|email|phone( number)?|address|linkedin|github|website|portfolio|url|contact (info|details))\b/

const NARROW_ANCHOR =
  /\b(resume|r[ée]sum[ée]|cv|bullets?|summary|section|skills?|roles?|experience|criteria|criterion|length|format(ting)?|ats|keywords?|pages?|one[- ]page|job (posting|description)|posting|education|projects?|header|my job|this job|that job)\b/

const EDIT_VERB =
  /\b(make|fix|shorten|tighten|strengthen|improve|rewrite|rephrase|reword|polish|edit|trim|cut|condense|quantify|tailor|update|revise|clean|proofread|check|review|audit|score|add|remove|delete|replace|move|reorder|reorgani[sz]e|merge|split|expand|simplify|align|match|optimi[sz]e|rework|sharpen|enhance|boost|highlight|emphasi[sz]e|reduce|swap|rename|capitali[sz]e|format|convert|lengthen|summari[sz]e|explain|show|list|analy[sz]e|compare|validate|run|apply|write|draft|translate|spell[- ]?check|lint|shrink|fit|squeeze|rank|prioriti[sz]e|reword|rebuild|restructure|redo|upgrade|beef|punch|start|begin|use|combine|avoid|stop|keep|drop|include|mention|put|turn|change|ensure|lose|lower|raise|increase|decrease|get rid of|rid|help|can you|could you|please|i want|i need|i'd like|i would like|how (can|do|should) i|should i|what should i)\b/

// Actions that mutate content (stricter than EDIT_VERB: used when the only anchor is an employer name).
const MUTATING_VERB =
  /\b(make|fix|shorten|tighten|strengthen|improve|rewrite|rephrase|reword|polish|edit|trim|cut|condense|quantify|tailor|update|revise|clean|proofread|check|review|add|remove|delete|replace|move|expand|simplify|sharpen|enhance|boost|reduce|shrink|rework|redo|upgrade|punch)\b/

const QUESTION_FORMS: RegExp[] = [
  /^(does|do|is|are|can|should|would|will)\b.{0,40}\b(my|this|the|it)\b.{0,15}\b(resume|cv|bullets?|summary|section|skills|experience|education|roles?|jobs?)\b/,
  /^(does|do|is|are|will|would|can|could|should)\b.{0,40}\b(my|this|that|the|it|these|those|resume|cv)\b.{0,60}\b(pass|meet|satisfy|fit|ats|criteria|rules|one page|too long|too short|good|strong|weak|ok|okay|fine|ready|clear|clean|readable|parse|parseable|formatted|passive|vague|generic|keyword|missing|match|read well|work)\b/,
  /^how (long|many (pages|bullets|words|lines|years|months|roles|jobs)|strong|good|weak|well|ats[- ]friendly|readable|much)\b.{0,50}\b(my|this|the|resume|cv|bullet|summary|section|resume's)\b/,
  /^(what('s| is| are)?|which)\b.{0,30}\b(wrong|missing|weak|problems?|issues?|errors?|warnings?|flagged|keywords?|gaps?|weakest|strongest|longest|shortest|vague|lacking)\b/,
  /^(why|what does)\b.{0,50}\b(flag|warn|problem|error|issue|weak|fail|mark|highlight|underline|mean|score|red|yellow)/,
  /^(any|are there any|show me|list|what are the)\b.{0,15}\b(problems?|issues?|errors?|warnings?|typos?|mistakes?|weak (spots|bullets)|gaps?)\b/,
]

const DEICTIC_ONLY =
  /^(please |pls |can you |could you |kindly |just |now |go ahead and )*(make|fix|shorten|tighten|strengthen|improve|rewrite|rephrase|reword|polish|clean up|clean|quantify|trim|cut|condense|punch up|sharpen|simplify|expand|beef up|redo|rework|revise|edit|proofread|enhance|boost|upgrade|compress|lengthen|tailor|check|review|audit|score|add numbers to|improve)( up)?( (it|this|that|these|those|them|this one|that one|this bullet|that bullet|this line|this sentence|this paragraph|this part|this text|this section|everything|all|all of it|all of this|the selection|selection|my selection|what i selected|selected text|the selected text|the rest))?( (more|a bit|a little|much|way|so|bit|up|stronger|shorter|better|concise|concisely|punchier|professional|professionally|clearer|clear|crisper|tighter|sharper|longer|simpler|confident|confidently|impactful|readable|compelling|polished|brief|briefer|natural|human|less wordy|less robotic|not so wordy|sound( more)? (better|professional|confident|natural)|read( more)? (better|clearly|naturally)))*( (to|under|below|within|by|at most|up to|around|about|into) (a |an |the )?(\d[\d,]*|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)( ?-?(words?|characters?|chars?|lines?|line|pages?|bullets?|points?))?)?( (please|pls|thanks|thank you|now))?[.!?]*$/

const SHORT_ACTION =
  /^(fix everything|fix all|fix all (of )?(it|them|issues|problems)|fix (the )?(issues|problems|errors|typos|warnings|grammar|spelling|capitali[sz]ation)|clean (it|this|everything) up|clean up|add numbers|add metrics|quantify|quantify it|quantify this|tailor( it)?( to (the )?(job|posting|role|jd|description))?|tailor to the job|match the job( posting| description)?|check( it)?|check everything|check my criteria|run (the )?checks?|run my criteria|undo|any (problems|issues)|what'?s wrong|what is wrong|what'?s wrong with (it|this)|why is this flagged|explain (this|the|that) (warning|problem|issue|error|flag)|more (concise|impactful|specific|professional|numbers|metrics)|too (long|wordy|vague|generic|passive|weak)|sounds? (robotic|weak|vague|generic)|not strong enough|be more (specific|concise|direct))[.!?]*$/

const STYLE_REQ =
  /^(please )?(less|fewer|more|no|stop using|avoid|drop|lose|get rid of|remove|cut|kill)\b.{0,30}\b(buzzwords?|jargon|filler|passive|fluff|cliches?|adverbs?|numbers|metrics|keywords|detail|specific|verbs|first person|words)\b/
const SOUND_REQ = /^(make (it|this|that|them) )?(sound|read|look)s? (less|more|better|natural|human|professional|confident)\b.{0,25}$/
const ONE_LINER = /^(turn|make|reduce|cut|condense|squeeze|compress|fit) (this|it|that|them) (in)?to (a |an |one |two |the )?(one[- ]?liners?|one line|single line|two lines|a sentence|[a-z0-9 ]{0,15}bullets?|[a-z0-9 ]{0,10}words?)\b.{0,20}$/
const BARE_ADJ = /^(shorter|stronger|tighter|more concise|punchier|better|clearer|more specific|more impactful|less wordy|more professional|simpler|crisper|undo( that| it)?)[.!?]*$/

const RESUME_REWRITE =
  /^(shorten|tighten|trim|cut|condense|strengthen|improve|polish|fix|rewrite|quantify|tailor|improve|punch up|sharpen|clean up|review|check|rephrase|reword)\b/

function nameAliases(name: string): string[] {
  const out = new Set<string>()
  const clean = name.toLowerCase().replace(/[^a-z0-9&.+#' -]/g, ' ').replace(/\s+/g, ' ').trim()
  if (clean.length >= 3) out.add(clean)
  const suffix = /\b(corp|corporation|inc|llc|ltd|co|company|group|gmbh|plc)\.?$/
  const noSuffix = clean.replace(suffix, '').trim()
  if (noSuffix.length >= 3) out.add(noSuffix)
  const first = noSuffix.split(' ')[0]
  const generic = new Set(['the', 'university', 'college', 'institute', 'school', 'senior', 'junior', 'software', 'data', 'new', 'north', 'south', 'east', 'west', 'general', 'national', 'international', 'american', 'global', 'research', 'student', 'teaching', 'technical', 'product', 'project', 'marketing', 'customer', 'sales'])
  if (first && first.length >= 4 && !generic.has(first) && noSuffix.split(' ').length > 1) out.add(first)
  return Array.from(out)
}

function docNames(text: string): string[] {
  const names: string[] = []
  try {
    const r = parseResume(text)
    r.experience.forEach(e => { names.push(e.company); names.push(e.position) })
    r.education.forEach(e => names.push(e.institution))
    r.projects.forEach(p => names.push(p.name))
  } catch { /* parse failures just mean fewer anchors */ }
  const out: string[] = []
  names.filter(n => n && n.length >= 3 && n.length <= 80).forEach(n => nameAliases(n).forEach(a => out.push(a)))
  return out
}

function mentionsName(p: string, names: string[]): boolean {
  return names.some(n => {
    const idx = p.indexOf(n)
    if (idx < 0) return false
    const before = idx === 0 ? ' ' : p[idx - 1]
    const after = idx + n.length >= p.length ? ' ' : p[idx + n.length]
    return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)
  })
}

export function classifyScope(prompt: string, doc?: { text: string }): ScopeResult {
  try {
    const raw = typeof prompt === 'string' ? prompt : ''
    const p = raw.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
    if (!p) return deny('empty prompt')
    if (p.length > 600) return deny('prompt too long to be a resume edit command')

    for (const re of JAILBREAK) if (re.test(p)) return deny('attempts to change or extract the assistant instructions')
    for (const re of OFF_TASK) if (re.test(p)) return deny('request is not about editing the resume')
    if (COVER.test(p)) return deny('cover letters are out of scope')
    if (/\blinkedin\b/.test(p) && !/\b(resume|cv)\b/.test(p)) return deny('request is about another document')
    if (/\b(my|the|this) (essay|paper|report|thesis|article|blog|email|e-mail|letter|post|presentation|slides?|deck|proposal|assignment|homework|code|script|website|app|document)\b/.test(p) && !/\b(resume|cv|r[ée]sum[ée])\b/.test(p)) {
      return deny('request is about another document')
    }

    if (DEICTIC_ONLY.test(p.replace(/\bto (be|sound|read|look|feel) /, ''))) return allow('short command about the current target')
    if (SHORT_ACTION.test(p)) return allow('short resume command')
    if (STYLE_REQ.test(p) || SOUND_REQ.test(p) || ONE_LINER.test(p) || BARE_ADJ.test(p)) return allow('short resume command')
    if (/^(quantify|add (real )?(numbers?|metrics?|figures?|stats))( to)? (this|it|that|these|the|my)\b/.test(p)) return allow('quantify request')
    for (const re of QUESTION_FORMS) if (re.test(p) && (NARROW_ANCHOR.test(p) || /\b(it|this|that|these|my)\b/.test(p))) return allow('question about the resume')

    const hasAnchor = ANCHOR.test(p) || CONTACT.test(p)
    const names = doc && typeof doc.text === 'string' ? docNames(doc.text) : []
    const hasName = names.length > 0 && mentionsName(p, names)

    if (hasAnchor && EDIT_VERB.test(p)) {
      // bare "summary" / "objective" must be about the user's own summary
      const onlyWeak = !NARROW_ANCHOR.test(p) && !hasName
      if (onlyWeak && !/\b(my|this|the|these|those|our)\b/.test(p) && !RESUME_REWRITE.test(p)) return deny('no clear link to the resume')
      return allow('actionable request about the resume')
    }
    if (hasName && MUTATING_VERB.test(p)) return allow('actionable request about an employer, school or project in the resume')
    if (hasName && /\b(bullets?|job|role|section|work|time|experience|stint|internship|position)\b/.test(p)) return allow('mentions a role in the resume')

    return deny('not an actionable request about the resume')
  } catch {
    return deny('could not classify the request')
  }
}

/** True when resume text itself contains instruction-like content aimed at an AI (it is still treated as plain data). */
export function looksLikeInjection(text: string): boolean {
  const t = (typeof text === 'string' ? text : '').toLowerCase().replace(/\s+/g, ' ')
  return JAILBREAK.some(re => re.test(t)) || /\b(write|compose|tell) (me )?(a|an) (poem|song|story|joke)\b/.test(t) || /\bassistant\b.{0,20}\b(must|should|will)\b/.test(t)
}
