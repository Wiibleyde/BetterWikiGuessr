export const formatDateWithMonthName = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};