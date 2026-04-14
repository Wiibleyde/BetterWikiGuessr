import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-page px-6">
            <div className="text-center max-w-md mx-auto">
                <div className="relative mb-8 select-none">
                    <span
                        className="block font-black leading-none text-subtle text-center"
                        style={{ fontSize: "9rem" }}
                    >
                        404
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-6xl drop-shadow-sm">🔍</span>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-text font-(family-name:--font-heading) mb-3 tracking-tight">
                    Page introuvable
                </h1>
                <p className="text-muted text-base leading-relaxed mb-8">
                    Cette page n&apos;existe pas ou a été déplacée. Revenez à
                    l&apos;accueil pour continuer à jouer !
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-primary/20"
                >
                    ← Retour à l&apos;accueil
                </Link>
            </div>
        </div>
    );
}
