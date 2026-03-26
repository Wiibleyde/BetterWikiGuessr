interface GuessWordProps {
    word: string;
    isFound: boolean;
    isClose: boolean;
}

export default function GuessWord({ word, isFound, isClose }: GuessWordProps) {
    const wordClass = {
        found: "text-emerald-800",
        close: "text-amber-700",
        notFound: "text-red-400 line-through",
    };

    return (
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
    );
}
