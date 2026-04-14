"use client";

import { useClickAway } from "@uidotdev/usehooks";
import { useCallback, useEffect, useId } from "react";
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

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
    open,
    onClose,
    setOpen,
    title,
    subtitle,
    children,
}: ModalProps) {
    const titleId = useId();

    const ref = useClickAway<HTMLDivElement>(() => {
        setOpen(false);
    });

    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose],
    );

    useEffect(() => {
        if (!open) return;
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [open, handleEscape]);

    // Focus trap
    useEffect(() => {
        if (!open) return;
        const modal = ref.current;
        if (!modal) return;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            const focusable =
                modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener("keydown", handleTab);
        return () => document.removeEventListener("keydown", handleTab);
    }, [open, ref]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-100 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            aria-labelledby={titleId}
        >
            {/* Blurred backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                aria-hidden="true"
            />

            {/* Modal card */}
            <div
                className="relative z-10 w-full max-w-sm mx-4 bg-surface rounded-2xl shadow-2xl p-8 flex flex-col gap-6 animate-bounce-in"
                ref={ref}
            >
                {/* Close button */}
                <button
                    type="button"
                    aria-label="Fermer"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-text transition-colors cursor-pointer"
                >
                    <IoCloseSharp size={24} />
                </button>

                <div className="text-center">
                    <h2
                        id={titleId}
                        className="text-2xl font-extrabold text-text font-(family-name:--font-heading)"
                    >
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{subtitle}</p>
                </div>

                <div className="flex flex-col gap-3">{children}</div>
            </div>
        </div>,
        document.body,
    );
}
