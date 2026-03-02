import { create } from 'zustand';
import { Task, TaskCategory, TaskPriority } from '@/types/task';

interface TaskState {
    tasks: Task[];
    selectedDate: string;
    isLoading: boolean;
    error: string | null;

    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    removeTask: (id: string) => void;
    toggleComplete: (id: string) => void;
    reorderTasks: (taskIds: string[]) => void;
    setSelectedDate: (date: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
    tasks: [],
    selectedDate: new Date().toISOString().split('T')[0],
    isLoading: false,
    error: null,

    setTasks: (tasks) => set({ tasks, isLoading: false }),

    addTask: (task) => set((state) => ({
        tasks: [...state.tasks, task].sort((a, b) => a.sortOrder - b.sortOrder),
    })),

    updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    })),

    removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id),
    })),

    toggleComplete: (id) => set((state) => ({
        tasks: state.tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ),
    })),

    reorderTasks: (taskIds) => set((state) => ({
        tasks: taskIds
            .map((id, index) => {
                const task = state.tasks.find(t => t.id === id);
                return task ? { ...task, sortOrder: index } : null;
            })
            .filter(Boolean) as Task[],
    })),

    setSelectedDate: (date) => set({ selectedDate: date }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
