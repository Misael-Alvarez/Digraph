'use client';

import dynamic from 'next/dynamic';

// The library reads IndexedDB, which only exists in the browser.
const Library = dynamic(() => import('@/components/library/Library').then((m) => m.Library), {
  ssr: false,
});

export default function LibraryPage() {
  return <Library />;
}
