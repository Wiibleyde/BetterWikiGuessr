import type { Player } from "@/types/game";

interface GuessWordProps {
    word: string;
    player?: Player;
    isFound: boolean;
    isClose: boolean;
}

export default function GuessWord({
    word,
    isFound,
    isClose,
    player,
}: GuessWordProps) {
    const wordClass = {
        found: "text-emerald-800",
        close: "text-amber-700",
        notFound: "text-red-400 line-through",
    };

    return (
        <div className="flex items-center gap-1 text-sm font-medium">
            {player && (
                <span className="text-gray-500">{player.displayName}:</span>
            )}
            <span
                className={
                    isFound
                        ? wordClass.found
                        : isClose
                          ? wordClass.close
                          : wordClass.notFound
                }
            >
                {word}
            </span>
        </div>
    );
}
