import { forwardRef } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => (
        <input
            type="text"
            className={cn(
                "min-w-0 flex-1 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 border-gray-300",
                className,
            )}
            ref={ref}
            {...props}
        />
    ),
);
Input.displayName = "Input";
export default Input;
