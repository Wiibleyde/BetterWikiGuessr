interface ProgressBarProps {
    percentage: number;
}

export default function ProgressBar({ percentage }: ProgressBarProps) {
    return (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
