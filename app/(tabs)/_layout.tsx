import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
    RouteProp,
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
import { SafeAreaView, View, StyleSheet, Text, Button, Pressable, Image } from "react-native";
import { createBottomTabNavigator, BottomTabNavigationProp, BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/styles/theme";
import * as Haptics from "expo-haptics";
import ChatScreen from "./chat/chat-products";
import Toast from "react-native-toast-message";
import { TabHeader } from "@/components/TabHeader";
import { Archive, Camera, MessageCircle, ShoppingCart, UserCircle } from "lucide-react-native";
import VirtualTryOn from "./virtual-tryon";
import ShoppingList from "./shopping-list";
import DigitalWardrobe from "./digital-wardrobe";
import CustomTabBar from "@/components/ui/CustomTabBar";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
//Poppins-Medium

// Define the param types for our tabs
type TabParamList = {
    chat: undefined;
    "virtual-tryon": { headerProps?: object };
    profile: undefined;
    "shopping-list": { headerProps?: object };
    "digital-wardrobe": { headerProps?: object };
};

// Define a type for the navigation prop in screenOptions
type ScreenOptionsNavigationProp = BottomTabNavigationProp<TabParamList, keyof TabParamList>;

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
                tabBar={props => <CustomTabBar {...props} />}
                screenOptions={({ route, navigation }: { route: RouteProp<TabParamList, keyof TabParamList>; navigation: ScreenOptionsNavigationProp }) => ({
                    tabBarActiveTintColor: theme.colors.primary.purple,
                    tabBarInactiveTintColor: "gray",
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: theme.colors.primary.white,
                    },
                })}
            >
                <Tab.Screen
                    name="chat"
                    component={ChatScreen}
                    options={({ navigation }: { navigation: ScreenOptionsNavigationProp }) => ({
                        headerShown: true,
                        header: () => (
                            <TabHeader 
                                onProfilePress={() => navigation.navigate('profile')} 
                            />
                        ),
                        title: "Chat",
                    })}
                />
                <Tab.Screen
                    name="virtual-tryon"
                    component={VirtualTryOn}
                    options={({ route }: BottomTabScreenProps<TabParamList, 'virtual-tryon'>) => {
                        const { params } = route;
                        if (params && params.headerProps) {
                            return params.headerProps;
                        }
                        return {
                            title: "Try-On",
                            headerShown: false
                        };
                    }}
                />
                 <Tab.Screen
                    name="digital-wardrobe"
                    component={DigitalWardrobe}
                    options={{
                        title: "Digital Wardrobe",
                        headerShown: false
                    }}
                />
                <Tab.Screen
                    name="shopping-list"
                    component={ShoppingList}
                    options={{
                        title: "Shopping List",
                        headerShown: false
                    }}
                />
            
            </Tab.Navigator>
            {/* <StatusBar style="light" /> */}
        </>
    );
}
