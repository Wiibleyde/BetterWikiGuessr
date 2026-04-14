"use client";

import Link from "next/link";

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-page px-6">
            <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <span className="text-5xl select-none">🚫</span>
                </div>

                <h1 className="text-3xl font-extrabold text-text font-(family-name:--font-heading) mb-2 tracking-tight">
                    Une erreur s&apos;est produite
                </h1>
                <p className="text-muted text-sm mb-6">
                    Si le problème persiste, revenez à l&apos;accueil.
                </p>

                <div
                    className="bg-danger-light/50 border border-danger/20 rounded-xl px-5 py-4 mb-8 text-left"
                    role="alert"
                >
                    <p className="text-danger-text font-mono text-xs break-all leading-relaxed">
                        {error.message || "Erreur inconnue"}
                    </p>
                    {error.digest && (
                        <p className="text-danger/60 font-mono text-xs mt-2">
                            digest: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-2 bg-text hover:bg-text/80 text-surface font-semibold px-6 py-3 rounded-xl transition-colors"
                    >
                        ↻ Réessayer
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-primary/20"
                    >
                        ← Retour à l&apos;accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
