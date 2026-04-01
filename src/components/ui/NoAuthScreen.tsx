import { useContext } from "react";
import LoginContext from "@/context/LoginContext";
import Button from "./Button";

const NoAuthScreen = () => {
    const { setShowLogin } = useContext(LoginContext);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
            <p className="text-gray-600 text-lg">
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
