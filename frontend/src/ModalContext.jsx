import { createContext, useContext, useState } from "react";

const ModalContext = createContext();
export const ModalProvider = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalVissionToggler = () => {
        setIsModalOpen(prev => !prev)
    }

    return (
        <ModalContext.Provider
            value={{ isModalOpen, modalVissionToggler }}>
            {children}
        </ModalContext.Provider>
    )
}
export const useModal = () => useContext(ModalContext)