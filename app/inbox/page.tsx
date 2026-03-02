'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getDailyAnalytics, getMonthlyAnalytics, getStreakData, getWeeklyPattern } from '@/app/actions/analytics';
import { getToday, getCurrentMonth, formatDuration, formatHoursDecimal } from '@/lib/date-utils';
import { DailyStats, MonthlyStats, StreakData, WeeklyPattern, BehavioralInsight } from '@/types/analytics';

function generateInsights(
    daily: DailyStats | null,
    monthly: MonthlyStats | null,
    streak: StreakData | null,
    weeklyPattern: WeeklyPattern[]
): BehavioralInsight[] {
    const insights: BehavioralInsight[] = [];

    if (streak && streak.currentStreak >= 7) {
        insights.push({
            type: 'achievement',
            title: `${streak.currentStreak}-Day Streak!`,
            description: 'Your consistency is building momentum. Keep going!',
            metric: streak.currentStreak,
            icon: '🔥',
        });
    }

    if (weeklyPattern.length > 0) {
        const sorted = [...weeklyPattern].sort((a, b) => b.averageMinutes - a.averageMinutes);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        if (best.averageMinutes > 0) {
            insights.push({
                type: 'insight',
                title: `${best.dayName} is your power day`,
                description: `You average ${formatDuration(best.averageMinutes)} on ${best.dayName}s — your most productive day.`,
                metric: best.averageMinutes,
                icon: '⚡',
            });
        }

        if (worst.averageMinutes > 0 && best.averageMinutes > worst.averageMinutes * 2) {
            insights.push({
                type: 'warning',
                title: `${worst.dayName} could use attention`,
                description: `${worst.dayName} averages just ${formatDuration(worst.averageMinutes)} — consider scheduling lighter tasks.`,
                metric: worst.averageMinutes,
                icon: '📉',
            });
        }
    }

    if (monthly && monthly.consistencyScore >= 80) {
        insights.push({
            type: 'strength',
            title: 'Highly Consistent',
            description: `Your consistency score is ${monthly.consistencyScore}% — you show up reliably.`,
            metric: monthly.consistencyScore,
            icon: '💎',
        });
    } else if (monthly && monthly.consistencyScore < 50 && monthly.consistencyScore > 0) {
        insights.push({
            type: 'warning',
            title: 'Consistency is fluctuating',
            description: `At ${monthly.consistencyScore}%, your daily output varies a lot. Try anchoring with a minimum daily routine.`,
            metric: monthly.consistencyScore,
            icon: '📊',
        });
    }

    if (daily && daily.completionRate >= 90) {
        insights.push({
            type: 'achievement',
            title: 'Crushing it today!',
            description: `${Math.round(daily.completionRate)}% of today's tasks are complete.`,
            metric: daily.completionRate,
            icon: '🎯',
        });
    }

    if (streak && streak.recoveryRate >= 80) {
        insights.push({
            type: 'strength',
            title: 'Strong recovery pattern',
            description: `You bounce back ${streak.recoveryRate}% of the time after a break. Resilience matters.`,
            metric: streak.recoveryRate,
            icon: '🛡️',
        });
    }

    if (insights.length === 0) {
        insights.push({
            type: 'insight',
            title: 'Start tracking to unlock insights',
            description: 'Add tasks to your timeline and behavioral patterns will emerge over time.',
            icon: '🧠',
        });
    }

    return insights;
}

export default function InboxPage() {
    const [daily, setDaily] = useState<DailyStats | null>(null);
    const [monthly, setMonthly] = useState<MonthlyStats | null>(null);
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [pattern, setPattern] = useState<WeeklyPattern[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [d, m, s, p] = await Promise.all([
                getDailyAnalytics(getToday()),
                getMonthlyAnalytics(getCurrentMonth()),
                getStreakData(),
                getWeeklyPattern(),
            ]);
            setDaily(d);
            setMonthly(m);
            setStreak(s);
            setPattern(p);
        } catch (err) {
            console.error('Failed to load insights:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const insights = generateInsights(daily, monthly, streak, pattern);

    const typeColors = {
        achievement: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
        strength: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)' },
        warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
        insight: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)' },
    };

    return (
        <div className="page-enter">
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">Inbox</h1>
                    <p className="page-subtitle">Behavioral insights & productivity intelligence</p>
                </div>

                {/* Identity Question */}
                <div className="glass-card" style={{ marginBottom: 24, textAlign: 'center', padding: '32px 24px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                        The Question That Matters
                    </div>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--accent), #a78bfa, #ec4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.025em',
                    }}>
                        &ldquo;Who am I becoming over time?&rdquo;
                    </div>
                </div>

                {/* Quick Stats */}
                {daily && monthly && streak && (
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card">
                            <span className="stat-label">Today</span>
                            <span className="stat-value">{formatHoursDecimal(daily.totalMinutes)}h</span>
                            <span className="stat-sub">{daily.completedTasks} tasks done</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">This Month</span>
                            <span className="stat-value">{formatHoursDecimal(monthly.totalMinutes)}h</span>
                            <span className="stat-sub">{monthly.activeDays} active days</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Streak</span>
                            <span className="stat-value">🔥 {streak.currentStreak}</span>
                            <span className="stat-sub">best: {streak.longestStreak}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Consistency</span>
                            <span className="stat-value">{monthly.consistencyScore}%</span>
                            <span className="stat-sub">this month</span>
                        </div>
                    </div>
                )}

                {/* Insights */}
                {isLoading ? (
                    <div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12 }} />
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {insights.map((insight, i) => (
                            <motion.div
                                key={i}
                                className="card"
                                style={{
                                    background: typeColors[insight.type].bg,
                                    borderColor: typeColors[insight.type].border,
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{insight.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{insight.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>{insight.description}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Behavioral Evolution */}
                <div className="card" style={{ marginTop: 32, textAlign: 'center', padding: '32px 24px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
                        The Evolution
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                        {['Tracking', 'Measuring', 'Understanding', 'Adjusting', 'Improving'].map((stage, i) => (
                            <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: 999,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: i === 0 ? 'var(--accent-light)' : 'transparent',
                                    color: i === 0 ? 'var(--accent)' : 'var(--muted)',
                                    border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border-color)'}`,
                                }}>
                                    {stage}
                                </span>
                                {i < 4 && <span style={{ color: 'var(--border-color)' }}>→</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
