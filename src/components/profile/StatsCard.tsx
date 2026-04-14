interface StatCardProps {
    label: string;
    value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
    return (
        <div className="bg-surface rounded-xl border border-border hover:border-primary/30 transition-colors p-4 text-center">
            <p className="text-2xl font-bold text-text font-(family-name:--font-heading)">
                {value}
            </p>
            <p className="text-xs text-muted mt-1">{label}</p>
        </div>
    );
}
