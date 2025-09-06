export const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export const COLORS = {
    primary: '#1E67A2',
    soft: '#A0BBD6',
    cardHeaderBg: '#EDF2FA',
    border: '#A0BBD6',
};
