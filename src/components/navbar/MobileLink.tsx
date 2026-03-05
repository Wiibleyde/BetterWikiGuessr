import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import NavbarContext from "@/contexts/NavbarContext";
import { cn } from "../../../utils/cn";

interface MobileLinkProps {
    href: string;
    label: string;
}

const MobileLink = ({ href, label }: MobileLinkProps) => {
    const { setOpen } = useContext(NavbarContext);

    const pathname = usePathname();

    const isActive = pathname === href;

    return (
        <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-500 hover:text-gray-800 hover:bg-gray-50",
                isActive && "bg-gray-100 text-gray-900",
            )}
        >
            {label}
        </Link>
    );
};

export default MobileLink;
