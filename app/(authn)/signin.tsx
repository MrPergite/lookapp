import { useSignIn } from "@clerk/clerk-expo";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import TextBox from "@/components/text-box";
import theme from "@/styles/theme";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { authnStyles } from "./styles";
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function SignInScreen({ navigation }) {
  const { signIn, setActive } = useSignIn();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<
    Record<string, string | null>
  >({ email: null, password: null, combine: null });
  const shake = useSharedValue(0);
  const router = useRouter()
  const signInref = useRef<typeof TouchableOpacity>(null);

  if (!signIn || !setActive) {
    return <></>
  }

  const handleSignIn = async () => {
    const toastMsg = {
      type: 'success',
      text1: 'Signed In'
    }
    try {
      const { email, password } = credentials;
      const result = await signIn.create({ identifier: email, password });
      await setActive({ session: result.createdSessionId });
    } catch (error) {
      setErrorMessage({
        ...errorMessage,
        combine: error.errors[0]?.message || "Sign-in failed",
      });
      shake.value = withTiming(
        10,
        { duration: 100 },
        () => (shake.value = withTiming(0)),
      );
    }
    finally {
      Toast.show(toastMsg);
    }
  };

  const onTextChange = (key: string, value: string) => {
    setErrorMessage({ combine: null });
    setCredentials({ ...credentials, [key]: value });
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary.lavender, theme.colors.primary.white]}
      style={authnStyles.container}
    >
      <ThemedText type="title">Welcome Back</ThemedText>

      <Animated.View
        style={{ transform: [{ translateX: shake }], width: "100%" }}
      >
        <TextBox
          label="Email"
          placeholder="Enter your email"
          value={credentials.email}
          onChangeText={(val: string) => onTextChange("email", val.toLowerCase())}
          error={!!errorMessage?.combine}
        />

        <TextBox
          label="Password"
          placeholder="Enter your password"
          value={credentials.password}
          onChangeText={(val: string) => onTextChange("password", val)}
          secureTextEntry
          error={!!errorMessage?.combine}
        />
      </Animated.View>

      {errorMessage && (
        <Animated.Text
          entering={FadeIn}
          exiting={FadeOut}
          style={authnStyles.errorMessage}
        >
          {errorMessage?.combine}
        </Animated.Text>
      )}

      <TouchableOpacity
        ref={signInref}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleSignIn();
        }}
        style={authnStyles.ctaActionContainer}
      >
        <Text style={authnStyles.ctaActionText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.navigate("/(authn)/signup")}
        style={{ marginTop: 15 }}
      >
        <Text
          style={{
            color: theme.colors.secondary.veryDarkGray,
            fontSize: 16,
            fontFamily: "default-medium",
          }}
        >
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
