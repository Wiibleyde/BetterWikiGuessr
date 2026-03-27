import type { AuthUser } from "@/types/auth";
import Button from "../ui/Button";
import UserMenu from "./UserMenu";

interface NavbarAuthProps {
    user: AuthUser | null;
    loading: boolean;
    onOpenLoginModal: () => void;
    mobile?: boolean;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function NavbarAuth({
    user,
    loading,
    onOpenLoginModal,
    mobile = false,
    open,
    setOpen,
}: NavbarAuthProps) {
    if (loading) return null;

    if (user) {
        return <UserMenu user={user} onNavigate={() => setOpen(!open)} />;
    }

    return (
        <Button
            onClick={onOpenLoginModal}
            variant="primary"
            className={mobile ? "w-full" : ""}
        >
            Connexion
        </Button>
    );
}
