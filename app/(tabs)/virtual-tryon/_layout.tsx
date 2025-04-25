import { Redirect, Stack, useNavigation } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { useScreenHistoryContext } from '@/common/providers/screen-history';
import { useEffect } from 'react';
export default function VirtualTryOnLayout() {

 


    // useEffect(() => {
    //     if (!isSignedIn) {
    //         const screenToRedirect = screenHistory[screenHistory.length - 1] || '(tabs)';
    //         return navigation.navigate("(tabs)/Try-On")
    //     }
    // }, [isSignedIn])

    

    return <Stack screenOptions={{ headerShown: false }} />
}