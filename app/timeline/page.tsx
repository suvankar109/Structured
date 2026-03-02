'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/taskStore';
import { useGoalStore } from '@/store/goalStore';
import { getTasks, createTask, updateTask, deleteTask, toggleTaskComplete } from '@/app/actions/tasks';
import { getDailyAnalytics } from '@/app/actions/analytics';
import { getGoal } from '@/app/actions/goals';
import {
    formatMonthYear,
    formatDayOfWeek,
    formatDayNumber,
    formatTime,
    formatDuration,
    calculateDuration,
    getDaysAroundDate,
    isDateToday,
    isDatePast,
    getToday,
    formatHoursDecimal,
} from '@/lib/date-utils';
import {
    CATEGORY_COLORS,
    CATEGORY_LABELS,
    PRIORITY_COLORS,
    PRIORITY_LABELS,
    TaskCategory,
    TaskPriority,
} from '@/types/task';
import { DailyGoal } from '@/types/goal';
import { DailyStats } from '@/types/analytics';

export default function TimelinePage() {
    const {
        tasks,
        selectedDate,
        isLoading,
        setTasks,
        addTask,
        updateTask: updateLocalTask,
        removeTask,
        toggleComplete,
        setSelectedDate,
        setLoading,
    } = useTaskStore();

    const { dailyGoal, setDailyGoal } = useGoalStore();
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
    const dateScrollRef = useRef<HTMLDivElement>(null);
    const [dates, setDates] = useState<string[]>([]);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formStart, setFormStart] = useState('09:00');
    const [formEnd, setFormEnd] = useState('10:00');
    const [formCategory, setFormCategory] = useState<TaskCategory>('work');
    const [formPriority, setFormPriority] = useState<TaskPriority>(2);
    const [formNotes, setFormNotes] = useState('');
    const [formFocusScore, setFormFocusScore] = useState<number | undefined>();

    useEffect(() => {
        setDates(getDaysAroundDate(selectedDate, 15));
    }, [selectedDate]);

    // Scroll to active date
    useEffect(() => {
        if (dateScrollRef.current) {
            const activeEl = dateScrollRef.current.querySelector('.date-item.active');
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [selectedDate, dates]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [taskData, stats, goalData] = await Promise.all([
                getTasks(selectedDate),
                getDailyAnalytics(selectedDate),
                getGoal('daily', selectedDate),
            ]);
            setTasks(taskData as any);
            setDailyStats(stats);
            if (goalData?.data) {
                setDailyGoal(goalData.data as unknown as DailyGoal);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, setTasks, setLoading, setDailyGoal]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateTask = async () => {
        if (!formTitle.trim()) return;
        try {
            const newTask = await createTask({
                title: formTitle,
                date: selectedDate,
                startTime: formStart,
                endTime: formEnd,
                category: formCategory,
                priority: formPriority,
                notes: formNotes || undefined,
                focusScore: formFocusScore,
            });
            addTask(newTask as any);
            resetForm();
            setShowModal(false);
            loadData();
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask || !formTitle.trim()) return;
        try {
            const updated = await updateTask(editingTask, {
                title: formTitle,
                startTime: formStart,
                endTime: formEnd,
                category: formCategory,
                priority: formPriority,
                notes: formNotes || undefined,
                focusScore: formFocusScore,
            });
            updateLocalTask(editingTask, updated as any);
            resetForm();
            setShowModal(false);
            setEditingTask(null);
            loadData();
        } catch (err) {
            console.error('Failed to update task:', err);
        }
    };

    const handleToggle = async (id: string) => {
        toggleComplete(id);
        try {
            await toggleTaskComplete(id);
            loadData();
        } catch {
            toggleComplete(id); // rollback
        }
    };

    const handleDelete = async (id: string) => {
        removeTask(id);
        try {
            await deleteTask(id);
            loadData();
        } catch {
            loadData(); // reload on error
        }
    };

    const openEdit = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        setFormTitle(task.title);
        setFormStart(task.startTime);
        setFormEnd(task.endTime);
        setFormCategory(task.category);
        setFormPriority(task.priority);
        setFormNotes(task.notes || '');
        setFormFocusScore(task.focusScore);
        setEditingTask(taskId);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormTitle('');
        setFormStart('09:00');
        setFormEnd('10:00');
        setFormCategory('work');
        setFormPriority(2);
        setFormNotes('');
        setFormFocusScore(undefined);
    };

    const targetMinutes = dailyGoal.targetHours * 60;
    const completionPercent = targetMinutes > 0 && dailyStats
        ? Math.min(100, Math.round((dailyStats.totalMinutes / targetMinutes) * 100))
        : 0;

    return (
        <div className="page-enter">
            <div className="page-container">
                {/* Header */}
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="page-title">{formatMonthYear(selectedDate)}</h1>
                        <p className="page-subtitle">
                            {isDateToday(selectedDate)
                                ? 'Today\'s Timeline'
                                : isDatePast(selectedDate)
                                    ? 'Past Timeline'
                                    : 'Future Timeline'}
                        </p>
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedDate(getToday())}
                        style={{ fontSize: '0.8rem' }}
                    >
                        Today
                    </button>
                </div>

                {/* Date Scroll Selector */}
                <div className="date-scroll" ref={dateScrollRef}>
                    {dates.map(date => (
                        <button
                            key={date}
                            className={`date-item ${date === selectedDate ? 'active' : ''} ${isDateToday(date) ? 'today' : ''} ${isDatePast(date) ? 'past' : ''}`}
                            onClick={() => setSelectedDate(date)}
                        >
                            <span className="date-day">{formatDayOfWeek(date)}</span>
                            <span className="date-num">{formatDayNumber(date)}</span>
                        </button>
                    ))}
                </div>

                {/* Stats Row */}
                {dailyStats && (
                    <div className="stats-grid" style={{ marginTop: 16 }}>
                        <motion.div
                            className="stat-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0 }}
                        >
                            <span className="stat-label">Total Time</span>
                            <span className="stat-value">{formatHoursDecimal(dailyStats.totalMinutes)}h</span>
                            <span className="stat-sub">{formatDuration(dailyStats.totalMinutes)}</span>
                        </motion.div>
                        <motion.div
                            className="stat-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <span className="stat-label">Tasks</span>
                            <span className="stat-value">
                                {dailyStats.completedTasks}/{dailyStats.totalTasks}
                            </span>
                            <span className="stat-sub">{Math.round(dailyStats.completionRate)}% complete</span>
                        </motion.div>
                        <motion.div
                            className="stat-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <span className="stat-label">Daily Goal</span>
                            <span className="stat-value" style={{ color: completionPercent >= 100 ? 'var(--success)' : 'var(--accent)' }}>
                                {completionPercent}%
                            </span>
                            <span className="stat-sub">of {dailyGoal.targetHours}h target</span>
                        </motion.div>
                        <motion.div
                            className="stat-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <span className="stat-label">Focus</span>
                            <span className="stat-value">{dailyStats.averageFocus > 0 ? dailyStats.averageFocus.toFixed(1) : '—'}</span>
                            <span className="stat-sub">avg score</span>
                        </motion.div>
                    </div>
                )}

                {/* Progress Bar */}
                <div style={{
                    background: 'var(--border-color)',
                    borderRadius: 999,
                    height: 6,
                    marginBottom: 24,
                    overflow: 'hidden'
                }}>
                    <motion.div
                        style={{
                            height: '100%',
                            background: `linear-gradient(90deg, var(--accent), #a78bfa)`,
                            borderRadius: 999,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>

                {/* Task List */}
                {isLoading ? (
                    <div className="timeline-list">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 80, marginBottom: 8 }} />
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">◎</div>
                        <div className="empty-title">No tasks for this day</div>
                        <div className="empty-desc">
                            Tap the + button to start building your timeline
                        </div>
                    </div>
                ) : (
                    <div className="timeline-list">
                        <AnimatePresence mode="popLayout">
                            {tasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`task-card ${task.completed ? 'completed' : ''}`}
                                    style={{ '--task-color': CATEGORY_COLORS[task.category] } as React.CSSProperties}
                                >
                                    <button
                                        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                                        onClick={() => handleToggle(task.id)}
                                    >
                                        {task.completed && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                style={{ color: 'white', fontSize: '0.75rem' }}
                                            >
                                                ✓
                                            </motion.span>
                                        )}
                                    </button>
                                    <div className="task-content">
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-meta">
                                            <span className="task-time">
                                                {formatTime(task.startTime)} — {formatTime(task.endTime)}
                                            </span>
                                            <span className="task-duration">{formatDuration(task.duration)}</span>
                                            <span
                                                className="task-category-badge"
                                                style={{
                                                    background: `${CATEGORY_COLORS[task.category]}22`,
                                                    color: CATEGORY_COLORS[task.category],
                                                }}
                                            >
                                                {CATEGORY_LABELS[task.category]}
                                            </span>
                                            <span
                                                className="task-priority-dot"
                                                style={{ background: PRIORITY_COLORS[task.priority] }}
                                                title={PRIORITY_LABELS[task.priority]}
                                            />
                                            {task.focusScore != null && (
                                                <span className="task-focus-badge">⚡ {task.focusScore}</span>
                                            )}
                                        </div>
                                        {task.notes && (
                                            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                                                {task.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="task-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task.id)}>
                                            ✎
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>
                                            ✕
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* FAB */}
                <motion.button
                    className="fab"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        resetForm();
                        setEditingTask(null);
                        setShowModal(true);
                    }}
                >
                    +
                </motion.button>

                {/* Modal */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowModal(false); setEditingTask(null); }}
                        >
                            <motion.div
                                className="modal"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <h2 className="modal-title">
                                    {editingTask ? 'Edit Task' : 'New Task'}
                                </h2>

                                <div className="form-group">
                                    <label className="label">Title</label>
                                    <input
                                        className="input"
                                        placeholder="What are you working on?"
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="label">Start Time</label>
                                        <input
                                            className="input"
                                            type="time"
                                            value={formStart}
                                            onChange={e => setFormStart(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">End Time</label>
                                        <input
                                            className="input"
                                            type="time"
                                            value={formEnd}
                                            onChange={e => setFormEnd(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {formStart && formEnd && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: 16, fontWeight: 500 }}>
                                        Duration: {formatDuration(calculateDuration(formStart, formEnd))}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="label">Category</label>
                                        <select
                                            className="input select"
                                            value={formCategory}
                                            onChange={e => setFormCategory(e.target.value as TaskCategory)}
                                        >
                                            {(Object.keys(CATEGORY_LABELS) as TaskCategory[]).map(cat => (
                                                <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Priority</label>
                                        <select
                                            className="input select"
                                            value={formPriority}
                                            onChange={e => setFormPriority(Number(e.target.value) as TaskPriority)}
                                        >
                                            {([1, 2, 3] as TaskPriority[]).map(p => (
                                                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">Focus Score (0-10)</label>
                                    <input
                                        className="input"
                                        type="number"
                                        min={0}
                                        max={10}
                                        placeholder="Optional"
                                        value={formFocusScore ?? ''}
                                        onChange={e => setFormFocusScore(e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Notes</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        placeholder="Optional notes..."
                                        value={formNotes}
                                        onChange={e => setFormNotes(e.target.value)}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => { setShowModal(false); setEditingTask(null); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={editingTask ? handleUpdateTask : handleCreateTask}
                                    >
                                        {editingTask ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
