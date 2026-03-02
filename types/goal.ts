export interface DailyGoal {
    targetHours: number;
    targetTasks: number;
    targetFocusBlocks?: number;
}

export interface MonthlyGoal {
    targetHours: number;
    targetTasks: number;
    targetActiveDays: number;
}

export interface YearlyGoal {
    targetHours: number;
    categoryTargets?: Record<string, number>;
}

export interface GoalRecord {
    id: string;
    type: 'daily' | 'monthly' | 'yearly';
    period: string;
    data: DailyGoal | MonthlyGoal | YearlyGoal;
    createdAt: string;
    updatedAt: string;
}

export const DEFAULT_DAILY_GOAL: DailyGoal = {
    targetHours: 6,
    targetTasks: 8,
    targetFocusBlocks: 4,
};

export const DEFAULT_MONTHLY_GOAL: MonthlyGoal = {
    targetHours: 120,
    targetTasks: 160,
    targetActiveDays: 22,
};

export const DEFAULT_YEARLY_GOAL: YearlyGoal = {
    targetHours: 1440,
};
