import { useSignUp } from "@clerk/clerk-expo";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import TextBox from "@/components/text-box";
import theme from "@/styles/theme";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { authnStyles } from "./styles";
import { ThemedText } from "@/components/ThemedText";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const initialValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
};

const SignUpScreen = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [credentials, setCredentials] = useState(initialValues);
  const [errorMessage, setErrorMessage] = useState<
    Record<string, string | null>
  >({ email: null, password: null, combine: null });
  const shake = useSharedValue(0);

  const router = useRouter();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const onSignUpPress = async () => {
    const { email, password } = credentials;
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onTextChange = (key: string, value: string) => {
    setErrorMessage({ combine: null });
    setCredentials({ ...credentials, [key]: value });
  };

  const resetToDefaults = () => {
    setCredentials({ ...initialValues });
    setErrorMessage({ combine: null });
    setPendingVerification(false);
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("(tabs)");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
        Toast.show({ type: "error", text1: "Error in code verification!" })
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <LinearGradient
        colors={[theme.colors.primary.lavender, theme.colors.primary.white]}
        style={authnStyles.container}
      >
        <View style={{ flexDirection: "column", alignItems: "center" }} >
          <ThemedText type='subtitle' >Please check your mail</ThemedText>
          <ThemedText style={{ fontSize: 14, color: theme.colors.secondary.darkGray, padding: theme.spacing.sm, paddingLeft: 0 }} type='default'>We've sent a code to {credentials.email}</ThemedText>
        </View>
        <Animated.View style={{ flexDirection: "column", width: 300 }} >

          <TextBox
            label={""}
            error={!!errorMessage?.combine}
            value={code}
            placeholder="Enter your verification code"
            onChangeText={(code: string) => setCode(code)}
            keyboardType='numeric'
          />
          <TouchableOpacity
            style={authnStyles.ctaActionContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onVerifyPress();
            }}
          >
            <Text style={authnStyles.ctaActionText}>Verify</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => resetToDefaults()}
            style={{ marginTop: 15 }}
          >
            <Text
              style={{
                color: theme.colors.secondary.veryDarkGray,
                fontSize: 16,
                fontFamily: "default-medium",
                textAlign: "center",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.primary.lavender, theme.colors.primary.white]}
      style={authnStyles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <ThemedText
            type="title"
            style={{ textAlign: "left", marginBottom: 20, fontSize: 30 }}
          >
            Create your account
          </ThemedText>

          <Animated.View
            style={{ transform: [{ translateX: shake }], width: "100%" }}
          >
            <TextBox
              label="First Name"
              placeholder="John"
              value={credentials.firstName}
              onChangeText={(val: string) => onTextChange("firstName", val)}
              error={!!errorMessage?.combine}
            />

            <TextBox
              label="Last Name"
              placeholder="Doe"
              value={credentials.lastName}
              onChangeText={(val: string) => onTextChange("lastName", val)}
              error={!!errorMessage?.combine}
            />

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

          {errorMessage.combine && (
            <Animated.Text
              entering={FadeIn}
              exiting={FadeOut}
              style={authnStyles.errorMessage}
            >
              {errorMessage.combine}
            </Animated.Text>
          )}

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSignUpPress();
            }}
            style={authnStyles.ctaActionContainer}
          >
            <Text style={authnStyles.ctaActionText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate('/(authn)/signin')}
            style={{ marginTop: 15 }}
          >
            <Text
              style={{
                color: theme.colors.secondary.veryDarkGray,
                fontSize: 16,
                fontFamily: "default-medium",
                textAlign: "center",
              }}
            >
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default SignUpScreen;
