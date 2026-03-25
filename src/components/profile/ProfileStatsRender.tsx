import StatCard from "./StatsCard";

interface ProfileStatsProps {
    stats: {
        label: string;
        value: string | number;
    }[];
}


export default function ProfileStatsRender({
    stats
}: ProfileStatsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {stats.map((stat) => (
                <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                />
            ))}
        </div>
    )
}