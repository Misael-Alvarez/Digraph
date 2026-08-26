'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// The editor is a large client-only bundle; there is nothing to server-render.
const DiagramEditor = dynamic(() => import('@/components/editor/DiagramEditor'), { ssr: false });

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  if (!id) return null;
  return <DiagramEditor documentId={id} />;
}
