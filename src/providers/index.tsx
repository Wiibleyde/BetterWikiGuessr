import NavbarProvider from "./NavbarProvider";

interface ProvidersProps {
    children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
    return (
        <NavbarProvider>
            {children}
        </NavbarProvider>
    )
}

export default Providers