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
import {  useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "@/components/ThemedText";
import { SafeAreaView, View, StyleSheet, Text, Button } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/styles/theme";
import * as Haptics from "expo-haptics";
import ChatScreen from "./chat/chat-products";
import Toast from "react-native-toast-message";
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabHeader } from "@/components/tab-header";
import { Archive, Camera, MessageCircle, ShoppingCart, UserCircle } from "lucide-react-native";
import Profile from "./profile/_layout";
import VirtualTryOn from "./virtual-tryon";
import ShoppingList from "./shopping-list";
import DigitalWardrobe from "./digital-wardrobe";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
//Poppins-Medium

// Define the param types for our tabs
type TabParamList = {
    chat: { headerProps?: object };
    "virtual-tryon": { headerProps?: object };
    profile: { headerProps?: object };
    "shopping-list": { headerProps?: object };
    "digital-wardrobe": { headerProps?: object };
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
                        const iconMap = {
                            chat: <MessageCircle size={size} color={color} />,
                            "virtual-tryon": <Camera size={size} color={color} />,
                            profile: <UserCircle size={size} color={color} />,
                            "shopping-list": <ShoppingCart size={size} color={color} />,
                            "digital-wardrobe": <Archive size={size} color={color} />,
                        } as const;
                        const icon = iconMap[route.name];
                        return icon;
                    },
                    tabBarActiveTintColor: theme.colors.primary.purple,
                    tabBarInactiveTintColor: "gray",
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: theme.colors.primary.white,
                    },
                })}
             
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

                        return { ...defaultHeaderProps, title: "Chat" };
                    }}
                    name="chat"
                    component={ChatScreen}
                />
                <Tab.Screen
                    name="virtual-tryon"
                    component={VirtualTryOn}
                    options={({ route }) => {
                        const { params } = route;
                        if (params && params.headerProps) {
                            return params.headerProps;
                        }
                        return {
                            title: "Try-On",
                        };
                    }}
                />
                 <Tab.Screen
                    name="digital-wardrobe"
                    component={DigitalWardrobe}
                    options={{
                        title: "Digital Wardrobe",
                    }}
                />
                <Tab.Screen
                    name="shopping-list"
                    component={ShoppingList}
                    options={{
                        title: "Shopping List",
                    }}
                />
                <Tab.Screen
                    name="profile"
                    component={Profile}
                    options={({ route, navigation }) => {
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

                        return { ...defaultHeaderProps, title: "Profile" };
                    }}
                />
            </Tab.Navigator>
            {/* <StatusBar style="light" /> */}
        </>
    );
}
