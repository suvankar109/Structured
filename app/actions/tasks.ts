'use server';

import prisma from '@/lib/prisma';
import { calculateDuration } from '@/lib/date-utils';

export async function getTasks(date: string) {
    const tasks = await prisma.task.findMany({
        where: { date },
        orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }],
    });
    return tasks.map(t => ({
        ...t,
        priority: t.priority as 1 | 2 | 3,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));
}

export async function getTasksByDateRange(startDate: string, endDate: string) {
    const tasks = await prisma.task.findMany({
        where: {
            date: { gte: startDate, lte: endDate },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return tasks.map(t => ({
        ...t,
        priority: t.priority as 1 | 2 | 3,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));
}

export async function createTask(data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    category: string;
    priority: number;
    notes?: string;
    recurring?: string;
    focusScore?: number;
}) {
    const duration = calculateDuration(data.startTime, data.endTime);
    const maxOrder = await prisma.task.aggregate({
        where: { date: data.date },
        _max: { sortOrder: true },
    });

    const task = await prisma.task.create({
        data: {
            ...data,
            duration,
            sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        },
    });

    return {
        ...task,
        priority: task.priority as 1 | 2 | 3,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
}

export async function updateTask(id: string, data: {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    category?: string;
    priority?: number;
    completed?: boolean;
    notes?: string;
    recurring?: string;
    focusScore?: number;
    sortOrder?: number;
}) {
    const updateData: Record<string, unknown> = { ...data };

    if (data.startTime && data.endTime) {
        updateData.duration = calculateDuration(data.startTime, data.endTime);
    } else if (data.startTime || data.endTime) {
        const existing = await prisma.task.findUnique({ where: { id } });
        if (existing) {
            const start = data.startTime || existing.startTime;
            const end = data.endTime || existing.endTime;
            updateData.duration = calculateDuration(start, end);
        }
    }

    const task = await prisma.task.update({
        where: { id },
        data: updateData,
    });

    return {
        ...task,
        priority: task.priority as 1 | 2 | 3,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
    };
}

export async function deleteTask(id: string) {
    await prisma.task.delete({ where: { id } });
    return { success: true };
}

export async function toggleTaskComplete(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new Error('Task not found');

    const updated = await prisma.task.update({
        where: { id },
        data: { completed: !task.completed },
    });

    return {
        ...updated,
        priority: updated.priority as 1 | 2 | 3,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
    };
}

export async function reorderTasks(taskIds: string[]) {
    const updates = taskIds.map((id, index) =>
        prisma.task.update({
            where: { id },
            data: { sortOrder: index },
        })
    );
    await prisma.$transaction(updates);
    return { success: true };
}
