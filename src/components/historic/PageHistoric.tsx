import Link from "next/link";
import type { PageEntry } from "@/types/historic";
import { formatDateWithMonthName } from "@/utils/date";
import { plural } from "@/utils/helper";
import Button from "../ui/Button";

export default function HistoricalPageEntry({ page }: { page: PageEntry }) {
    return (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 gap-4">
            <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-400">
                    {formatDateWithMonthName(page.date)} - {" "}
                    {plural(
                        page.resolvedCount,
                        "joueur a trouvé ce mot",
                        "joueurs ont trouvé ce mot",
                    )}
                </span>
                <span className="text-sm font-medium text-gray-800 truncate">
                    {page.title}
                </span>
            </div>
            <Link href={page.url} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" disabled={page.url === ""}>
                    Lien de la page
                </Button>
            </Link>
        </div>
    );
}
