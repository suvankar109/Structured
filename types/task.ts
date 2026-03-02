export type TaskCategory =
    | 'work'
    | 'study'
    | 'health'
    | 'personal'
    | 'creative'
    | 'social'
    | 'general';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export type TaskPriority = 1 | 2 | 3;

export interface Task {
    id: string;
    title: string;
    date: string; // ISO date YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    duration: number; // minutes
    category: TaskCategory;
    priority: TaskPriority;
    completed: boolean;
    focusScore?: number;
    notes?: string;
    recurring?: RecurrenceType;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskInput {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    category: TaskCategory;
    priority: TaskPriority;
    notes?: string;
    recurring?: RecurrenceType;
    focusScore?: number;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
    completed?: boolean;
    sortOrder?: number;
}

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
    work: '#6366f1',
    study: '#8b5cf6',
    health: '#10b981',
    personal: '#f59e0b',
    creative: '#ec4899',
    social: '#06b6d4',
    general: '#64748b',
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
    work: 'Work',
    study: 'Study',
    health: 'Health',
    personal: 'Personal',
    creative: 'Creative',
    social: 'Social',
    general: 'General',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
    1: 'High',
    2: 'Medium',
    3: 'Low',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
    1: '#ef4444',
    2: '#f59e0b',
    3: '#6b7280',
};
