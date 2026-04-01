"use client";
import { useState } from "react";
import LoginContext from "@/context/LoginContext";

interface LoginProviderProps {
    children: React.ReactNode;
}

const LoginProvider = ({ children }: LoginProviderProps) => {
    const [showLogin, setShowLogin] = useState<boolean>(false);

    return (
        <LoginContext.Provider value={{ showLogin, setShowLogin }}>
            {children}
        </LoginContext.Provider>
    );
};

export default LoginProvider;
