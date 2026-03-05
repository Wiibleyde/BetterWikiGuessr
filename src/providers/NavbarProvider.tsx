"use client";
import type React from "react";
import { useState } from "react";
import NavbarContext from "@/contexts/NavbarContext";

interface NavbarProviderProps {
    children: React.ReactNode;
}

const NavbarProvider = ({ children }: NavbarProviderProps) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <NavbarContext.Provider value={{ open, setOpen }}>
            {children}
        </NavbarContext.Provider>
    );
};

export default NavbarProvider;
