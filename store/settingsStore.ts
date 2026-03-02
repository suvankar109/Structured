import { create } from 'zustand';
import { AppSettings, DEFAULT_SETTINGS, ThemeMode } from '@/types/settings';

interface SettingsState {
    settings: AppSettings;
    isLoading: boolean;

    setSettings: (settings: AppSettings) => void;
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
    setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: DEFAULT_SETTINGS,
    isLoading: false,

    setSettings: (settings) => set({ settings }),
    updateSetting: (key, value) => set((state) => ({
        settings: { ...state.settings, [key]: value, updatedAt: new Date().toISOString() },
    })),
    setLoading: (isLoading) => set({ isLoading }),
}));
