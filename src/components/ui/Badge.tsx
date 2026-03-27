import { cn } from "@/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: "red" | "green" | "amber";
}

export default function Badge({
    className,
    children,
    color = "green",
    ...props
}: BadgeProps) {
    const colors = {
        red: "bg-red-100 text-red-700",
        green: "bg-emerald-100 text-emerald-700",
        amber: "bg-amber-100 text-amber-700",
    };

    return (
        <span
            className={cn(
                `text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`,
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
