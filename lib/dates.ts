// Normalize any Firestore/JS timestamp into a Date or null
export function toDate(value: any): Date | null {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
    if (typeof value === 'number') return new Date(value);
    if (value instanceof Date) return value;
    return null;
}

// Display a date consistently (e.g. "Sep 5, 2025")
export function formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
