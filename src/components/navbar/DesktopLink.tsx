import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../../utils/cn";

interface DesktopLinkProps {
    href: string;
    label: string;
}

export default function DesktopLink({ href, label }: DesktopLinkProps) {

    const pathname = usePathname();

    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-500 hover:text-gray-800 hover:bg-gray-50",
                isActive && "bg-gray-100 text-gray-900",
            )}
        >
            {label}
        </Link>
    );
}
