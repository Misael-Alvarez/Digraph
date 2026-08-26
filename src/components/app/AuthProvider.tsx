'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { User } from '@/lib/domain';
import { LOCAL_USER, LOCAL_USER_KEY, readUser, writeUser } from '@/lib/auth/user';
import { notifyStoreChanged, useStoredValue } from '@/lib/browserStore';

interface AuthContextValue {
  user: User;
  rename: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useUser(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useUser must be used inside <AuthProvider>');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useStoredValue<User>(
    LOCAL_USER_KEY,
    (raw) => readUser({ getItem: () => raw }),
    LOCAL_USER,
  );

  const rename = useCallback(
    (name: string) => {
      writeUser(window.localStorage, { ...user, name });
      notifyStoreChanged();
    },
    [user],
  );

  const value = useMemo(() => ({ user, rename }), [user, rename]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
