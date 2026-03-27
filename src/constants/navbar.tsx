import { FaDiscord } from "react-icons/fa";
import type { LoginProvider } from "@/types/auth";

export const NAV_LINKS = [
    { href: "/", label: "Jouer" },
    { href: "/coop", label: "Co-op" },
    { href: "/historic", label: "Historique" },
    { href: "/leaderboard", label: "Classement" },
];

export const providers: LoginProvider[] = [
    {
        name: "discord",
        label: "Continuer avec Discord",
        icon: <FaDiscord />,
        className: "bg-[#5865F2] text-white hover:bg-[#4752c4]",
    },
];
