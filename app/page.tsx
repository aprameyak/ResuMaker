import Link from 'next/link';

const STEPS = [
  {
    href: '/create',
    title: 'Create or edit a resume',
    text: 'Start from a template or import a file. The resume is edited as plain text, section by section.',
    cta: 'Open the editor',
  },
  {
    href: '/upload',
    title: 'Import an existing resume',
    text: 'Read a PDF, DOCX or TXT file in your browser and split it into sections you can edit. The file is not uploaded anywhere.',
    cta: 'Import a file',
  },
  {
    href: '/tailor',
    title: 'Match it to a job posting',
    text: 'Paste a job description to see which of its keywords your resume already contains and which it does not.',
    cta: 'Match to a job',
  },
];

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: '56px', paddingBottom: '72px' }}>
      <section style={{ maxWidth: '680px', marginBottom: '56px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>
          A plain-text resume editor and job matcher
        </h1>
        <p className="secondary" style={{ marginBottom: '24px' }}>
          Import or write your resume as plain text, check it against rules you define, compare it with a
          job posting, and export a text-based PDF that applicant tracking systems can read.
          Resume processing is done by local, rule-based code.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/create" className="btn">Create a resume</Link>
          <Link href="/upload" className="btn-secondary">Import a resume</Link>
        </div>
      </section>

      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ marginBottom: '16px' }}>What you can do</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: '16px',
        }}>
          {STEPS.map(step => (
            <div key={step.href} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '8px' }}>{step.title}</h3>
              <p className="secondary" style={{ fontSize: '15px', marginBottom: '16px', flexGrow: 1 }}>{step.text}</p>
              <Link href={step.href} className="link" style={{ fontWeight: 600, minHeight: '40px', display: 'inline-flex', alignItems: 'center' }}>
                {step.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: '680px' }}>
        <h2 style={{ marginBottom: '16px' }}>How it works</h2>
        <ul className="secondary" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Keyword matching compares the words in a job posting with the words in your resume. It does not rewrite your experience.</li>
          <li>Suggestions come from fixed rules, not a language model. No resume text is sent to an AI service.</li>
          <li>PDF export uses your browser&apos;s print dialog, so the text stays selectable.</li>
        </ul>
      </section>
    </div>
  );
}
