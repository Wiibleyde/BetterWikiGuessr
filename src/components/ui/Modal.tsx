"use client";

import { useClickAway } from "@uidotdev/usehooks";
import { createPortal } from "react-dom";
import { IoCloseSharp } from "react-icons/io5";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    setOpen: (open: boolean) => void;
    title: string;
    subtitle: string;
    children?: React.ReactNode;
}

export default function Modal({
    open,
    onClose,
    setOpen,
    title,
    subtitle,
    children,
}: ModalProps) {
    const ref = useClickAway<HTMLDivElement>(() => {
        setOpen(false);
    });

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
                aria-hidden="true"
            />

            {/* Modal card */}
            <div
                className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6"
                ref={ref}
            >
                {/* Close button */}
                <IoCloseSharp
                    size={24}
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                />

                <div className="text-center">
                    <h2 className="text-2xl font-extrabold text-gray-900">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                </div>

                <div className="flex flex-col gap-3">{children}</div>
            </div>
        </div>,
        document.body,
    );
}
