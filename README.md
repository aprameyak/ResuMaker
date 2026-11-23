# ResuMaker

ResuMaker is a Next.js resume builder with a section editor, resume import, and job-description tailoring. There is no AI API and no API key: parsing, keyword matching, and suggestions run as plain code, in the browser.

Live site: https://resumaker.aprameyak.workers.dev

## Principles

- Nothing is invented. Tailoring only respells wording you already wrote (for example `JS` to `JavaScript` when the posting says JavaScript). Skills the posting wants that you do not list are reported as missing, never added.
- The match score is explained. You see which keywords were found and which were not.
- Export is free and text-based. "Save as PDF" prints a single-column page with selectable text, which is what applicant tracking systems read.
- Uploads are read in the browser and never sent to a server.

## What works

- Accounts at `/auth` (bcrypt, JWT, D1 through Prisma).
- `/upload`: PDF, DOCX, or TXT is read in the browser, parsed into sections, and opened in the editor. Scanned or image-only PDFs have no text and are rejected with a message.
- `/create`: section editor with five starter templates.
- `/tailor`: paste a resume and a job posting, get a before and after keyword match, the changes made, and what is missing. Download as `.txt` or save as PDF.

## Not done yet

- Editor content is not saved to the database. The `Resume` table exists but no code writes to it.
- The "Preview & Export" button on `/create` links to `/preview`, which does not exist.
- No two-column or designed templates. Single column is deliberate for ATS parsing.

## The engine

Everything lives in `lib/resume/`:

- `parse.ts`: resume text to `{ summary, education, experience, skills, projects }`. Handles `•`, `-`, and `▪` bullets, wrapped lines, `Title | Company | dates`, `Company — Title (dates)`, and company, title, and dates on separate lines.
- `keywords.ts`: reads a job posting into essential, preferred, skills, and industry terms, and matches them against a resume, with aliases (`k8s`, `Postgres`, `golang`).
- `suggest.ts` and `optimize.ts`: deterministic fixes (leading with the action verb instead of "Responsible for", dropping "I", technology capitalization) and advisory notes (passive voice, no numbers, long bullets). Advisory notes never rewrite your text.
- `extract.ts`: PDF (pdf.js), DOCX (mammoth), and TXT to text.
- `export.ts`: plain text export and editor section conversion.

## Development

Prerequisites: Node.js 20.16 or later.

```bash
npm install
npm run setup     # writes .env.local with a generated JWT_SECRET
npm run dev       # http://localhost:3001
npm test          # engine tests
npm run typecheck
npm run build
```

Required environment: `JWT_SECRET`. Accounts use a Cloudflare D1 binding named `DB` (see `wrangler.jsonc`).

## License

MIT. See [LICENSE](LICENSE).
