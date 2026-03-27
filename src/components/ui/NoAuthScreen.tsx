import { useAuth } from "@/hooks/useAuth";

const NoAuthScreen = () => {
    const { login } = useAuth();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
            <p className="text-gray-600 text-lg">
                Connectez-vous avec Discord pour voir vos statistiques.
            </p>
            <button
                type="button"
                onClick={login}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Connexion Discord
            </button>
        </div>
    );
};

export default NoAuthScreen;
