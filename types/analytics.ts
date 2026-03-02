export interface DailyStats {
    date: string;
    totalMinutes: number;
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
    averageFocus: number;
    categories: Record<string, number>;
}

export interface MonthlyStats {
    month: string; // YYYY-MM
    totalMinutes: number;
    totalTasks: number;
    completedTasks: number;
    activeDays: number;
    productivityTrend: number;
    consistencyScore: number;
    averageDailyMinutes: number;
}

export interface YearlyStats {
    year: string;
    totalMinutes: number;
    totalTasks: number;
    completedTasks: number;
    activeDays: number;
    monthlyBreakdown: MonthlyStats[];
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    recoveryRate: number;
    totalActiveDays: number;
}

export interface WeeklyPattern {
    dayOfWeek: number; // 0-6
    dayName: string;
    averageMinutes: number;
    averageTasks: number;
    productivity: number;
}

export interface TimeOfDayPattern {
    hour: number;
    label: string;
    averageMinutes: number;
    frequency: number;
}

export interface BehavioralInsight {
    type: 'strength' | 'warning' | 'insight' | 'achievement';
    title: string;
    description: string;
    metric?: number;
    icon: string;
}

export interface HeatmapDay {
    date: string;
    value: number;
    level: 0 | 1 | 2 | 3 | 4;
}
