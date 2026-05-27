/**
 * Global user profile store — shared across all dashboards.
 * Persists avatar URL and display name to localStorage so the
 * avatar appears consistently in every navbar and profile page.
 * Falls back to Supabase profiles table / user_metadata for
 * cross-device sync of avatar URLs.
 *
 * IMPORTANT: Data is scoped to the authenticated user ID so that
 * profiles never leak between different accounts on the same device.
 */
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

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
   * It loads that user's profile from localStorage and then
   * fetches the avatar from Supabase for cross-device sync.
   */
  bindToUser: (userId: string) => void;
  /** Wipe the in-memory state (called on logout). */
  clearProfile: () => void;
  /** @deprecated Use bindToUser instead */
  loadFromStorage: () => void;
}

const STORAGE_PREFIX = "sannidh:user-profile:";

/** Check if a URL is a remote/public URL (not a base64 data URL) */
const isRemoteUrl = (url: string | null): boolean => {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
};

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

/**
 * Fetch the avatar URL from Supabase (profiles table or user_metadata).
 * Runs in the background after bindToUser to provide cross-device sync.
 */
const fetchAvatarFromSupabase = async (userId: string): Promise<string | null> => {
  try {
    // 1. Try the profiles table first (authoritative source)
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.avatar_url && isRemoteUrl(profile.avatar_url)) {
      return profile.avatar_url;
    }

    // 2. Fallback: check user_metadata
    const { data: { user } } = await supabase.auth.getUser();
    const metaAvatar = user?.user_metadata?.avatar_url;
    if (metaAvatar && isRemoteUrl(metaAvatar)) {
      return metaAvatar;
    }
  } catch {
    // Network error — will use cached version
  }
  return null;
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
    const localAvatar = p.avatarUrl ?? null;

    set({
      _boundUserId: userId,
      displayName: p.displayName ?? "",
      avatarUrl: isRemoteUrl(localAvatar) ? localAvatar : null,
      firmName: p.firmName ?? "",
      icaiNumber: p.icaiNumber ?? "",
    });

    // Async: fetch avatar from Supabase for cross-device sync
    fetchAvatarFromSupabase(userId).then((remoteAvatar) => {
      if (!remoteAvatar) return;
      const currentState = get();
      // Only update if we're still bound to the same user and the remote
      // URL is different from what we already have
      if (currentState._boundUserId === userId && currentState.avatarUrl !== remoteAvatar) {
        set({ avatarUrl: remoteAvatar });
        persistForUser(userId, { avatarUrl: remoteAvatar });
      }
    });
  },

  clearProfile: () => {
    set({ ...emptyProfile, _boundUserId: null });
  },

  // Legacy compat — no-op; real binding happens in bindToUser
  loadFromStorage: () => {},
}));

