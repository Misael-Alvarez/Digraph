'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// The diagram is decoded in the browser from the link, so there is nothing to
// server-render here.
const SharedDiagram = dynamic(
  () => import('@/components/share/SharedDiagram').then((m) => m.SharedDiagram),
  { ssr: false },
);

export default function SharePage() {
  return (
    <Suspense fallback={null}>
      <SharedDiagram />
    </Suspense>
  );
}
