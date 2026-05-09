/**
 * Global user profile store — shared across all dashboards.
 * Persists avatar URL and display name to localStorage so the
 * avatar appears consistently in every navbar and profile page.
 *
 * IMPORTANT: Data is scoped to the authenticated user ID so that
 * profiles never leak between different accounts on the same device.
 */
import { create } from "zustand";

interface UserProfileState {
  displayName: string;
  avatarUrl: string | null;
  firmName: string;
  icaiNumber: string;
  /** Currently bound user id – used to scope localStorage reads/writes */
  _boundUserId: string | null;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setFirmName: (name: string) => void;
  setIcaiNumber: (num: string) => void;
  /**
   * Bind the store to a specific user.  Call this whenever the
   * authenticated user changes (login / auth state change).
   * It loads that user's profile from localStorage and resets
   * any stale data from a previous user.
   */
  bindToUser: (userId: string) => void;
  /** Wipe the in-memory state (called on logout). */
  clearProfile: () => void;
  /** @deprecated Use bindToUser instead */
  loadFromStorage: () => void;
}

const STORAGE_PREFIX = "sannidh:user-profile:";

/** Load profile data for a specific user id from localStorage */
const loadProfileForUser = (userId: string): Record<string, any> => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
};

/** Persist a partial update for the currently bound user */
const persistForUser = (userId: string | null, patch: Record<string, any>) => {
  if (!userId) return; // not bound yet — nothing to persist
  try {
    const prev = loadProfileForUser(userId);
    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify({ ...prev, ...patch })
    );
  } catch {
    // ignore
  }
};

const emptyProfile = {
  displayName: "",
  avatarUrl: null as string | null,
  firmName: "",
  icaiNumber: "",
};

export const useUserProfile = create<UserProfileState>((set, get) => ({
  ...emptyProfile,
  _boundUserId: null,

  setDisplayName: (name) => {
    set({ displayName: name });
    persistForUser(get()._boundUserId, { displayName: name });
  },
  setAvatarUrl: (url) => {
    set({ avatarUrl: url });
    persistForUser(get()._boundUserId, { avatarUrl: url });
  },
  setFirmName: (name) => {
    set({ firmName: name });
    persistForUser(get()._boundUserId, { firmName: name });
  },
  setIcaiNumber: (num) => {
    set({ icaiNumber: num });
    persistForUser(get()._boundUserId, { icaiNumber: num });
  },

  bindToUser: (userId: string) => {
    const current = get()._boundUserId;
    if (current === userId) return; // already bound

    const p = loadProfileForUser(userId);
    set({
      _boundUserId: userId,
      displayName: p.displayName ?? "",
      avatarUrl: p.avatarUrl ?? null,
      firmName: p.firmName ?? "",
      icaiNumber: p.icaiNumber ?? "",
    });
  },

  clearProfile: () => {
    set({ ...emptyProfile, _boundUserId: null });
  },

  // Legacy compat — no-op; real binding happens in bindToUser
  loadFromStorage: () => {},
}));
