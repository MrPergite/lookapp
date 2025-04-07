import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import React from "react";
import "react-native-reanimated";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "@/components/ThemedText";
import { SafeAreaView, View, StyleSheet, Text, Button } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/styles/theme";
import * as Haptics from "expo-haptics";
import ChatScreen from "../(home)/chat-products";
import Toast from "react-native-toast-message";
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabHeader } from "@/components/tab-header";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
//Poppins-Medium

// Define the param types for our tabs
type TabParamList = {
    Home: { headerProps?: object };
    'Virtual TryOn': { headerProps?: object };
};

export default function RootLayout() {
    const { signOut, isSignedIn } = useAuth()
    const colorScheme = useColorScheme();

    const Tab = createBottomTabNavigator<TabParamList>();

    const ProfileScreen = () => (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>🎉 coming soon</Text>
        </View>
    );

    const handleLogOut = async () => {
        if (isSignedIn) {
            try {
                await signOut();
                Toast.show({
                    type: "success",
                    text1: "See you soon :)"
                })
            }
            catch (e) {

            }
        }
        else {
            router.replace("/(authn)/signin")
        }
    }

    const logOutText = isSignedIn ? "LOG OUT" : "SIGN IN"

    return (
        <>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        let iconName: 'home' | 'person' = route.name === "Home" ? "home" : "person";
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: theme.colors.primary.purple,
                    tabBarInactiveTintColor: "gray",
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: colorScheme === "dark" ? theme.colors.secondary.black : theme.colors.primary.white,
                    },
                })}
                screenListeners={{
                    tabPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    },
                }}
            >
                <Tab.Screen
                    options={({ route, navigation }) => {
                        // Default header props
                        const defaultHeaderProps = {
                            headerShown: true,
                            headerTitle: "",
                            header: () => <TabHeader isLogin={isSignedIn} title="LookAI" label={logOutText} onLogout={handleLogOut} />,
                        };

                        // If the component exposes headerProps, merge them with defaults
                        const { params } = route;
                        if (params && params.headerProps) {
                            return { ...defaultHeaderProps, ...params.headerProps };
                        }

                        return defaultHeaderProps;
                    }}
                    name="Home"
                    component={ChatScreen}
                />
                <Tab.Screen
                    name="Virtual TryOn"
                    component={ProfileScreen}
                    options={({ route }) => {
                        const { params } = route;
                        if (params && params.headerProps) {
                            return params.headerProps;
                        }
                        return {};
                    }}
                />
            </Tab.Navigator>
            {/* <StatusBar style="light" /> */}
        </>
    );
}
const styles = StyleSheet.create({
    header: {
        fontFamily: "default-medium",
    },
    chatHeader: {
        padding: theme.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "transparent",
        borderColor: theme.colors.secondary.mediumGray,
        borderBottomWidth: 0.5
    },
    logOutButton: {
        fontFamily: "default-medium",
        color: theme.colors.secondary.black
    },
    headerLeft: {
        fontFamily: "default-semibold",
        color: theme.colors.secondary.black,
        letterSpacing: 1,
        padding: theme.spacing.sm,
    }
});
