'use server';

import prisma from '@/lib/prisma';

export async function getDailyAnalytics(date: string) {
    const tasks = await prisma.task.findMany({ where: { date } });

    const totalMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const focusScores = tasks.filter(t => t.focusScore != null).map(t => t.focusScore!);
    const averageFocus = focusScores.length > 0
        ? focusScores.reduce((a, b) => a + b, 0) / focusScores.length
        : 0;

    const categories: Record<string, number> = {};
    tasks.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.duration;
    });

    return {
        date,
        totalMinutes,
        completedTasks,
        totalTasks,
        completionRate: Math.round(completionRate * 10) / 10,
        averageFocus: Math.round(averageFocus * 10) / 10,
        categories,
    };
}

export async function getMonthlyAnalytics(yearMonth: string) {
    const [year, month] = yearMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

    const tasks = await prisma.task.findMany({
        where: { date: { gte: startDate, lte: endDate } },
    });

    const totalMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;

    const dailyMap = new Map<string, number>();
    tasks.forEach(t => {
        dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.duration);
    });
    const activeDays = dailyMap.size;

    const dailyMinutes = Array.from(dailyMap.values());
    const avgDaily = dailyMinutes.length > 0
        ? dailyMinutes.reduce((a, b) => a + b, 0) / dailyMinutes.length
        : 0;

    // Consistency: std deviation of daily minutes (lower = more consistent)
    const variance = dailyMinutes.length > 1
        ? dailyMinutes.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / dailyMinutes.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = avgDaily > 0
        ? Math.max(0, Math.min(100, 100 - (stdDev / avgDaily) * 100))
        : 0;

    return {
        month: yearMonth,
        totalMinutes,
        totalTasks,
        completedTasks,
        activeDays,
        productivityTrend: 0,
        consistencyScore: Math.round(consistencyScore),
        averageDailyMinutes: Math.round(avgDaily),
    };
}

export async function getYearlyAnalytics(year: string) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const tasks = await prisma.task.findMany({
        where: { date: { gte: startDate, lte: endDate } },
    });

    const totalMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const activeDays = new Set(tasks.map(t => t.date)).size;

    return {
        year,
        totalMinutes,
        totalTasks,
        completedTasks,
        activeDays,
    };
}

export async function getStreakData(streakThreshold: number = 70) {
    const goals = await prisma.goal.findFirst({
        where: { type: 'daily' },
        orderBy: { updatedAt: 'desc' },
    });

    const targetMinutes = goals
        ? (goals.data as { targetHours?: number }).targetHours
            ? ((goals.data as { targetHours: number }).targetHours * 60)
            : 360
        : 360; // default 6 hours

    const thresholdMinutes = (targetMinutes * streakThreshold) / 100;

    const tasks = await prisma.task.findMany({
        orderBy: { date: 'desc' },
        select: { date: true, duration: true },
    });

    const dailyMap = new Map<string, number>();
    tasks.forEach(t => {
        dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.duration);
    });

    const sortedDates = Array.from(dailyMap.keys()).sort().reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let breaks = 0;
    let lastActiveDate: string | null = null;

    for (const date of sortedDates) {
        const minutes = dailyMap.get(date) || 0;
        if (minutes >= thresholdMinutes) {
            tempStreak++;
            if (!lastActiveDate) lastActiveDate = date;
        } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            if (currentStreak === 0 && tempStreak > 0) currentStreak = tempStreak;
            tempStreak = 0;
            breaks++;
        }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    if (currentStreak === 0) currentStreak = tempStreak;

    const totalActiveDays = sortedDates.filter(d => (dailyMap.get(d) || 0) >= thresholdMinutes).length;
    const recoveryRate = breaks > 0 ? (totalActiveDays / (totalActiveDays + breaks)) * 100 : 100;

    return {
        currentStreak,
        longestStreak,
        lastActiveDate,
        recoveryRate: Math.round(recoveryRate),
        totalActiveDays,
    };
}

export async function getHeatmapData(year: string) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const tasks = await prisma.task.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        select: { date: true, duration: true },
    });

    const dailyMap = new Map<string, number>();
    tasks.forEach(t => {
        dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.duration);
    });

    const maxMinutes = Math.max(...Array.from(dailyMap.values()), 1);

    return Array.from(dailyMap.entries()).map(([date, value]) => {
        const ratio = value / maxMinutes;
        let level: 0 | 1 | 2 | 3 | 4;
        if (ratio === 0) level = 0;
        else if (ratio < 0.25) level = 1;
        else if (ratio < 0.5) level = 2;
        else if (ratio < 0.75) level = 3;
        else level = 4;
        return { date, value, level };
    });
}

export async function getWeeklyPattern() {
    const tasks = await prisma.task.findMany({
        select: { date: true, duration: true, completed: true },
    });

    const dayStats: Record<number, { totalMinutes: number; totalTasks: number; days: Set<string> }> = {};
    for (let i = 0; i < 7; i++) {
        dayStats[i] = { totalMinutes: 0, totalTasks: 0, days: new Set() };
    }

    tasks.forEach(t => {
        const dayOfWeek = new Date(t.date).getDay();
        dayStats[dayOfWeek].totalMinutes += t.duration;
        dayStats[dayOfWeek].totalTasks += 1;
        dayStats[dayOfWeek].days.add(t.date);
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Object.entries(dayStats).map(([day, stats]) => {
        const numDays = Math.max(stats.days.size, 1);
        return {
            dayOfWeek: parseInt(day),
            dayName: dayNames[parseInt(day)],
            averageMinutes: Math.round(stats.totalMinutes / numDays),
            averageTasks: Math.round((stats.totalTasks / numDays) * 10) / 10,
            productivity: stats.totalMinutes,
        };
    });
}
