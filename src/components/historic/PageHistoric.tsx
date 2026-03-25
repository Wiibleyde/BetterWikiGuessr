import Link from "next/link";
import type { PageEntry } from "@/types/historic";
import { formatDateWithMonthName } from "@/utils/date";

export default function PageHistoric({ page }: { page: PageEntry }) {

    return (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 gap-4">
            <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-400">
                    {formatDateWithMonthName(page.date)}
                </span>
                <span className="text-sm font-medium text-gray-800 truncate">
                    {page.title}
                </span>
            </div>
            {page.url !== "" && (
                <Link
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Voir l'article
                </Link>
            )}
        </div>
    );
}
