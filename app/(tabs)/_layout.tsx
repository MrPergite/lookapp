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
import { Camera, MessageCircle, UserCircle } from "lucide-react-native";
import Profile from "../profile/_layout";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
//Poppins-Medium

// Define the param types for our tabs
type TabParamList = {
    Chat: { headerProps?: object };
    'Virtual TryOn': { headerProps?: object };
    Profile: { headerProps?: object };
};

export default function RootLayout() {
    const { signOut, isSignedIn } = useAuth()

    const Tab = createBottomTabNavigator<TabParamList>();


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
                        const icon = route.name === "Chat" ? <MessageCircle size={size} color={color} /> : <UserCircle size={size} color={color} />;
                        return icon;
                    },
                    tabBarActiveTintColor: theme.colors.primary.purple,
                    tabBarInactiveTintColor: "gray",
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: theme.colors.primary.white,
                    },
                })}
                // screenListeners={{
                //     tabPress: (ev) => {
                //         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                //         console.log("tabPress", ev.target);
                //     },
                // }}
                listeners={({ navigation }) => ({
                    tabPress: e => {
                      const key = Math.random().toString();
                      navigation.navigate('Home', { key }); // forces remount
                    },
                  })}
            >
                <Tab.Screen
                    options={({ route, navigation }) => {
                        // Default header props
                        const defaultHeaderProps = {
                            headerShown: false,
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
                    name="Chat"
                    component={ChatScreen}
                />
                {/* <Tab.Screen
                    name="Virtual TryOn"
                    component={ProfileScreen}
                    options={({ route }) => {
                        const { params } = route;
                        if (params && params.headerProps) {
                            return params.headerProps;
                        }
                        return {};
                    }}
                /> */}
                <Tab.Screen
                    name="Profile"
                    component={Profile}
                    options={({ route, navigation }) => {
                        // Default header props
                        const defaultHeaderProps = {
                            headerShown: false,
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
                />
            </Tab.Navigator>
            {/* <StatusBar style="light" /> */}
        </>
    );
}
