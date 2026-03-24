"use client";

import Image from "next/image";
import Link from "next/link";
import type { AuthUser } from "@/types/auth";

interface UserMenuProps {
    user: AuthUser;
    onLogout: () => void;
    onNavigate?: () => void;
}

export default function UserMenu({
    user,
    onLogout,
    onNavigate,
}: UserMenuProps) {
    return (
        <div className="flex items-center gap-3">
            {user.image && (
                <Image
                    src={user.image}
                    alt=""
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full"
                />
            )}
            <Link
                href="/profile"
                onClick={onNavigate}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
                {user.name}
            </Link>
            <button
                type="button"
                onClick={() => {
                    onLogout();
                    onNavigate?.();
                }}
                className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
                Déconnexion
            </button>
        </div>
    );
}
