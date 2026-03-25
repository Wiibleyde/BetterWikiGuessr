interface StatCardProps {
    label: string;
    value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
}