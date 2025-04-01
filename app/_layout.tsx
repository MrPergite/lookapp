import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot, SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { useColorScheme } from "@/hooks/useColorScheme";
import Toast from "react-native-toast-message";
import { OnBoardingContext, OnBoardingProvider } from "./(onboarding)/context";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <OnBoardingProvider>
          <Slot />
          <Toast
            position='bottom'
            bottomOffset={20}
          />
        </OnBoardingProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
