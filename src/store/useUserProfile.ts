/**
 * Global user profile store — shared across all dashboards.
 * Persists avatar URL and display name to localStorage so the
 * avatar appears consistently in every navbar and profile page.
 */
import { create } from "zustand";

interface UserProfileState {
  displayName: string;
  avatarUrl: string | null;
  firmName: string;
  icaiNumber: string;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setFirmName: (name: string) => void;
  setIcaiNumber: (num: string) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = "sannidh:user-profile";

const loadProfile = (): Partial<UserProfileState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
};

const persist = (state: Partial<UserProfileState>) => {
  try {
    const prev = loadProfile();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...prev, ...state })
    );
  } catch {
    // ignore
  }
};

export const useUserProfile = create<UserProfileState>((set) => ({
  displayName: loadProfile().displayName ?? "",
  avatarUrl: (loadProfile() as any).avatarUrl ?? null,
  firmName: (loadProfile() as any).firmName ?? "",
  icaiNumber: (loadProfile() as any).icaiNumber ?? "",
  setDisplayName: (name) => {
    set({ displayName: name });
    persist({ displayName: name } as any);
  },
  setAvatarUrl: (url) => {
    set({ avatarUrl: url });
    persist({ avatarUrl: url } as any);
  },
  setFirmName: (name) => {
    set({ firmName: name });
    persist({ firmName: name } as any);
  },
  setIcaiNumber: (num) => {
    set({ icaiNumber: num });
    persist({ icaiNumber: num } as any);
  },
  loadFromStorage: () => {
    const p = loadProfile();
    set({
      displayName: (p as any).displayName ?? "",
      avatarUrl: (p as any).avatarUrl ?? null,
      firmName: (p as any).firmName ?? "",
      icaiNumber: (p as any).icaiNumber ?? "",
    });
  },
}));
