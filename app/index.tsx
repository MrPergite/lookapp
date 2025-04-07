import { useEffect, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Slot, SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "react-native";


export function AuthRoutesLayout() {
    const { isSignedIn } = useAuth()

    if (isSignedIn) {
        return <Redirect href={'/'} />
    }

    return <Stack />
}

export default function IndexPage() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const [loaded] = useFonts({
        "default-regular": require("../assets/fonts/poppins/Poppins-Regular.ttf"),
        "default-medium": require("../assets/fonts/poppins/Poppins-Medium.ttf"),
        "default-semibold": require("../assets/fonts/poppins/Poppins-SemiBold.ttf"),
    });

    useEffect(() => {
        console.log({ isSignedIn })
        if (loaded && router) {
            SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
            router.replace("(tabs)"); // Navigate to signin if not authenticated
            // router.replace("(onboarding)")
        }
    }, [loaded, router]);

    return null;
}
