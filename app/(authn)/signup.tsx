import { isClerkAPIResponseError, useAuth, useSession, useSignUp } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Keyboard,
  Linking,
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
import * as SecureStore from 'expo-secure-store';
import { CircleCheck, CircleX } from "lucide-react-native";
import CodeVerification from "@/components/auth/CodeVerification";
import PhoneInput from '@/components/auth/phone-input/PhoneInput';
import { useUserCountry } from "../(onboarding)/queries";
import { useUserDetails } from "@/common/providers/user-details";

const initialValues = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
};

const SignUpScreen = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { session } = useSession();
  const { signOut } = useAuth();
  const [credentials, setCredentials] = useState(initialValues);
  const [errorMessage, setErrorMessage] = useState<Record<string, string | null>>({
    email: null,
    password: null,
    confirmPassword: null,
    combine: null
  });
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const shake = useSharedValue(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const { userCountry } = useUserDetails();
  const [countryCode, setCountryCode] = useState('+1');

  const router = useRouter();

  useEffect(() => {
    if (userCountry.calling_code) {
      setCountryCode(`+${userCountry.calling_code}`);
    }
  }, [userCountry]);

  // Check and handle existing session
  useEffect(() => {
    const checkAndSignOut = async () => {
      if (session) {
        try {
          await signOut();
          console.log("Signed out existing session");
        } catch (err) {
          console.error("Error signing out:", err);
        }
      }
    };
    checkAndSignOut();
  }, [session]);

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    // Validate password
    const passwordError = validatePassword(credentials.password);
    if (passwordError) {
      setErrorMessage({
        ...errorMessage,
        password: passwordError,
        combine: passwordError
      });
      setIsLoading(false);
      return;
    }

    // Check if passwords match
    if (credentials.password !== credentials.confirmPassword) {
      setErrorMessage({
        ...errorMessage,
        confirmPassword: "Passwords do not match",
        combine: "Passwords do not match"
      });
      setIsLoading(false);
      return;
    }

    try {
      // Ensure we're signed out before starting signup
      if (session) {
        await signOut();
      }

      console.log("Starting signup process...");
      console.log("Creating account for email:", credentials.email);

      const { email, password, firstName, lastName, phone } = credentials;
      const signUpPayload: any = {
        emailAddress: email,
        password
      };
      if (phone) {
        signUpPayload.phoneNumber = countryCode + phone;
      }
      const signUpResult = await signUp.create(signUpPayload);

      console.log("Signup result:", signUpResult);

      if (phone) {
        await signUpResult.preparePhoneNumberVerification({ strategy: "phone_code" });
      } else {
        await signUpResult.prepareEmailAddressVerification({ strategy: "email_code" });
      }

      setPendingVerification(true);
    } catch (err) {
      console.error("Signup error:", err);
      let signUpErrorMessage = "Sign-up failed. Please check your information.";
      if (isClerkAPIResponseError(err)) {
        console.error("Clerk API Error:", {
          message: err.message,
          errors: err.errors,
          status: err.status
        });
        signUpErrorMessage = err.errors[0].longMessage || "Sign-up failed. Please check your information.";
      }
      setErrorMessage({
        ...errorMessage,
        combine: signUpErrorMessage,
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

    // Check password match in real-time
    if (key === 'password' || key === 'confirmPassword') {
      if (key === 'password') {
        setPasswordMatch(credentials.confirmPassword ? value === credentials.confirmPassword : null);
      } else {
        setPasswordMatch(credentials.password ? value === credentials.password : null);
      }
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      Keyboard.dismiss();
    }
  };

  const resetToDefaults = () => {
    setCredentials({ ...initialValues });
    setErrorMessage({ combine: null });
    setPendingVerification(false);
  };

  // Handle submission of verification form
  const onVerifyPress = async (code: string) => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      console.log("Starting verification process...");
      console.log("Email being verified:", credentials.email);

      let signUpAttempt: any = null;

      if (credentials.phone) {
        signUpAttempt = await signUp.attemptPhoneNumberVerification({
          code,
        });
      } else {
        signUpAttempt = await signUp.attemptEmailAddressVerification({
          code,
        });
      }

      if (!signUpAttempt) {
        throw new Error("Sign up attempt failed");
      }

      await signUpAttempt.update({
        firstName: credentials.firstName,
        lastName: credentials.lastName,
      });

      console.log("Verification attempt result:", signUpAttempt);

      if (signUpAttempt.status === "complete") {
        console.log("Email verified, setting active session...");
        await setActive({ session: signUpAttempt.createdSessionId });
        console.log("Session set active, redirecting to onboarding...");

        // Add a delay to ensure session is properly set
        setTimeout(() => {
          router.replace("(onboarding)" as any);
        }, 500);
      } else {
        console.log("Verification not complete:", signUpAttempt);
        Toast.show({ type: "error", text1: "Error in code verification!", visibilityTime: 2000 })
      }
    } catch (err) {
      console.error("Verification error:", err);
      if (isClerkAPIResponseError(err)) {
        console.error("Clerk API Error:", {
          message: err.message,
          errors: err.errors,
          status: err.status
        });
        setErrorMessage({
          ...errorMessage,
          combine: err.errors[0].longMessage || "Verification failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
      setCode("");
    }
  };

  const resendCode = async () => {
    try {
      if (!signUp) {
        throw new Error("signUp is not initialized");
      }
      console.log("Resending verification code to:", credentials.email);
      if (credentials.phone) {
        await signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      setPendingVerification(true);
      Toast.show({ type: "success", text1: "Code sent successfully", visibilityTime: 2000 });
    } catch (err) {
      console.error("Error resending code:", err);
      Toast.show({ type: "error", text1: "Error sending code", visibilityTime: 2000 });
    }
  };

  if (pendingVerification) {
    return (
      <CodeVerification
        type={credentials.phone ? "phone" : "email"}
        destination={credentials.phone || credentials.email}
        onSubmit={onVerifyPress}
        onResend={resendCode}
        isLoading={isLoading}
        errorMessage={errorMessage?.combine}
      />
    );
  }

  const handleTermsPress = () => {
    Linking.openURL('https://www.lookai.me/terms-of-service');
  };
  const handlePrivacyPress = () => {
    Linking.openURL('https://www.lookai.me/privacypolicy');
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
        <BackButton routeName="/(authn)/signin" />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { width: Dimensions.get('window').width - 48 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText
              type="title"
              style={styles.welcomeText}
            >
              Create your account
            </ThemedText>
            <Text style={styles.subText}>
              Sign up to get started with Look AI
            </Text>
          </View>

          <Animated.View
            style={[styles.formContainer, { transform: [{ translateX: shake }] }]}
          >
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <TextBox
                  label="First Name"
                  placeholder="John"
                  value={credentials.firstName}
                  onChangeText={(val: string) => onTextChange("firstName", val)}
                  error={errorMessage?.combine ? errorMessage.combine : null}
                  style={styles.input}
                />
              </View>

              <View style={styles.nameField}>
                <TextBox
                  label="Last Name"
                  placeholder="Doe"
                  value={credentials.lastName}
                  onChangeText={(val: string) => onTextChange("lastName", val)}
                  error={errorMessage?.combine ? errorMessage.combine : null}
                  style={styles.input}
                />
              </View>
            </View>

            <TextBox
              label="Email"
              placeholder="Enter your email"
              value={credentials.email}
              onChangeText={(val: string) => onTextChange("email", val.toLowerCase())}
              error={errorMessage?.combine ? errorMessage.combine : null}
              style={styles.input}
            />

            <PhoneInput
              value={credentials.phone}
              onChange={val => onTextChange('phone', val)}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              placeholder="Enter your phone number (optional)"
              error={errorMessage?.combine ? errorMessage.combine : null}
              style={styles.input}
            />

            <TextBox
              label="Password"
              placeholder="Enter your password"
              value={credentials.password}
              onChangeText={(val: string) => onTextChange("password", val)}
              secureTextEntry
              error={errorMessage?.password || errorMessage?.combine}
              style={styles.input}
            />

            <TextBox
              label="Confirm Password"
              placeholder="Confirm your password"
              value={credentials.confirmPassword}
              onChangeText={(val: string) => onTextChange("confirmPassword", val)}
              secureTextEntry
              error={errorMessage?.confirmPassword || errorMessage?.combine}
              style={styles.input}
            />

            {passwordMatch !== null && (
              passwordMatch ?
                <View style={styles.passwordMatchContainer} >
                  <CircleCheck translateY={-1} size={20} color={theme.colors.primary.green} />
                  <Text style={[
                    styles.passwordMatchText,
                    { transform: [{ translateY: 5 }] },
                    { color: theme.colors.primary.green }
                  ]}>Passwords match</Text>
                </View> :
                <View style={styles.passwordMatchContainer} >
                  <CircleX translateY={-1} size={20} color={'red'} />
                  <Text style={[
                    styles.passwordMatchText,
                    { transform: [{ translateY: 5 }] },
                    { color: 'red' }
                  ]}>Passwords do not match</Text>
                </View>
            )}
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSignUpPress();
              }}
              style={[
                styles.signUpButton,
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
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.navigate('/(authn)/signin')}
              style={styles.switchAuthButton}
            >
              <Text style={styles.switchAuthText}>
                Already have an account? <Text style={styles.textHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up, you agree to our <Text onPress={handleTermsPress} style={styles.textHighlight}>Terms of Service</Text> and <Text onPress={handlePrivacyPress} style={styles.textHighlight}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  nameField: {
    width: '48%',
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
  errorMessage: {
    color: "red",
    marginBottom: 16,
    fontFamily: "default-medium",
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpButton: {
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
    opacity: 0.5,
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
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 14,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    fontFamily: 'default-regular',
    lineHeight: 20,
  },
  // Verification screen styles
  verificationContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  verificationImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationSubtext: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'default-regular',
  },
  emailHighlight: {
    fontFamily: 'default-semibold',
    color: theme.colors.secondary.black,
  },
  codeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  verifyButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: theme.colors.secondary.darkGray,
    fontSize: 16,
    fontFamily: 'default-medium',
  },
  passwordMatchText: {
    fontSize: 14,
    fontFamily: 'default-medium',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'left',
    width: '100%',
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'center',
    width: '100%',
    gap: 4,
  },
});

export default SignUpScreen;
