import Link from "next/link";

interface ErrorProps {
    message: string;
}

export default function ErrorMessage({ message }: ErrorProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center bg-page px-6">
            <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl select-none">⚠️</span>
                </div>

                <h2 className="text-2xl font-extrabold text-text mb-3 tracking-tight font-(family-name:--font-heading)">
                    Quelque chose s&apos;est mal passé
                </h2>

                <div
                    className="bg-danger-light/50 border border-danger/20 rounded-xl px-5 py-4 mb-8"
                    role="alert"
                >
                    <p className="text-danger-text font-mono text-sm wrap-break-word text-left">
                        {message}
                    </p>
                </div>

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
