'use client';

import dynamic from 'next/dynamic';

const DiagramEditor = dynamic(() => import('@/components/editor/DiagramEditor'), { ssr: false });

export default function Home() {
  return <DiagramEditor />;
}
