import { create } from 'zustand';
import { DailyGoal, MonthlyGoal, YearlyGoal, DEFAULT_DAILY_GOAL, DEFAULT_MONTHLY_GOAL, DEFAULT_YEARLY_GOAL } from '@/types/goal';

interface GoalState {
    dailyGoal: DailyGoal;
    monthlyGoal: MonthlyGoal;
    yearlyGoal: YearlyGoal;
    isLoading: boolean;

    setDailyGoal: (goal: DailyGoal) => void;
    setMonthlyGoal: (goal: MonthlyGoal) => void;
    setYearlyGoal: (goal: YearlyGoal) => void;
    setLoading: (loading: boolean) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
    dailyGoal: DEFAULT_DAILY_GOAL,
    monthlyGoal: DEFAULT_MONTHLY_GOAL,
    yearlyGoal: DEFAULT_YEARLY_GOAL,
    isLoading: false,

    setDailyGoal: (dailyGoal) => set({ dailyGoal }),
    setMonthlyGoal: (monthlyGoal) => set({ monthlyGoal }),
    setYearlyGoal: (yearlyGoal) => set({ yearlyGoal }),
    setLoading: (isLoading) => set({ isLoading }),
}));
