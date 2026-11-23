import { parseResume } from '../parse'

export interface ScopeResult {
  inScope: boolean
  reason: string
  refusal?: string
  /** For a multi-part request: the clauses that are not about the resume. */
  outOfScopeParts?: string[]
  /** For a multi-part request: the clauses that are resume edits (what the assistant would act on). */
  inScopeParts?: string[]
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


// ---------------------------------------------------------------- multi-part prompts

// Extra whole-prompt denials: payloads that ride behind a resume request.
const EXTRA_DENY: RegExp[] = [
  /\b(e-?mail|mail|text|message|dm)\b.{0,12}\b(it|this|that|them|these)\b.{0,10}\bto\b/,
  /\b(send|forward|submit|post|publish|share|upload|tweet)\b.{0,30}\b(to|on|via)\b\s+\w+/,
  /\b(hack|crack|exploit|malware|virus|ransomware|phish\w*|ddos|keylogger|lock ?pick|pick a lock|wi-?fi|password)\b/,
  /\b(curl|wget|sudo|chmod|rm -rf|powershell)\b|\|\s*(sh|bash)\b|;\s*(sh|bash)\b|\bbash -c\b/,
  /\b(stocks?|invest\w*|flights?|hotels?|fun facts?|cats?|dogs?|pirate|yoda|emojis?|spic(y|ier|ed)|horoscope|crypto|forex)\b/,
  /\badd (a |an |some |my )?(quote|joke|poem|meme|slogan|motto)\b/,
  /\b(respond|reply|answer|speak|talk|say|output)\b.{0,25}\b(in|into) (french|spanish|german|italian|portuguese|chinese|japanese|korean|russian|arabic|hindi|latin|all caps|uppercase|rhyme|verse|emoji)\b/,
  /\bsay hello\b|\bin \d+ languages\b/,
  /\bin the (voice|style|tone|manner) of\b/,
  /\bnew (task|instructions?|prompt|conversation|topic)\b/,
  /\b(ignor\w*|olvida\w*|oublie\w*|ignoriere\w*|vergiss\w*)\b.{0,30}\b(instruc\w*|anteriores|precedentes|pr[eé]c[eé]dentes|vorherig\w*|previous|above|prior|earlier|everything|all)\b/,
  /\bignore (the |all )?(above|everything|prior|earlier|previous)\b/,
  /\b(overrul\w*|supersede|nullify)\b/,
  /\b(what|which|tell me|show me|list) (are )?(the |your )?(rules|instructions|guidelines|model|prompt)\b.{0,25}\b(you|your)\b|\bwhat model are you\b|\bwhich model\b|\bare you (a |an )?(model|llm|bot)\b/,
  /\b(disclose|expose|leak)\b|\b(initial|original|full|entire|hidden|secret) (context|prompt|rules|instructions)\b/,
  /\b(text|everything|messages?|words?) (before|above)\b( this| the)?( message| line| prompt| point)?/,
  /\buser_facts\b|\b(print|echo|dump|output|reveal)\b.{0,20}\b(block|tag|context|prompt|verbatim)\b/,
  /\b(author|recruiter|hiring manager|manager|boss|company)('s)? e-?mail\b/,
  /\badd (a |an |another |my )?(new |fake |extra )?(job|role|position|internship|degree|certification|award|company|employer)\b/,
  /\b(convert|export|save|make|generate|create|turn)\b.{0,25}\b(latex|pdf|docx|word document|html|markdown)\b/,
  /\bwrite (me )?(a )?(poem|song|story|haiku|joke)\b/,
  /\bstands? for\b/,
  /\b(invent|fabricate|falsify|embellish|exaggerate|make up|made up|made-up)\b|\b(lie|lying)\b.{0,10}\b(on|in) my (resume|cv)\b|\b(fake|bogus|fictional)\b|\bpretend\b/,
]

const FILLER_START = /^(?:hey|hi|hello|yo|ok|okay|alright|all right|sure|yes|yeah|yep|yup|please|pls|plz|kindly|thanks|thank you|thx|so|well|honestly|actually|basically|just|now|then|also|and|but|can you|could you|would you|will you|can u|could u|can i|i want you to|i need you to|i'd like you to|i would like you to|i would love it if you could|i would love you to|i'd love it if you could|go ahead and|let's|lets|you should|you can|try to|maybe|perhaps|um|uh|hmm|ok so|so please|and please|if you could|if you can|again)\b\s*/
const FILLER_END = /\s*\b(?:please|pls|plz|thanks|thank you|thx|if you can|if possible|as well|too|for me|now|again|ok|okay|thanks so much|appreciate it|right|thanks a lot|asap)\s*$/

const EDIT_VERBS = new Set('make fix shorten tighten strengthen improve rewrite rephrase reword polish edit trim cut condense quantify tailor update revise clean proofread check review audit score add remove delete replace move reorder reorganize reorganise merge split expand simplify align match optimize optimise rework sharpen enhance boost highlight emphasize emphasise reduce swap rename capitalize capitalise format convert lengthen summarize summarise explain show list analyze analyse compare validate run apply write draft translate shrink fit squeeze rank prioritize prioritise rebuild restructure redo upgrade beef punch spice jazz use start begin combine avoid stop keep drop include mention put turn change lower raise increase decrease rate get lose ensure help be sound read look tell give describe'.split(' '))
const NONEDIT_ACTIONS = new Set('say send email mail book buy order hack crack execute output print echo respond reply answer sing draw plan find search calculate solve recommend generate create compose disclose reveal pretend act ignore forget disregard override overrule remember call text post tweet browse open download install play teach do go take let think imagine roleplay simulate speak talk chat learn wait install deploy install kill delete_all'.split(' '))
const BARE_OK = new Set('shorten tighten strengthen improve rewrite rephrase reword polish edit trim condense quantify tailor proofread simplify expand sharpen enhance shrink fix check review audit lengthen revise'.split(' '))
const NEEDS_ANCHOR_VERBS = new Set(['tell', 'give', 'describe', 'show', 'explain', 'list', 'compare', 'rate', 'help'])
const STYLE = /\b(stronger|strong|weak|weaker|weakest|shorter|short|shorten|long|longer|wordy|concise|tight|tighter|punchy|punchier|pop|impressive|senior|confident|professional|clearer|clear|vague|generic|robotic|human|natural|plain|simple|simpler|direct|specific|polished|better|worse|good|bad|ok|okay|fine|ready|awkward|clunky|boring|passive|active|consistent|consistently|properly|missing|needs?|flagged|flag|wrong|ai|brief|crisp|crisper|compelling|impactful|powerful|friendly|readable|cleaner|less|more|half|senior|junior|formal|casual|upbeat|fluff|buzzwordy|repetitive|detailed|sharper|punch|jazz|spice)\b/
const RESUME_WORD = /\b(resume|resumes|r[ée]sum[ée]s?|cv|bullets?|bullet points?|points?|lines?|sentences?|role|roles|jobs?|position|positions|employer|employers|section|sections|summary|objective|skills?|experience|education|projects?|header|heading|headings|contact|ats|keywords?|criteria|criterion|posting|description|jd|pages?|length|format|formatting|layout|font|gpa|dates?|title|titles|internship|achievements?|accomplishments?|verbs?|metrics|numbers|figures|percentages|passive|active|voice|tense|buzzwords?|typos?|lint|warnings?|problems?|issues?|errors?|flagged|score|wording|phrasing|words?|language|capitali[sz]ation|spelling|grammar|punctuation|tone|casing|jargon|filler|fluff|text|selection|selected|everything|name|email|phone|address)\b/
const NARROW_Q = /\b(resume|r[ée]sum[ée]|cv|bullets?|summary|section|skills?|roles?|criteria|criterion|length|format(ting)?|ats|keywords?|pages?|posting|education|header|gpa|dates?|numbers|metrics|flagged|line|lines|words)\b|\b(my|this|that|the) (job|jobs|role|experience|education|work)\b/
const DEICTIC = /\b(it|this|that|these|those|them|one|everything|all|selection|selected|here)\b/
const HARD_ANCHOR = /\b(resume|r[ée]sum[ée]|cv|bullets?|summary|section|skills?|roles?|jobs?|experience|education|criteria|keywords?|ats|posting|header|projects?)\b/
const QUESTION_START = /^(what|which|how|why|where|when|who|is|are|does|do|did|can|should|will|would|could|am)\b/
const TYPO_MAP: Record<string, string> = { mak: 'make', mke: 'make', amke: 'make' }
const FUZZY_VOCAB = ['shorten', 'strengthen', 'improve', 'rewrite', 'rephrase', 'tighten', 'polish', 'proofread', 'condense', 'quantify', 'simplify', 'summarize', 'stronger', 'shorter', 'concise', 'professional', 'bullets', 'resume', 'tailor', 'punchier', 'clearer', 'impressive', 'confident']

function damerau(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2
  const d: number[][] = []
  for (let i = 0; i <= a.length; i++) { d[i] = []; for (let j = 0; j <= b.length; j++) d[i][j] = i === 0 ? j : j === 0 ? i : 0 }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

function fixTypos(text: string): string {
  return text.split(' ').map(w => {
    if (TYPO_MAP[w]) return TYPO_MAP[w]
    if (w.length < 5 || FUZZY_VOCAB.indexOf(w) >= 0) return w
    let best: string | undefined
    FUZZY_VOCAB.forEach(v => { if (!best && w[0] === v[0] && damerau(w, v) <= 1) best = v })
    return best || w
  }).join(' ')
}

function stripFillers(c: string): string {
  let s = c.replace(/[,"]+/g, ' ').replace(/\s+/g, ' ').trim()
  for (let k = 0; k < 6; k++) {
    const before = s
    s = s.replace(FILLER_START, '').trim()
    s = s.replace(FILLER_END, '').trim()
    if (s === before) break
  }
  return s.replace(/[?!.]+$/g, '').trim()
}

function splitClauses(p: string): string[] {
  const parts = p.split(/\n+|[.!?;]+(?:\s+|$)/)
  const out: string[] = []
  parts.forEach(part => {
    part.split(/\s*,\s+|\s+,\s*|\s+(?:and also|and then|and after that|after that|afterwards|thereafter|then|but first|but also|also|plus|and)\s+/).forEach(x => {
      const t = x.trim()
      if (t) out.push(t)
    })
  })
  return out
}

type Verdict = 'edit' | 'neutral' | 'out'

function classifyClause(raw: string, names: string[]): Verdict {
  const colon = raw.match(/^([^:]{2,70}):\s*(.+)$/)
  let c = raw
  if (colon && colon[2].split(' ').length > 3) {
    const prefix = classifyClause(colon[1], names)
    if (prefix === 'out') return 'out'
    if (/^(please )?(quantify|add (real )?(numbers?|metrics?|figures?))/.test(colon[1])) return 'edit'
    if (!HARD_ANCHOR.test(colon[1]) && !mentionsName(colon[1], names)) return 'out'
    c = colon[1]
  }
  const s0 = stripFillers(c)
  if (!s0) return 'neutral'
  let s = fixTypos(s0)
  let tokens = s.split(' ')
  if (/^(first|second|third|next|finally)$/.test(tokens[0]) && tokens[1] && (EDIT_VERBS.has(tokens[1]) || NONEDIT_ACTIONS.has(tokens[1]) || NEEDS_ANCHOR_VERBS.has(tokens[1]))) { tokens = tokens.slice(1); s = tokens.join(' ') }
  const first = tokens[0]
  const hasResume = RESUME_WORD.test(s) || CONTACT.test(s) || mentionsName(s, names)
  const style = STYLE.test(s)
  const deictic = DEICTIC.test(s)

  if (/\blinkedin\b/.test(s) && !/\b(resume|cv)\b/.test(s)) return 'out'
  if (DEICTIC_ONLY.test(s) || SHORT_ACTION.test(s) || STYLE_REQ.test(s) || SOUND_REQ.test(s) || ONE_LINER.test(s) || BARE_ADJ.test(s)) return 'edit'
  if (/^(quantify|add (real )?(numbers?|metrics?|figures?|stats))( to)? (this|it|that|these|the|my)\b/.test(s)) return 'edit'
  if (QUESTION_FORMS.some(re => re.test(s)) && (NARROW_ANCHOR.test(s) || /\b(it|this|that|these|my)\b/.test(s))) return 'edit'

  if (NONEDIT_ACTIONS.has(first)) return 'out'
  if (QUESTION_START.test(first)) {
    if (NARROW_Q.test(s) && (style || /\b(look|work|read|sound|flagged|wrong|missing|think)\b/.test(s) || /\b(is|are|does|do|how|what|which|where|why)\b/.test(first))) return 'edit'
    if (/^(is|are|does|do|can|should|will|would|could)\b/.test(first) && /\b(it|this|that|these)\b/.test(s) && style) return 'edit'
    return 'out'
  }
  if (NEEDS_ANCHOR_VERBS.has(first)) return HARD_ANCHOR.test(s) || CONTACT.test(s) ? 'edit' : 'out'
  if (EDIT_VERBS.has(first)) {
    if (tokens.length === 1) return BARE_OK.has(first) ? 'edit' : 'out'
    if (first === 'translate' && !HARD_ANCHOR.test(s)) return 'out'
    if (hasResume || deictic || style) {
      if (!hasResume && tokens.length <= 8 && /\b(about|regarding|related to|concerning)\b/.test(s)) return 'out'
      return 'edit'
    }
    return 'out'
  }
  if (/^(be|sound|read|look)\b/.test(first) && style) return 'edit'
  if (tokens.length <= 6 && (hasResume || style) && !tokens.some(t => NONEDIT_ACTIONS.has(t))) return 'edit'
  if (tokens.length > 6 && !tokens.some((t, i) => i < 2 && NONEDIT_ACTIONS.has(t))) return 'neutral'
  if (/^(i|it|that|this|they|recruiters?|everyone|people|my resume|the resume)\b/.test(s) && tokens.length <= 8) return 'neutral'
  return 'out'
}

function refusalFor(parts: string[]): string {
  const shown = parts.slice(0, 2).map(p => `"${p.length > 40 ? p.slice(0, 39) + '…' : p}"`).join(' and ')
  return `I can only work on your resume, so I did not run this request. Not about your resume: ${shown}. Resend just the resume part, for example "make this stronger", and I will do it.`
}

export function classifyScope(prompt: string, doc?: { text: string }): ScopeResult {
  try {
    const raw = typeof prompt === 'string' ? prompt : ''
    let folded = raw
    try { folded = raw.normalize('NFKC') } catch { /* ignore */ }
    const p = folded.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[ \t\r\f\v]+/g, ' ').replace(/ ?\n ?/g, '\n').trim()
    if (!p) return deny('empty prompt')
    if (p.length > 6000) return deny('prompt too long to be a resume edit command')

    for (const re of JAILBREAK) if (re.test(p)) return deny('attempts to change or extract the assistant instructions')
    for (const re of OFF_TASK) if (re.test(p)) return deny('request is not about editing the resume')
    for (const re of EXTRA_DENY) if (re.test(p)) return deny('request includes something other than editing the resume')
    if (COVER.test(p)) return deny('cover letters are out of scope')
    if (/\b(my|the|this) (essay|paper|report|thesis|article|blog|email|e-mail|letter|post|presentation|slides?|deck|proposal|assignment|homework|code|script|website|app|document)\b/.test(p) && !/\b(resume|cv|r[ée]sum[ée])\b/.test(p)) {
      return deny('request is about another document')
    }

    const names = doc && typeof doc.text === 'string' ? docNames(doc.text) : []
    const clauses = splitClauses(p)
    const outParts: string[] = []
    const inParts: string[] = []
    let edits = 0
    for (const clause of clauses) {
      const v = classifyClause(clause, names)
      if (v === 'out') outParts.push(clause)
      else if (v === 'edit') { edits++; inParts.push(clause) }
    }
    if (outParts.length) {
      const r = deny(clauses.length > 1 ? 'part of the request is not about the resume' : 'not an actionable request about the resume')
      if (clauses.length > 1) { r.refusal = refusalFor(outParts); r.outOfScopeParts = outParts; r.inScopeParts = inParts }
      return r
    }
    if (!edits) return deny('not an actionable request about the resume')
    return { inScope: true, reason: clauses.length > 1 ? 'every part of the request is about the resume' : 'actionable request about the resume', inScopeParts: inParts }
  } catch {
    return deny('could not classify the request')
  }
}

/** True when resume text itself contains instruction-like content aimed at an AI (it is still treated as plain data). */
export function looksLikeInjection(text: string): boolean {
  const t = (typeof text === 'string' ? text : '').toLowerCase().replace(/\s+/g, ' ')
  return JAILBREAK.some(re => re.test(t)) || /\b(write|compose|tell) (me )?(a|an) (poem|song|story|joke)\b/.test(t) || /\bassistant\b.{0,20}\b(must|should|will)\b/.test(t)
}
