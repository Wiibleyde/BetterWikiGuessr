export const formatDateWithMonthName = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

export function toDateKey(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
