'use server';

import prisma from '@/lib/prisma';

export async function getGoal(type: string, period: string) {
    const goal = await prisma.goal.findUnique({
        where: { type_period: { type, period } },
    });
    if (!goal) return null;
    return {
        ...goal,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    };
}

export async function upsertGoal(type: string, period: string, data: Record<string, unknown>) {
    const goal = await prisma.goal.upsert({
        where: { type_period: { type, period } },
        update: { data: data as object },
        create: { type, period, data: data as object },
    });
    return {
        ...goal,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
    };
}

export async function getSettings() {
    let settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (!settings) {
        settings = await prisma.settings.create({
            data: { id: 'default' },
        });
    }
    return {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
    };
}

export async function updateSettings(data: {
    theme?: string;
    accentColor?: string;
    weekStart?: string;
    streakThreshold?: number;
    dailyResetTime?: string;
    privacyMode?: boolean;
}) {
    const settings = await prisma.settings.upsert({
        where: { id: 'default' },
        update: data,
        create: { id: 'default', ...data },
    });
    return {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
    };
}
