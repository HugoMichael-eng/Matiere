import AsyncStorage from '@react-native-async-storage/async-storage';
import { PINNED_SESSIONS_KEY } from '@/constants/creative-lab';

/**
 * Remove a deleted conversation from the persisted pin list.
 *
 * Reading storage here instead of relying only on screen state also covers
 * deletions that happen before the conversations screen finishes loading pins.
 */
export async function removePinnedSession(id: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PINNED_SESSIONS_KEY);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const remaining = parsed.filter(
      (value): value is number => typeof value === 'number' && value !== id,
    );
    if (remaining.length === parsed.length) return;

    if (remaining.length === 0) {
      await AsyncStorage.removeItem(PINNED_SESSIONS_KEY);
    } else {
      await AsyncStorage.setItem(PINNED_SESSIONS_KEY, JSON.stringify(remaining));
    }
  } catch {
    // Pin persistence should never block a successful conversation deletion.
  }
}