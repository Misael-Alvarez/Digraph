import { z } from 'zod';
import type { User } from '@/lib/domain';

/**
 * Local identity.
 *
 * There are no accounts yet, but every stored record already carries an
 * `ownerId`, and the components already read the current user through the same
 * hook Cognito will feed. Swapping the provider is then the whole migration.
 */
export const LOCAL_USER_KEY = 'aion-studio-user';

export const LOCAL_USER: User = {
  id: 'local-user',
  name: 'You',
};

const StoredUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export function readUser(storage: Pick<Storage, 'getItem'>): User {
  try {
    const raw = storage.getItem(LOCAL_USER_KEY);
    if (!raw) return LOCAL_USER;
    const parsed = StoredUserSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : LOCAL_USER;
  } catch {
    // A corrupt profile must never stop the app from opening.
    return LOCAL_USER;
  }
}

export function writeUser(storage: Pick<Storage, 'setItem'>, user: User): void {
  try {
    storage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } catch {
    // Private browsing: the app works, the name just does not persist.
  }
}
