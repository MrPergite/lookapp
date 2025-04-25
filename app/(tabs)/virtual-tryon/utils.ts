import { ScreenHistoryContextType, useScreenHistoryContext } from "@/common/providers/screen-history";
import { router } from "expo-router";

export const withAuthScreenHistory = () => {
    return (screenName: string) => {
        const { addScreenToHistory } = useScreenHistoryContext();
        addScreenToHistory(screenName);
        router.push(screenName as any);
    };
};

export const redirectToSignIn = (addScreenToHistory: (screenName: string) => void) => {
    const screenName = '(tabs)/virtual-tryon';
    addScreenToHistory(screenName);
    router.push('/(authn)/signin' as any);
}

export const redirectToSignUp = (addScreenToHistory: (screenName: string) => void) => {
    const screenName = '(tabs)/virtual-tryon';
    addScreenToHistory(screenName);
    router.push('/(authn)/signup' as any);
}