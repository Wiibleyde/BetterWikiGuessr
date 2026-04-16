import { cn } from "@/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: "danger" | "success" | "warning" | "red" | "green" | "amber" | "primary";
}

export default function Badge({
    className,
    children,
    color = "success",
    ...props
}: BadgeProps) {
    const aliasMap: Record<string, string> = {
        red: "danger",
        green: "success",
        amber: "warning",
    };
    const resolved = aliasMap[color] ?? color;

    const colors: Record<string, string> = {
        danger: "bg-danger-light text-danger-text border border-danger/20",
        success: "bg-success-light text-success-text border border-success/20",
        warning: "bg-warning-light text-warning-text border border-warning/20",
        primary: "bg-primary-light text-primary-text border border-primary/20",
    };

    return (
        <span
            className={cn(
                `text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors[resolved]}`,
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
