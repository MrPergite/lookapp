import { useSignUp } from "@clerk/clerk-expo";
import React, { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const { email, password } = credentials;
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMessage({
        ...errorMessage,
        combine: "Sign-up failed. Please check your information.",
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

  const resetToDefaults = () => {
    setCredentials({ ...initialValues });
    setErrorMessage({ combine: null });
    setPendingVerification(false);
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("(onboarding)" as any);
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
      setErrorMessage({
        ...errorMessage,
        combine: "Verification failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <LinearGradient
        colors={[theme.colors.primary.lavender, theme.colors.primary.white]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <BackButton routeName="/(authn)/signin" />
        
        <View style={styles.verificationContainer}>
          <Image 
            source={require('@/assets/images/verification.png')} 
            style={styles.verificationImage}
            resizeMode="contain"
          />
          
          <ThemedText type='subtitle' style={styles.verificationTitle}>Please check your mail</ThemedText>
          <Text style={styles.verificationSubtext}>
            We've sent a code to <Text style={styles.emailHighlight}>{credentials.email}</Text>
          </Text>
          
          <View style={styles.codeContainer}>
            <TextBox
              label={""}
              error={errorMessage?.combine ? errorMessage.combine : null}
              value={code}
              placeholder="Enter your verification code"
              onChangeText={(code: string) => setCode(code)}
              keyboardType='numeric'
              style={styles.codeInput}
            />
            
            {errorMessage.combine && (
              <Animated.Text
                entering={FadeIn}
                exiting={FadeOut}
                style={styles.errorMessage}
              >
                {errorMessage.combine}
              </Animated.Text>
            )}
            
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onVerifyPress();
              }}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.colors.primary.purple, '#8C52FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Verifying..." : "Verify"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => resetToDefaults()}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

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
          contentContainerStyle={[styles.scrollContent, {width: Dimensions.get('window').width-48}]}
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
              By signing up, you agree to our <Text style={styles.textHighlight}>Terms of Service</Text> and <Text style={styles.textHighlight}>Privacy Policy</Text>
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
});

export default SignUpScreen;
