export const plural = (count: number, singular: string, plural: string) => {
    return `${count} ${count < 2 ? singular : plural}`;
};