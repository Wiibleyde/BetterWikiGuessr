import { cn } from "@/utils/cn";

interface GuessInfosProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "found" | "close" | "notFound";
}

export default function GuessInfos({
    variant = "notFound",
    className,
    children,
    ...props
}: GuessInfosProps) {
    const variants = {
        close: "text-amber-500",
        found: "text-emerald-600",
        notFound: "text-red-400 line-through",
    };

    return (
        <span
            className={cn(
                "text-xs flex items-center gap-1",
                variants[variant],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
