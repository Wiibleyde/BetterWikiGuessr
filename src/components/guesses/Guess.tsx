import { CLOSE_THRESHOLD } from "@/constants/game";
import type { ProximityReasonType, StoredGuess } from "@/types/game";
import GuessInfos from "./GuessInfos";
import GuessWord from "./GuessWord";

interface GuessProps {
    guess: StoredGuess;
}

const PROXIMITY_ICONS: Record<ProximityReasonType, string> = {
    transposition: "🔄",
    insertion: "➕",
    deletion: "➖",
    substitution: "🔤",
    mixed: "✏️",
};

export default function Guess({ guess }: GuessProps) {
    const isClose = !guess.found && (guess.similarity ?? 0) >= CLOSE_THRESHOLD;

    console.log("Rendering guess:", guess.proximityReason);

    return (
        <div
            className={[
                "flex items-center justify-between px-4 py-1.5 text-sm",
                guess.found
                    ? "bg-emerald-50/60"
                    : isClose
                      ? "bg-amber-50/60"
                      : "bg-red-50/60",
            ].join(" ")}
        >
            <GuessWord
                word={guess.word}
                isFound={guess.found}
                isClose={isClose}
            />

            <GuessInfos
                variant={guess.found ? "found" : isClose ? "close" : "notFound"}
            >
                {guess.found
                    ? `x${guess.occurrences}`
                    : isClose
                      ? `${guess.proximityReason?.description} ${PROXIMITY_ICONS[guess.proximityReason?.type || "mixed"] || ""}`
                      : ""}
            </GuessInfos>
        </div>
    );
}
