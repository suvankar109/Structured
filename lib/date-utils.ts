import {
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    eachMonthOfInterval,

    addDays,
    subDays,
    isToday,
    isBefore,
    isAfter,
    isSameDay,
    getDay,
} from 'date-fns';

export {
    format,
    parseISO,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    eachMonthOfInterval,
    addDays,
    subDays,
    isToday,
    isBefore,
    isAfter,
    isSameDay,
    getDay,
};

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM d, yyyy');
}

export function formatDayOfWeek(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEE');
}

export function formatDayNumber(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'd');
}

export function formatMonth(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMMM');
}

export function formatMonthYear(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMMM yyyy');
}

export function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function calculateDuration(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
}

export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export function formatHoursDecimal(minutes: number): string {
    return (minutes / 60).toFixed(1);
}

export function getToday(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentMonth(): string {
    return format(new Date(), 'yyyy-MM');
}

export function getCurrentYear(): string {
    return format(new Date(), 'yyyy');
}

export function getDaysInMonth(yearMonth: string): string[] {
    const date = parseISO(`${yearMonth}-01`);
    return eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date),
    }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getDaysAroundDate(date: string, range: number = 15): string[] {
    const center = parseISO(date);
    return eachDayOfInterval({
        start: subDays(center, range),
        end: addDays(center, range),
    }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getMonthsInYear(year: string): string[] {
    const date = parseISO(`${year}-01-01`);
    return eachMonthOfInterval({
        start: startOfYear(date),
        end: endOfYear(date),
    }).map(d => format(d, 'yyyy-MM'));
}

export function isDateToday(date: string): boolean {
    return isToday(parseISO(date));
}

export function isDatePast(date: string): boolean {
    return isBefore(parseISO(date), new Date()) && !isToday(parseISO(date));
}

export function isDateFuture(date: string): boolean {
    return isAfter(parseISO(date), new Date());
}

export function getDayName(dayIndex: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
}
