import ErrorMessage from "./Error";
import Loader from "./Loader";
import NoDataMessage from "./NoDataMessage";

interface LayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    error?: string;
    isError?: boolean;
    isLoading?: boolean;
    loadingMessage?: string;
    noData?: boolean;
    noDataMessage?: string;
}
const Layout = ({
    title,
    subtitle,
    children,
    isLoading,
    isError = false,
    noData = false,
    loadingMessage = "Chargement en cours…",
    error = "Une erreur est survenue.",
    noDataMessage = "Aucune donnée disponible.",
}: LayoutProps) => {
    if (noData) return <NoDataMessage message={noDataMessage} />;

    if (isLoading) return <Loader message={loadingMessage} />;

    if (isError) return <ErrorMessage message={error} />;

    return (
        <div className="h-full bg-page text-text w-full">
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-fade-in">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-text font-(family-name:--font-heading)">
                        {title}
                    </h2>
                    <p className="text-sm text-muted mt-1">{subtitle}</p>
                </div>
                {children}
            </main>
        </div>
    );
};

export default Layout;
