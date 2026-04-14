import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Mentions légales — Wiki Guessr",
    description: "Mentions légales du site WikiGuessr.",
};

export default function MentionsLegalesPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-extrabold text-text font-(family-name:--font-heading) mb-2">
                Mentions légales
            </h1>
            <p className="text-muted text-sm mb-10">
                Informations légales relatives au site WikiGuessr.
            </p>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-text font-(family-name:--font-heading) border-b border-border pb-2 mb-4">
                    Éditeurs du site
                </h2>
                <p className="text-text-secondary mb-4">
                    Ce site est co-édité par :
                </p>
                <ul className="space-y-3 text-text-secondary">
                    <li>
                        <span className="font-semibold text-text">
                            Nathan Bonnell
                        </span>
                        {" — "}
                        <Link
                            href="https://nathan.bonnell.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            nathan.bonnell.fr
                        </Link>
                        {" · "}
                        <a
                            href="mailto:nathan@bonnell.fr"
                            className="text-primary hover:underline"
                        >
                            nathan@bonnell.fr
                        </a>
                    </li>
                    <li>
                        <span className="font-semibold text-text">
                            Mathéo Lang
                        </span>
                        {" — "}
                        <Link
                            href="https://matheolang.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            matheolang.fr
                        </Link>
                    </li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-text font-(family-name:--font-heading) border-b border-border pb-2 mb-4">
                    Hébergement
                </h2>
                <p className="text-text-secondary">
                    Le site est hébergé sur un serveur personnel géré par Nathan
                    Bonnell. Le nom de domaine{" "}
                    <span className="font-semibold text-text">
                        wikiguessr.bonnell.fr
                    </span>{" "}
                    est enregistré chez OVH.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-text font-(family-name:--font-heading) border-b border-border pb-2 mb-4">
                    Technologies utilisées
                </h2>
                <p className="text-text-secondary">
                    WikiGuessr est développé avec Next.js, React, TypeScript,
                    Tailwind CSS et Prisma. Le code source est disponible sur{" "}
                    <Link
                        href="https://github.com/Wiibleyde/WikiGuessr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        GitHub
                    </Link>
                    .
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-text font-(family-name:--font-heading) border-b border-border pb-2 mb-4">
                    Propriété intellectuelle
                </h2>
                <p className="text-text-secondary mb-3">
                    Les contenus originaux de ce site (code source, textes,
                    graphismes) sont la propriété de Nathan Bonnell et Mathéo
                    Lang, sauf mention contraire.
                </p>
                <p className="text-text-secondary">
                    Les articles affichés dans le jeu sont issus de{" "}
                    <Link
                        href="https://fr.wikipedia.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Wikipédia
                    </Link>{" "}
                    et sont soumis à la licence{" "}
                    <Link
                        href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Creative Commons Attribution-Partage dans les Mêmes
                        Conditions 4.0 (CC BY-SA 4.0)
                    </Link>
                    .
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-text font-(family-name:--font-heading) border-b border-border pb-2 mb-4">
                    Données personnelles
                </h2>
                <p className="text-text-secondary mb-3">
                    WikiGuessr propose une authentification optionnelle via
                    Discord permettant de sauvegarder la progression et
                    d&apos;accéder aux classements. Les données collectées dans
                    ce cadre sont limitées aux informations nécessaires au
                    fonctionnement du service.
                </p>
                <p className="text-text-secondary">
                    Pour toute demande relative à vos données personnelles, vous
                    pouvez contacter les éditeurs à l&apos;adresse{" "}
                    <a
                        href="mailto:nathan@bonnell.fr"
                        className="text-primary hover:underline"
                    >
                        nathan@bonnell.fr
                    </a>
                    .
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-text font-(family-name:--font-heading) border-b border-border pb-2 mb-4">
                    Responsabilité
                </h2>
                <p className="text-text-secondary">
                    Les éditeurs s&apos;efforcent d&apos;assurer
                    l&apos;exactitude des informations publiées, mais ne
                    sauraient être tenus responsables des erreurs ou omissions,
                    ni de l&apos;utilisation qui en est faite par les
                    utilisateurs.
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-bold text-text font-(family-name:--font-heading) border-b border-border pb-2 mb-4">
                    Droit applicable
                </h2>
                <p className="text-text-secondary">
                    Les présentes mentions légales sont soumises au droit
                    français. En cas de litige, les tribunaux français seront
                    seuls compétents.
                </p>
            </section>

            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors"
            >
                <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
                Retour à l&apos;accueil
            </Link>
        </div>
    );
}
