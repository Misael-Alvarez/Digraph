'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { RepositoryProvider } from './RepositoryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RepositoryProvider>{children}</RepositoryProvider>
    </AuthProvider>
  );
}
