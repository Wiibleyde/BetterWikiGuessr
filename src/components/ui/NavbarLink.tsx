import Link from "next/link";
import Button from "./Button";

interface NavbarLinkProps {
    href: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export default function NavbarLink({
    href,
    label,
    isActive,
    onClick,
}: NavbarLinkProps) {
    return (
        <Link key={href} href={href} onClick={onClick}>
            <Button
                className="w-full text-left md:w-auto md:text-center"
                variant={isActive ? "navbarActive" : "navbar"}
            >
                {label}
            </Button>
        </Link>
    );
}
