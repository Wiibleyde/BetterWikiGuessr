"use client";

import Image from "next/image";
import { useState } from "react";
import { HINT_PENALTY } from "@/types/game";

interface ImageHintProps {
    imageCount: number;
    revealedImages: string[];
    revealingHint: boolean;
    won: boolean;
    onRevealHint: () => void;
}

export default function ImageHint({
    imageCount,
    revealedImages,
    revealingHint,
    won,
    onRevealHint,
}: ImageHintProps) {
    const [expanded, setExpanded] = useState(true);

    if (imageCount === 0) return null;

    const hintsUsed = revealedImages.length;
    const allRevealed = hintsUsed >= imageCount;
    const canReveal = !allRevealed && !won && !revealingHint;

    return (
        <div className="max-w-5xl mx-auto px-4 pt-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🖼️</span>
                        <span className="text-sm font-medium text-gray-700">
                            Indices images
                        </span>
                        <span className="text-xs text-gray-400">
                            ({hintsUsed}/{imageCount})
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {canReveal && (
                            <button
                                type="button"
                                onClick={onRevealHint}
                                disabled={revealingHint}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {revealingHint
                                    ? "…"
                                    : `Révéler une image (+${HINT_PENALTY} essais)`}
                            </button>
                        )}
                        {hintsUsed > 0 && (
                            <button
                                type="button"
                                onClick={() => setExpanded((prev) => !prev)}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {expanded ? "Masquer" : "Afficher"}
                            </button>
                        )}
                    </div>
                </div>

                {hintsUsed > 0 && expanded && (
                    <div className="p-4 flex flex-wrap gap-4">
                        {revealedImages.map((url, i) => (
                            <div
                                key={url}
                                className="relative rounded-lg overflow-hidden shadow-sm border border-gray-100 max-h-48"
                            >
                                <Image
                                    src={url}
                                    alt={`Indice ${i + 1}`}
                                    width={300}
                                    height={192}
                                    className="max-h-48 w-auto rounded-lg object-contain"
                                    unoptimized
                                />
                            </div>
                        ))}
                    </div>
                )}

                {hintsUsed === 0 && (
                    <div className="px-4 py-3 text-center">
                        <p className="text-xs text-gray-400">
                            Révélez des images de l&apos;article pour vous
                            aider. Chaque image ajoute {HINT_PENALTY} essais à
                            votre score.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
