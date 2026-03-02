'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { getSettings } from '@/app/actions/goals';

const navItems = [
    { href: '/timeline', label: 'Timeline', icon: '◎' },
    { href: '/goals', label: 'Goals', icon: '◆' },
    { href: '/history', label: 'History', icon: '☰' },
    { href: '/inbox', label: 'Inbox', icon: '✦' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { settings, setSettings } = useSettingsStore();

    useEffect(() => {
        getSettings().then(s => {
            setSettings({
                ...s,
                theme: s.theme as 'dark' | 'light' | 'system',
                weekStart: s.weekStart as 'monday' | 'sunday',
            });
        });
    }, [setSettings]);

    useEffect(() => {
        const root = document.documentElement;
        if (settings.theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', settings.theme);
        }
        root.style.setProperty('--accent', settings.accentColor);
        root.style.setProperty('--accent-light', `${settings.accentColor}26`);
    }, [settings.theme, settings.accentColor]);

    return (
        <>
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
                    ☰
                </button>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Structured</span>
                <div style={{ width: 28 }} />
            </div>

            {/* Sidebar overlay for mobile */}
            <div
                className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h1>Structured</h1>
                    <p>Temporal Intelligence</p>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--muted)' }}>
                    v0.1.0 — Phase 1
                </div>
            </aside>
        </>
    );
}
