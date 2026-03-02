import { z } from 'zod';

export const TaskCategorySchema = z.enum([
    'work', 'study', 'health', 'personal', 'creative', 'social', 'general'
]);

export const RecurrenceTypeSchema = z.enum(['none', 'daily', 'weekly', 'monthly']);

export const TaskPrioritySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const TimeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)');

export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

export const CreateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    date: DateStringSchema,
    startTime: TimeStringSchema,
    endTime: TimeStringSchema,
    category: TaskCategorySchema,
    priority: TaskPrioritySchema,
    notes: z.string().max(1000).optional(),
    recurring: RecurrenceTypeSchema.optional(),
    focusScore: z.number().min(0).max(10).optional(),
}).refine(data => {
    const [sh, sm] = data.startTime.split(':').map(Number);
    const [eh, em] = data.endTime.split(':').map(Number);
    return (eh * 60 + em) > (sh * 60 + sm);
}, { message: 'End time must be after start time' });

export const UpdateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    date: DateStringSchema.optional(),
    startTime: TimeStringSchema.optional(),
    endTime: TimeStringSchema.optional(),
    category: TaskCategorySchema.optional(),
    priority: TaskPrioritySchema.optional(),
    completed: z.boolean().optional(),
    notes: z.string().max(1000).optional(),
    recurring: RecurrenceTypeSchema.optional(),
    focusScore: z.number().min(0).max(10).optional(),
    sortOrder: z.number().int().optional(),
});

export const DailyGoalSchema = z.object({
    targetHours: z.number().min(0.5).max(24),
    targetTasks: z.number().int().min(1).max(50),
    targetFocusBlocks: z.number().int().min(1).max(20).optional(),
});

export const MonthlyGoalSchema = z.object({
    targetHours: z.number().min(1).max(744),
    targetTasks: z.number().int().min(1).max(1500),
    targetActiveDays: z.number().int().min(1).max(31),
});

export const YearlyGoalSchema = z.object({
    targetHours: z.number().min(1).max(8760),
    categoryTargets: z.record(z.string(), z.number()).optional(),
});

export const SettingsSchema = z.object({
    theme: z.enum(['dark', 'light', 'system']),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    weekStart: z.enum(['monday', 'sunday']),
    streakThreshold: z.number().int().min(10).max(100),
    dailyResetTime: TimeStringSchema,
    privacyMode: z.boolean(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
