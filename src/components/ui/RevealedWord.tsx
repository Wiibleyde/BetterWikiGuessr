import { cn } from "@/utils/cn";

const VARIANTS = {
    articleTitle: "bg-amber-200 text-amber-900 font-bold",
    default: "bg-emerald-100 text-emerald-900",
} as const;

type RevealedWordVariant = keyof typeof VARIANTS;

interface RevealedWordProps {
    text: string;
    variant?: RevealedWordVariant;
}

const RevealedWord = ({
    text,
    variant = "default",
}: RevealedWordProps) => {
    return (
        <span
            className={cn(
                "inline-block px-0.5 rounded transition-all duration-300",
                VARIANTS[variant]
            )}
        >
            {text}
        </span>
    );
}

export default RevealedWord