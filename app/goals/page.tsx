'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGoalStore } from '@/store/goalStore';
import { getGoal, upsertGoal } from '@/app/actions/goals';
import { getDailyAnalytics, getMonthlyAnalytics, getStreakData } from '@/app/actions/analytics';
import { formatDuration, formatHoursDecimal, getToday, getCurrentMonth, getCurrentYear } from '@/lib/date-utils';
import { DailyGoal, MonthlyGoal, YearlyGoal, DEFAULT_DAILY_GOAL, DEFAULT_MONTHLY_GOAL, DEFAULT_YEARLY_GOAL } from '@/types/goal';
import { StreakData, MonthlyStats, DailyStats } from '@/types/analytics';

export default function GoalsPage() {
    const { dailyGoal, monthlyGoal, yearlyGoal, setDailyGoal, setMonthlyGoal, setYearlyGoal } = useGoalStore();
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');
    const [editing, setEditing] = useState(false);
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Editable form state
    const [formDailyHours, setFormDailyHours] = useState(dailyGoal.targetHours);
    const [formDailyTasks, setFormDailyTasks] = useState(dailyGoal.targetTasks);
    const [formMonthlyHours, setFormMonthlyHours] = useState(monthlyGoal.targetHours);
    const [formMonthlyTasks, setFormMonthlyTasks] = useState(monthlyGoal.targetTasks);
    const [formMonthlyDays, setFormMonthlyDays] = useState(monthlyGoal.targetActiveDays);
    const [formYearlyHours, setFormYearlyHours] = useState(yearlyGoal.targetHours);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dGoal, mGoal, yGoal, streakResult, dailyResult, monthlyResult] = await Promise.all([
                getGoal('daily', getToday()),
                getGoal('monthly', getCurrentMonth()),
                getGoal('yearly', getCurrentYear()),
                getStreakData(),
                getDailyAnalytics(getToday()),
                getMonthlyAnalytics(getCurrentMonth()),
            ]);

            if (dGoal?.data) {
                const d = dGoal.data as unknown as DailyGoal;
                setDailyGoal(d);
                setFormDailyHours(d.targetHours);
                setFormDailyTasks(d.targetTasks);
            }
            if (mGoal?.data) {
                const m = mGoal.data as unknown as MonthlyGoal;
                setMonthlyGoal(m);
                setFormMonthlyHours(m.targetHours);
                setFormMonthlyTasks(m.targetTasks);
                setFormMonthlyDays(m.targetActiveDays);
            }
            if (yGoal?.data) {
                const y = yGoal.data as unknown as YearlyGoal;
                setYearlyGoal(y);
                setFormYearlyHours(y.targetHours);
            }

            setStreak(streakResult);
            setDailyStats(dailyResult);
            setMonthlyStats(monthlyResult);
        } catch (err) {
            console.error('Failed to load goals:', err);
        } finally {
            setIsLoading(false);
        }
    }, [setDailyGoal, setMonthlyGoal, setYearlyGoal]);

    useEffect(() => { loadData(); }, [loadData]);

    const saveGoals = async () => {
        try {
            await Promise.all([
                upsertGoal('daily', getToday(), {
                    targetHours: formDailyHours,
                    targetTasks: formDailyTasks,
                }),
                upsertGoal('monthly', getCurrentMonth(), {
                    targetHours: formMonthlyHours,
                    targetTasks: formMonthlyTasks,
                    targetActiveDays: formMonthlyDays,
                }),
                upsertGoal('yearly', getCurrentYear(), {
                    targetHours: formYearlyHours,
                }),
            ]);
            setDailyGoal({ targetHours: formDailyHours, targetTasks: formDailyTasks });
            setMonthlyGoal({ targetHours: formMonthlyHours, targetTasks: formMonthlyTasks, targetActiveDays: formMonthlyDays });
            setYearlyGoal({ targetHours: formYearlyHours });
            setEditing(false);
        } catch (err) {
            console.error('Failed to save goals:', err);
        }
    };

    const dailyMinutesTarget = dailyGoal.targetHours * 60;
    const dailyProgress = dailyStats
        ? Math.min(100, Math.round((dailyStats.totalMinutes / dailyMinutesTarget) * 100))
        : 0;

    const monthlyMinutesTarget = monthlyGoal.targetHours * 60;
    const monthlyProgress = monthlyStats
        ? Math.min(100, Math.round((monthlyStats.totalMinutes / monthlyMinutesTarget) * 100))
        : 0;

    return (
        <div className="page-enter">
            <div className="page-container">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Goals</h1>
                        <p className="page-subtitle">Set targets and track your progress</p>
                    </div>
                    <button
                        className={`btn ${editing ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={editing ? saveGoals : () => setEditing(true)}
                    >
                        {editing ? 'Save Goals' : 'Edit Goals'}
                    </button>
                </div>

                {/* Streak Card */}
                {streak && (
                    <motion.div
                        className="glass-card"
                        style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="streak-display">
                            <span className="streak-fire">🔥</span>
                            <div>
                                <div className="streak-count">{streak.currentStreak}</div>
                                <div className="streak-label">day streak</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{streak.longestStreak}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Longest</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{streak.recoveryRate}%</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Recovery</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{streak.totalActiveDays}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Active Days</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="tabs" style={{ marginBottom: 24 }}>
                    {(['daily', 'monthly', 'yearly'] as const).map(tab => (
                        <button
                            key={tab}
                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Daily Tab */}
                {activeTab === 'daily' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Hours Target</span>
                                {editing ? (
                                    <input className="input" type="number" step={0.5} min={0.5} max={24} value={formDailyHours} onChange={e => setFormDailyHours(Number(e.target.value))} />
                                ) : (
                                    <span className="stat-value">{dailyGoal.targetHours}h</span>
                                )}
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Tasks Target</span>
                                {editing ? (
                                    <input className="input" type="number" min={1} max={50} value={formDailyTasks} onChange={e => setFormDailyTasks(Number(e.target.value))} />
                                ) : (
                                    <span className="stat-value">{dailyGoal.targetTasks}</span>
                                )}
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Today&apos;s Progress</span>
                                <span className="stat-value" style={{ color: dailyProgress >= 100 ? 'var(--success)' : 'var(--accent)' }}>
                                    {dailyProgress}%
                                </span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Time Logged</span>
                                <span className="stat-value">{dailyStats ? formatHoursDecimal(dailyStats.totalMinutes) : '0'}h</span>
                            </div>
                        </div>

                        {/* Progress Ring Visual */}
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <svg width="180" height="180" viewBox="0 0 180 180">
                                <circle cx="90" cy="90" r="80" fill="none" stroke="var(--border-color)" strokeWidth="10" />
                                <motion.circle
                                    cx="90" cy="90" r="80"
                                    fill="none"
                                    stroke="var(--accent)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={502.65}
                                    initial={{ strokeDashoffset: 502.65 }}
                                    animate={{ strokeDashoffset: 502.65 - (502.65 * dailyProgress / 100) }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    transform="rotate(-90 90 90)"
                                />
                                <text x="90" y="82" textAnchor="middle" fill="var(--fg)" fontSize="28" fontWeight="800">
                                    {dailyProgress}%
                                </text>
                                <text x="90" y="105" textAnchor="middle" fill="var(--muted)" fontSize="12">
                                    Daily Goal
                                </text>
                            </svg>
                        </div>
                    </motion.div>
                )}

                {/* Monthly Tab */}
                {activeTab === 'monthly' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Hours Target</span>
                                {editing ? (
                                    <input className="input" type="number" min={1} max={744} value={formMonthlyHours} onChange={e => setFormMonthlyHours(Number(e.target.value))} />
                                ) : (
                                    <span className="stat-value">{monthlyGoal.targetHours}h</span>
                                )}
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Tasks Target</span>
                                {editing ? (
                                    <input className="input" type="number" min={1} max={1500} value={formMonthlyTasks} onChange={e => setFormMonthlyTasks(Number(e.target.value))} />
                                ) : (
                                    <span className="stat-value">{monthlyGoal.targetTasks}</span>
                                )}
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Active Days Target</span>
                                {editing ? (
                                    <input className="input" type="number" min={1} max={31} value={formMonthlyDays} onChange={e => setFormMonthlyDays(Number(e.target.value))} />
                                ) : (
                                    <span className="stat-value">{monthlyGoal.targetActiveDays}d</span>
                                )}
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Monthly Progress</span>
                                <span className="stat-value" style={{ color: monthlyProgress >= 100 ? 'var(--success)' : 'var(--accent)' }}>
                                    {monthlyProgress}%
                                </span>
                            </div>
                        </div>

                        {monthlyStats && (
                            <div className="card" style={{ marginTop: 16 }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Monthly Summary</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Total Time</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatHoursDecimal(monthlyStats.totalMinutes)}h</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Active Days</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{monthlyStats.activeDays}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Consistency</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{monthlyStats.consistencyScore}%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Avg Daily</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatDuration(monthlyStats.averageDailyMinutes)}</div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6 }}>
                                        <span>{formatHoursDecimal(monthlyStats.totalMinutes)}h logged</span>
                                        <span>{monthlyGoal.targetHours}h target</span>
                                    </div>
                                    <div style={{ background: 'var(--border-color)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                                        <motion.div
                                            style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), #a78bfa)', borderRadius: 999 }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${monthlyProgress}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Yearly Tab */}
                {activeTab === 'yearly' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Yearly Hours Target</span>
                                {editing ? (
                                    <input className="input" type="number" min={1} max={8760} value={formYearlyHours} onChange={e => setFormYearlyHours(Number(e.target.value))} />
                                ) : (
                                    <span className="stat-value">{yearlyGoal.targetHours}h</span>
                                )}
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">That&apos;s</span>
                                <span className="stat-value">{(yearlyGoal.targetHours / 12).toFixed(0)}h</span>
                                <span className="stat-sub">per month</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Or</span>
                                <span className="stat-value">{(yearlyGoal.targetHours / 52).toFixed(1)}h</span>
                                <span className="stat-sub">per week</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Or</span>
                                <span className="stat-value">{(yearlyGoal.targetHours / 365).toFixed(1)}h</span>
                                <span className="stat-sub">per day</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
