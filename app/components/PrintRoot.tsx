'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PrintRootProps {
  children: React.ReactNode;
}

export default function PrintRoot({ children }: PrintRootProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<div id="print-root">{children}</div>, document.body);
}
