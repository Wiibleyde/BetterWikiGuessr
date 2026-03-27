import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "navbar" | "navbarActive";
}
export default function Button({
    children,
    className,
    variant = "primary",
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-indigo-700",
        secondary: "bg-red-500 text-gray-200 hover:text-white",
        navbar: "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
        navbarActive:
            "bg-gray-100 text-gray-900 hover:text-gray-800 hover:bg-gray-50",
    };

    return (
        <button
            className={cn(
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${variants[variant]}`,
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
