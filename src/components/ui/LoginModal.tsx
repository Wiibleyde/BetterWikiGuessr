"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

export interface LoginProvider {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    className?: string;
}

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
    providers: LoginProvider[];
}

export default function LoginModal({
    open,
    onClose,
    providers,
}: LoginModalProps) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            aria-label="Connexion"
        >
            {/* Blurred backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal card */}
            <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    aria-label="Fermer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-2xl font-extrabold text-gray-900">
                        Se connecter
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Choisissez un fournisseur pour continuer
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {providers.map((provider) => (
                        <button
                            key={provider.id}
                            type="button"
                            onClick={() => {
                                provider.onClick();
                                onClose();
                            }}
                            className={cn(
                                "flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95",
                                provider.className,
                            )}
                        >
                            {provider.icon}
                            {provider.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    );
}
