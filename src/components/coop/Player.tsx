import Badge from "../ui/Badge";

interface PlayerProps {
    displayName: string;
    isLeader: boolean;
}

export default function Player({ displayName, isLeader }: PlayerProps) {
    return (
        <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">
                {displayName}
            </span>
            {isLeader && <Badge color="amber">Gérant de la partie</Badge>}
        </div>
    );
}
