import { useEffect, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Slot, SplashScreen, Stack } from "expo-router";
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts as useRoboto, Roboto_400Regular } from '@expo-google-fonts/roboto';
import * as Updates from 'expo-updates';
import { Alert } from "react-native";
import 'react-native-get-random-values';



export function useAppFonts() {
    const [interLoaded] = useInter({ 'default-regular': Inter_400Regular, 'default-medium': Inter_500Medium, 'default-semibold': Inter_600SemiBold, 'default-bold': Inter_700Bold });
    const [robotoLoaded] = useRoboto({ 'default-secondary': Roboto_400Regular });

    return interLoaded && robotoLoaded;
}


export default function IndexPage() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const fontsLoaded = useAppFonts();

    useEffect(() => {
        async function checkForUpdate() {
            try {
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    await Updates.fetchUpdateAsync();
                    Alert.alert(
                        'Update available',
                        'Restarting app to apply update...',
                        [{ text: 'OK', onPress: () => Updates.reloadAsync() }]
                    );
                }
            } catch (e) {
                console.log('Update check failed:', e);
            }
        }

        checkForUpdate();
    }, []);


    useEffect(() => {
        console.log({ isSignedIn, fontsLoaded })
        if (fontsLoaded) {
            SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
            router.replace("(tabs)"); // Navigate to signin if not authenticated
        }
    }, [fontsLoaded]);

    return null;
}
