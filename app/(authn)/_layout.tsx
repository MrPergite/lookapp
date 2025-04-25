import { Redirect, router, Stack, useNavigation } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { useScreenHistoryContext } from '@/common/providers/screen-history';
import { useEffect } from 'react';

export default function AuthRoutesLayout() {
    const { isSignedIn } = useAuth();
    const { screenHistory, removeScreenFromHistory } = useScreenHistoryContext();

    useEffect(() => {
        if (isSignedIn) {
            const screenToRedirect = screenHistory[screenHistory.length - 1] || null;
            if (screenToRedirect && screenToRedirect.startsWith('(tabs)')) {
                const redirectPath = `(tabs)/${screenToRedirect.split('(tabs)/')[1]}`;
                removeScreenFromHistory(screenToRedirect);
                router.replace(redirectPath as any);
            }
            else {
                router.replace('(tabs)/chat' as any);
            }
        }
    }, [isSignedIn, screenHistory, removeScreenFromHistory]);

    return <Stack screenOptions={{ headerShown: false }} />
}