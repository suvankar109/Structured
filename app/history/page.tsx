'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getTasksByDateRange } from '@/app/actions/tasks';
import { getHeatmapData, getWeeklyPattern, getMonthlyAnalytics } from '@/app/actions/analytics';
import { formatDisplayDate, formatDuration, formatHoursDecimal, getCurrentYear, getCurrentMonth } from '@/lib/date-utils';
import { CATEGORY_COLORS, CATEGORY_LABELS, TaskCategory, Task } from '@/types/task';
import { HeatmapDay, WeeklyPattern } from '@/types/analytics';

export default function HistoryPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterCompleted, setFilterCompleted] = useState<string>('all');
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPattern[]>([]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [taskData, heatmapData, patternData] = await Promise.all([
                getTasksByDateRange(startDate, endDate),
                getHeatmapData(getCurrentYear()),
                getWeeklyPattern(),
            ]);
            setTasks(taskData as Task[]);
            setHeatmap(heatmapData);
            setWeeklyPattern(patternData);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            if (filterCompleted === 'completed' && !t.completed) return false;
            if (filterCompleted === 'incomplete' && t.completed) return false;
            return true;
        });
    }, [tasks, filterCategory, filterCompleted]);

    const summary = useMemo(() => {
        const totalMinutes = filteredTasks.reduce((s, t) => s + t.duration, 0);
        const completed = filteredTasks.filter(t => t.completed).length;
        const total = filteredTasks.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { totalMinutes, completed, total, completionRate };
    }, [filteredTasks]);

    const exportData = (format: 'json' | 'csv') => {
        let content: string;
        let mime: string;
        let ext: string;

        if (format === 'json') {
            content = JSON.stringify(filteredTasks, null, 2);
            mime = 'application/json';
            ext = 'json';
        } else {
            const headers = 'Date,Title,Start,End,Duration (min),Category,Priority,Completed,Focus Score,Notes';
            const rows = filteredTasks.map(t =>
                `${t.date},"${t.title}",${t.startTime},${t.endTime},${t.duration},${t.category},${t.priority},${t.completed},${t.focusScore ?? ''},${t.notes ? `"${t.notes.replace(/"/g, '""')}"` : ''}`
            );
            content = [headers, ...rows].join('\n');
            mime = 'text/csv';
            ext = 'csv';
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `structured-export-${startDate}-to-${endDate}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="page-enter">
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">History</h1>
                    <p className="page-subtitle">Your temporal archive of productivity</p>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">From</label>
                            <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">To</label>
                            <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Category</label>
                            <select className="input select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                <option value="all">All Categories</option>
                                {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map(cat => (
                                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Status</label>
                            <select className="input select" value={filterCompleted} onChange={e => setFilterCompleted(e.target.value)}>
                                <option value="all">All</option>
                                <option value="completed">Completed</option>
                                <option value="incomplete">Incomplete</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="stats-grid">
                    <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="stat-label">Total Hours</span>
                        <span className="stat-value">{formatHoursDecimal(summary.totalMinutes)}h</span>
                        <span className="stat-sub">{formatDuration(summary.totalMinutes)}</span>
                    </motion.div>
                    <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <span className="stat-label">Tasks</span>
                        <span className="stat-value">{summary.completed}/{summary.total}</span>
                        <span className="stat-sub">completed</span>
                    </motion.div>
                    <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <span className="stat-label">Completion Rate</span>
                        <span className="stat-value" style={{ color: summary.completionRate >= 80 ? 'var(--success)' : summary.completionRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                            {summary.completionRate}%
                        </span>
                    </motion.div>
                    <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <span className="stat-label">Avg Per Day</span>
                        <span className="stat-value">
                            {filteredTasks.length > 0
                                ? formatDuration(Math.round(summary.totalMinutes / new Set(filteredTasks.map(t => t.date)).size))
                                : '—'}
                        </span>
                    </motion.div>
                </div>

                {/* Weekly Pattern */}
                {weeklyPattern.length > 0 && (
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                            Weekly Productivity Pattern
                        </h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
                            {weeklyPattern.map((day, i) => {
                                const maxMin = Math.max(...weeklyPattern.map(d => d.averageMinutes), 1);
                                const height = (day.averageMinutes / maxMin) * 100;
                                return (
                                    <div key={day.dayOfWeek} style={{ flex: 1, textAlign: 'center' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ delay: i * 0.05, duration: 0.5 }}
                                            style={{
                                                background: 'linear-gradient(to top, var(--accent), #a78bfa)',
                                                borderRadius: '4px 4px 0 0',
                                                minHeight: 4,
                                                width: '100%',
                                            }}
                                        />
                                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>{day.dayName}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--fg)', fontWeight: 600 }}>{formatDuration(day.averageMinutes)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Heatmap */}
                {heatmap.length > 0 && (
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                            {getCurrentYear()} Activity Heatmap
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: '100%' }}>
                            {heatmap.map(day => (
                                <div
                                    key={day.date}
                                    className="heatmap-cell"
                                    data-level={day.level}
                                    title={`${day.date}: ${formatDuration(day.value)}`}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: '0.7rem', color: 'var(--muted)' }}>
                            <span>Less</span>
                            {[0, 1, 2, 3, 4].map(level => (
                                <div key={level} className="heatmap-cell" data-level={level} />
                            ))}
                            <span>More</span>
                        </div>
                    </div>
                )}

                {/* Export */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportData('csv')}>
                        Export CSV
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportData('json')}>
                        Export JSON
                    </button>
                </div>

                {/* Task List */}
                {isLoading ? (
                    <div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8 }} />
                        ))}
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">☰</div>
                        <div className="empty-title">No tasks found</div>
                        <div className="empty-desc">Try adjusting your filters or date range</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredTasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 14px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <span style={{ color: task.completed ? 'var(--success)' : 'var(--muted)', fontSize: '0.8rem' }}>
                                    {task.completed ? '✓' : '○'}
                                </span>
                                <span style={{ flex: 1, fontWeight: 500, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}>
                                    {task.title}
                                </span>
                                <span style={{
                                    padding: '2px 6px',
                                    borderRadius: 999,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    background: `${CATEGORY_COLORS[task.category]}22`,
                                    color: CATEGORY_COLORS[task.category],
                                }}>
                                    {CATEGORY_LABELS[task.category]}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                    {task.date}
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {formatDuration(task.duration)}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
