"use client";
import { createContext } from "react";

interface LoginContextType {
    showLogin: boolean;
    setShowLogin: (value: boolean) => void;
}

const LoginContext = createContext<LoginContextType>({
    showLogin: false,
    setShowLogin: () => {},
});

export default LoginContext;
