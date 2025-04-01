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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
//Poppins-Medium
export default function RootLayout() {
    const { signOut } = useAuth()

    const Tab = createBottomTabNavigator();

    const ProfileScreen = () => (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Profile</Text>
        </View>
    );

    const handleLogOut = async () => {
        try {
            await signOut();
            router.replace("/(authn)/signin")
            Toast.show({
                type: "success",
                text1: "See you soon :)"
            })
        }
        catch (e) {

        }
    }


    return (
        <>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        let iconName = route.name === "Home" ? "home" : "person";
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: theme.colors.primary.pink,
                    tabBarInactiveTintColor: "gray",
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: theme.colors.primary.white,
                    },
                })}
                screenListeners={{
                    tabPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    },
                }}
            >
                <Tab.Screen options={{
                    headerShown: true,
                    headerTitle: "",
                    header: () => (
                        <SafeAreaView>
                            <View style={styles.chatHeader}>
                                <ThemedText type='subtitle' style={styles.headerLeft}>Chat With LookAI</ThemedText>
                                <ThemedText type='default' onPress={handleLogOut} style={styles.headerLeft}>LOG OUT</ThemedText>
                            </View>
                        </SafeAreaView>
                    ),
                }} name="Home" component={ChatScreen} />
                <Tab.Screen name="Virtual TryOn" component={ProfileScreen} />
            </Tab.Navigator>
            <StatusBar style="auto" />
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
