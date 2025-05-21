import { useSignIn } from "@clerk/clerk-expo";
import React, { useEffect, useRef, useState } from "react";
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
import { isClerkAPIResponseError } from "@clerk/clerk-expo";
import CodeVerification from '@/components/auth/CodeVerification';
import PhoneInput from '@/components/auth/phone-input/PhoneInput';
import { useUserDetails } from "@/common/providers/user-details";

export default function SignInScreen() {
  const { signIn, setActive } = useSignIn();
  const [credentials, setCredentials] = useState({
    email: "",
    phone: "",
    password: "",
  });
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [errorMessage, setErrorMessage] = useState<
    Record<string, string | null>
  >({ email: null, phone: null, password: null, combine: null });
  const shake = useSharedValue(0);
  const router = useRouter();
  const signInref = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifError, setVerifError] = useState<string | null>(null);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifSession, setVerifSession] = useState<any>(null);
  const [verifDestination, setVerifDestination] = useState<string>("");
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+1');
  const { userCountry } = useUserDetails();

  useEffect(() => {
    if (userCountry.calling_code) {
      setCountryCode(`+${userCountry.calling_code}`);
    }
  }, [userCountry]);

  if (!signIn || !setActive) {
    return <></>;
  }

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage({ email: null, phone: null, password: null, combine: null });
    try {
      let result;
      if (loginType === 'email') {
        result = await signIn.create({ identifier: credentials.email, password: credentials.password });
      } else {
        const fullPhone = countryCode + credentials.phone;
        result = await signIn.create({ identifier: fullPhone, password: credentials.password });
      }
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        Toast.show({ type: 'success', text1: 'Signed In', visibilityTime: 2000 });
      }
    } catch (error: any) {
      let message = "Sign-in failed";
      if (isClerkAPIResponseError && isClerkAPIResponseError(error)) {
        if (error.errors && error.errors.length > 0) {
          message = error.errors[0].longMessage || error.errors[0].message || message;
        } else if (error.message) {
          message = error.message;
        }
      } else if (error && error.message) {
        message = error.message;
      }
      setErrorMessage({
        ...errorMessage,
        combine: message,
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

  const handleCodeSubmit = async (code: string) => {
    setVerifLoading(true);
    setVerifError(null);
    try {
      let attempt;
      if (loginType === 'email') {
        attempt = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      } else {
        attempt = await signIn.attemptFirstFactor({ strategy: 'phone_code', code });
      }
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        Toast.show({ type: 'success', text1: 'Signed In', visibilityTime: 2000 });
        setPendingVerification(false);
      } else {
        setVerifError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      let message = 'Verification failed. Please try again.';
      if (isClerkAPIResponseError && isClerkAPIResponseError(err)) {
        if (err.errors && err.errors.length > 0) {
          message = err.errors[0].longMessage || err.errors[0].message || message;
        } else if (err.message) {
          message = err.message;
        }
      } else if (err && err.message) {
        message = err.message;
      }
      setVerifError(message);
    } finally {
      setVerifLoading(false);
    }
  };

  const handleResend = async () => {
    if (!signIn) return;
    setVerifLoading(true);
    setVerifError(null);
    try {
      if (loginType === 'email' && emailAddressId) {
        await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId });
      } else if (loginType === 'phone' && phoneNumberId) {
        await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId });
      }
      Toast.show({ type: 'success', text1: 'Code resent', visibilityTime: 2000 });
    } catch (err: any) {
      setVerifError('Failed to resend code.');
    } finally {
      setVerifLoading(false);
    }
  };

  if (pendingVerification) {
    //TODO: disabled for now To Be added later if otp based login is required
    return (
      <CodeVerification
        type={loginType}
        destination={verifDestination}
        onSubmit={handleCodeSubmit}
        onResend={handleResend}
        isLoading={verifLoading}
        errorMessage={verifError}
        onCancel={() => setPendingVerification(false)}
      />
    );
  }

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

          <View style={{ width: "100%", flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setLoginType('email')} style={{ borderBottomWidth: loginType === 'email' ? 2 : 0, borderColor: theme.colors.primary.purple, width: "50%" }}>
              <Text className="p-2" style={{ textAlign: 'center', fontWeight: loginType === 'email' ? 'bold' : 'normal', color: loginType === 'email' ? theme.colors.primary.purple : theme.colors.secondary.darkGray, fontSize: 16, paddingHorizontal: 8 }}>Email address</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLoginType('phone')} style={{ borderBottomWidth: loginType === 'phone' ? 2 : 0, borderColor: theme.colors.primary.purple, width: "50%" }}>
              <Text className="p-2" style={{ textAlign: 'center', fontWeight: loginType === 'phone' ? 'bold' : 'normal', color: loginType === 'phone' ? theme.colors.primary.purple : theme.colors.secondary.darkGray, fontSize: 16, paddingHorizontal: 8 }}>Use phone</Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[styles.formContainer, { transform: [{ translateX: shake }], width: Dimensions.get('window').width - 48 }]}
          >
            {loginType === 'email' ? (
              <>
                <TextBox
                  label="Email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChangeText={(val: string) => onTextChange("email", val.toLowerCase())}
                  error={errorMessage?.combine ? errorMessage.combine : null}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

              </>
            ) : (
              <PhoneInput
                value={credentials.phone}
                onChange={val => onTextChange('phone', val)}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                placeholder="Enter your phone number"
                error={errorMessage?.combine ? errorMessage.combine : null}
                style={styles.input}
              />
            )}

            <TextBox
              label="Password"
              placeholder="Enter your password"
              value={credentials.password}
              onChangeText={(val: string) => onTextChange("password", val)}
              secureTextEntry
              error={errorMessage?.combine ? errorMessage.combine : null}
              style={styles.input}
            />
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
    width: Dimensions.get('window').width - 48
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
