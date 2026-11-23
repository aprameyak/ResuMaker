'use client'

import type { RoundTrip } from '../../ide/analysis'

export default function AtsTab({ ats, trip }: { ats: string; trip: RoundTrip | null }) {
  return (
    <div className="ide-pad ide-ats">
      <div>
        <h3 className="ide-h3">Text an ATS reads from the PDF</h3>
        <p className="muted ide-small">This is the same structure the preview and the PDF use, flattened to plain text, in the order it is printed.</p>
        <pre className="ide-pre" data-testid="ide-ats-text" tabIndex={0} aria-label="ATS plain text">{ats || '(nothing yet)'}</pre>
      </div>
      <div>
        <h3 className="ide-h3">Round-trip check</h3>
        <p className="muted ide-small">The text above is parsed again and compared with your original. Anything that does not survive is flagged.</p>
        {trip && (
          <>
            <p data-testid="ide-roundtrip-status" aria-live="polite">{trip.ok ? 'Everything survived the round trip.' : 'Some content did not survive. See below.'}</p>
            <table className="ide-table" data-testid="ide-roundtrip">
              <thead><tr><th scope="col">Item</th><th scope="col">Original</th><th scope="col">After</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {trip.rows.map(r => (
                  <tr key={r.label}><th scope="row">{r.label}</th><td>{r.original}</td><td>{r.after}</td><td>{r.ok ? 'Kept' : 'Lost'}</td></tr>
                ))}
              </tbody>
            </table>
            {trip.lost.length > 0 && (
              <>
                <h4 className="ide-h4">Lines that mostly vanished</h4>
                <ul className="ide-list-plain" data-testid="ide-roundtrip-lost">{trip.lost.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </>
            )}
            {trip.skippedLostScan && <p className="muted ide-small">The line-by-line check is skipped for very long documents.</p>}
          </>
        )}
      </div>
    </div>
  )
}
