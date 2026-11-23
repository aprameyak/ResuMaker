'use client'

import dynamic from 'next/dynamic'

// The editor touches window, localStorage and CodeMirror, so it is only ever rendered in the browser.
const IdeApp = dynamic(() => import('../components/ide/IdeApp'), {
  ssr: false,
  loading: () => (
    <div className="ide ide-loading" role="status">
      <p className="muted">Loading the editor...</p>
    </div>
  ),
})

export default function IdePage() {
  return <IdeApp />
}
