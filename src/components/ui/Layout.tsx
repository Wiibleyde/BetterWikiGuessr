interface LayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}
const Layout = ({ title, subtitle, children }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-stone-50 text-gray-900 w-full">
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                </div>
                {children}
            </main>
        </div>
    );
};

export default Layout;
