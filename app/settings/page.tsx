'use client';

import { useState, useEffect, useCallback } from 'react';

import { useSettingsStore } from '@/store/settingsStore';
import { getSettings, updateSettings } from '@/app/actions/goals';
import { ACCENT_COLORS, ThemeMode, WeekStart } from '@/types/settings';

export default function SettingsPage() {
    const { settings, setSettings, updateSetting } = useSettingsStore();
    const [saving, setSaving] = useState(false);


    const loadSettings = useCallback(async () => {
        try {
            const s = await getSettings();
            setSettings({
                ...s,
                theme: s.theme as ThemeMode,
                weekStart: s.weekStart as WeekStart,
            });
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }, [setSettings]);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    const save = async (key: string, value: unknown) => {
        setSaving(true);
        try {
            await updateSettings({ [key]: value });
            updateSetting(key as any, value as any);
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-enter">
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Customize your Structured experience</p>
                </div>

                {/* Appearance */}
                <div className="settings-section">
                    <h3 className="settings-section-title">Appearance</h3>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Theme</div>
                            <div className="settings-desc">Choose dark, light, or follow system</div>
                        </div>
                        <div className="tabs">
                            {(['dark', 'light', 'system'] as ThemeMode[]).map(theme => (
                                <button
                                    key={theme}
                                    className={`tab ${settings.theme === theme ? 'active' : ''}`}
                                    onClick={() => save('theme', theme)}
                                >
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Accent Color</div>
                            <div className="settings-desc">Personalize your highlight color</div>
                        </div>
                        <div className="color-swatches">
                            {ACCENT_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    className={`color-swatch ${settings.accentColor === color.value ? 'active' : ''}`}
                                    style={{ background: color.value }}
                                    onClick={() => save('accentColor', color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Behavior */}
                <div className="settings-section">
                    <h3 className="settings-section-title">Behavior</h3>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Week Starts On</div>
                            <div className="settings-desc">Choose when your week begins</div>
                        </div>
                        <div className="tabs">
                            {(['monday', 'sunday'] as WeekStart[]).map(day => (
                                <button
                                    key={day}
                                    className={`tab ${settings.weekStart === day ? 'active' : ''}`}
                                    onClick={() => save('weekStart', day)}
                                >
                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Streak Threshold</div>
                            <div className="settings-desc">Minimum % of daily goal to count as a productive day</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input
                                className="input"
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={settings.streakThreshold}
                                onChange={e => save('streakThreshold', Number(e.target.value))}
                                style={{ width: 120 }}
                            />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: 40, textAlign: 'right' }}>
                                {settings.streakThreshold}%
                            </span>
                        </div>
                    </div>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Daily Reset Time</div>
                            <div className="settings-desc">When does a new day start for you?</div>
                        </div>
                        <input
                            className="input"
                            type="time"
                            value={settings.dailyResetTime}
                            onChange={e => save('dailyResetTime', e.target.value)}
                            style={{ width: 120 }}
                        />
                    </div>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Privacy Mode</div>
                            <div className="settings-desc">Blur sensitive data when stepping away</div>
                        </div>
                        <button
                            className={`toggle ${settings.privacyMode ? 'active' : ''}`}
                            onClick={() => save('privacyMode', !settings.privacyMode)}
                        />
                    </div>
                </div>

                {/* Data */}
                <div className="settings-section">
                    <h3 className="settings-section-title">Data</h3>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Export Data</div>
                            <div className="settings-desc">Download all your data in JSON or CSV format</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/history'}>
                                Go to History
                            </button>
                        </div>
                    </div>

                    <div className="settings-row">
                        <div>
                            <div className="settings-label">Database</div>
                            <div className="settings-desc">Your data is stored in Neon PostgreSQL</div>
                        </div>
                        <span className="badge badge-success">Connected</span>
                    </div>
                </div>

                {/* About */}
                <div className="settings-section">
                    <h3 className="settings-section-title">About</h3>
                    <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                        <div style={{
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: 4,
                        }}>
                            Structured
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>
                            Temporal Productivity Intelligence Platform
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                            Version 0.1.0 — Phase 1
                        </div>
                    </div>
                </div>

                {saving && (
                    <div style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        background: 'var(--accent)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 50,
                    }}>
                        Saving...
                    </div>
                )}
            </div>
        </div>
    );
}
