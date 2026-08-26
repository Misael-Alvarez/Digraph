'use client';

import { useRef, useState } from 'react';
import type { MessageKey } from '@/lib/i18n/messages';
import type { WorkspaceExport } from '@/lib/store';
import { useRepository } from '../app/RepositoryProvider';

interface WorkspaceActionsProps {
  onChanged: () => void | Promise<void>;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
}

/**
 * Export and import of the whole workspace.
 *
 * This is what makes the local store an honest place to keep work: everything
 * can be taken out in one file and put back. It is also the migration path to
 * the cloud — the import side is the same regardless of which repository is
 * behind it.
 */
export function WorkspaceActions({ onChanged, t }: WorkspaceActionsProps) {
  const repository = useRepository();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const download = async () => {
    const dump = await repository.exportWorkspace();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `architecture-workspace-${dump.exportedAt.slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const upload = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as WorkspaceExport;
      const count = await repository.importWorkspace(parsed);
      setMessage(t('library.imported', { count }));
      await onChanged();
    } catch {
      setMessage(t('toast.invalidFile'));
    }
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <>
      <button type="button" className="button" onClick={() => void download()}>
        {t('library.export')}
      </button>
      <button type="button" className="button" onClick={() => fileInput.current?.click()}>
        {t('library.import')}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = '';
        }}
      />
      {message && <span className="library-message">{message}</span>}
    </>
  );
}
