import { useContext, useState } from "react";
import { createContext } from "react";

export type ScreenHistoryContextType = {
    screenHistory: string[];
    setScreenHistory: (history: string[]) => void;
    addScreenToHistory: (screen: string) => void;
    removeScreenFromHistory: (screen: string) => void;
    clearScreenHistory: () => void;
}


const ScreenHistoryContext = createContext<ScreenHistoryContextType | {}>({});

export const useScreenHistoryContext = () => {
    return useContext(ScreenHistoryContext) as ScreenHistoryContextType;
};

export const ScreenHistoryProvider = ({ children }: { children: React.ReactNode }) => {
    const [screenHistory, setScreenHistory] = useState<string[]>([]);

    const addScreenToHistory = (screen: string) => {
        setScreenHistory((prevHistory) => [...prevHistory, screen]);
    };

    const removeScreenFromHistory = (screen: string) => {
        setScreenHistory((prevHistory) => prevHistory.filter((s) => s !== screen));
        return screen
    };

    const clearScreenHistory = () => {
        setScreenHistory([]);
    };

    return (
        <ScreenHistoryContext.Provider value={{ screenHistory, setScreenHistory, addScreenToHistory, removeScreenFromHistory, clearScreenHistory }}>
            {children}
        </ScreenHistoryContext.Provider>
    );
}