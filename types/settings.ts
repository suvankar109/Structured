export type ThemeMode = 'dark' | 'light' | 'system';
export type WeekStart = 'monday' | 'sunday';
export type AccentColor = string;

export interface AppSettings {
    id: string;
    theme: ThemeMode;
    accentColor: AccentColor;
    weekStart: WeekStart;
    streakThreshold: number; // 0-100 percentage
    dailyResetTime: string; // HH:mm
    privacyMode: boolean;
    createdAt: string;
    updatedAt: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
    id: 'default',
    theme: 'dark',
    accentColor: '#6366f1',
    weekStart: 'monday',
    streakThreshold: 70,
    dailyResetTime: '00:00',
    privacyMode: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const ACCENT_COLORS = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Sky', value: '#0ea5e9' },
];
