'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { RepositoryProvider } from './RepositoryProvider';
import { useGlobalRipple } from './useRipple';

export function AppProviders({ children }: { children: ReactNode }) {
  // Mounted once, above every screen: the press feedback belongs to the app
  // rather than to any one control.
  useGlobalRipple();

  return (
    <AuthProvider>
      <RepositoryProvider>{children}</RepositoryProvider>
    </AuthProvider>
  );
}
