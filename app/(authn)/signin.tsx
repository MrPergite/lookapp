import { useSignIn } from "@clerk/clerk-expo";
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
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
import BackButton from "./components/BackButton";

export default function SignInScreen() {
  const { signIn, setActive } = useSignIn();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<
    Record<string, string | null>
  >({ email: null, password: null, combine: null });
  const shake = useSharedValue(0);
  const router = useRouter();
  const signInref = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!signIn || !setActive) {
    return <></>;
  }

  const handleSignIn = async () => {
    setIsLoading(true);
    const toastMsg = {
      type: 'success',
      text1: 'Signed In'
    };
    
    try {
      const { email, password } = credentials;
      const result = await signIn.create({ identifier: email, password });
      await setActive({ session: result.createdSessionId });
      Toast.show(toastMsg);
    } catch (error: any) {
      setErrorMessage({
        ...errorMessage,
        combine: error.errors[0]?.message || "Sign-in failed",
      });
      shake.value = withTiming(
        10,
        { duration: 100 },
        () => (shake.value = withTiming(0)),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onTextChange = (key: string, value: string) => {
    setErrorMessage({ combine: null });
    setCredentials({ ...credentials, [key]: value });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={[theme.colors.primary.lavender, theme.colors.primary.white]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <BackButton routeName="(tabs)" />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image 
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText type="title" style={styles.welcomeText}>Welcome Back</ThemedText>
            <Text style={styles.subText}>Sign in to continue to your account</Text>
          </View>

          <Animated.View
            style={[styles.formContainer, { transform: [{ translateX: shake }], width: Dimensions.get('window').width-48 }]}
          >
            <TextBox
              label="Email"
              placeholder="Enter your email"
              value={credentials.email}
              onChangeText={(val: string) => onTextChange("email", val.toLowerCase())}
              error={errorMessage?.combine ? errorMessage.combine : null}
              style={styles.input}
            />

            <TextBox
              label="Password"
              placeholder="Enter your password"
              value={credentials.password}
              onChangeText={(val: string) => onTextChange("password", val)}
              secureTextEntry
              error={errorMessage?.combine ? errorMessage.combine : null}
              style={styles.input}
            />
{/* 
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity> */}
          </Animated.View>

          {errorMessage.combine && (
            <Animated.Text
              entering={FadeIn}
              exiting={FadeOut}
              style={styles.errorMessage}
            >
              {errorMessage.combine}
            </Animated.Text>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              ref={signInref}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSignIn();
              }}
              style={[
                styles.signInButton,
                isLoading && styles.buttonDisabled
              ]}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.colors.primary.purple, '#8C52FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(authn)/signup" as any)}
              style={styles.switchAuthButton}
            >
              <Text style={styles.switchAuthText}>
                Don't have an account? <Text style={styles.textHighlight}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: 'default-bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    fontFamily: 'default-regular',
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: theme.colors.primary.purple,
    fontFamily: 'default-medium',
    fontSize: 14,
  },
  errorMessage: {
    color: "red",
    marginBottom: 16,
    fontFamily: "default-medium",
    textAlign: 'center',
  },
  actionsContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: Dimensions.get('window').width-48
  },
  signInButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.primary.white,
    fontSize: 18,
    fontFamily: 'default-semibold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  switchAuthButton: {
    padding: 12,
  },
  switchAuthText: {
    color: theme.colors.secondary.darkGray,
    fontSize: 16,
    fontFamily: "default-medium",
    textAlign: 'center',
  },
  textHighlight: {
    color: theme.colors.primary.purple,
    fontFamily: 'default-semibold',
  },
});
