import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "@/components/ThemedText";
import { SafeAreaView, View, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/styles/theme";
import SignInScreen from "./(authn)/signin";
import SignUpScreen from "./(authn)/signup";
import * as Haptics from "expo-haptics";
import ChatScreen from "./(home)/chat-products";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
//Poppins-Medium
export default function RootLayout() {
  const { isSignedIn } = useAuth();


  const Tab = createBottomTabNavigator();

  const ProfileScreen = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Profile</Text>
    </View>
  );

  if (isSignedIn) {
    return <Redirect href={"/(home)/chat-products"} />;
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
        <Tab.Screen name="Home" component={ChatScreen} />
        {/* <Tab.Screen name="SignUp" component={SignUpScreen} /> */}
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </>
  );
}
const styles = StyleSheet.create({
  header: {
    fontFamily: "default-medium",
  },
});
