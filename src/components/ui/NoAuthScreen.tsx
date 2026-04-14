import { useContext } from "react";
import LoginContext from "@/context/LoginContext";
import Button from "./Button";

const NoAuthScreen = () => {
    const { setShowLogin } = useContext(LoginContext);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-page gap-4 max-w-md text-center px-6 mx-auto">
            <span className="text-4xl mb-4 select-none">🔒</span>
            <h2 className="font-(family-name:--font-heading) text-2xl font-bold text-text mb-2">
                Connexion requise
            </h2>
            <p className="text-text-secondary text-lg">
                Connectez-vous pour voir votre profil et visualiser vos
                statistiques de jeu.
            </p>
            <Button
                type="button"
                onClick={() => setShowLogin(true)}
                variant="primary"
            >
                Connexion Discord
            </Button>
        </div>
    );
};

export default NoAuthScreen;
