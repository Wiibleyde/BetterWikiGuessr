import { createContext } from 'react';

interface NavbarContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const NavbarContext = createContext<NavbarContextValue>({
    open: false,
    setOpen: () => { }
});

export default NavbarContext;