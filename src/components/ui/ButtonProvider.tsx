import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

interface ButtonProviderProps {
    name: string;
    label: string;
    icon: React.ReactNode;
    className?: string;
    onClose: () => void;
}

export default function ButtonProvider({
    name,
    label,
    icon,
    className,
    onClose,
}: ButtonProviderProps) {
    const { login } = useAuth();

    const handleClick = () => {
        login(name);
        onClose();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                "flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-95",
                className,
            )}
        >
            {icon}
            {label}
        </button>
    );
}
