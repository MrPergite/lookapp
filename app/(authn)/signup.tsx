import { isClerkAPIResponseError, useAuth, useSession, useSignUp } from "@clerk/clerk-expo";
import React, { useEffect, useState, useRef } from "react";
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
import { useSharedValue, withTiming, withSpring, withRepeat, withDelay } from "react-native-reanimated";
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
import { CircleCheck, CircleX, Mail, Lock, User } from "lucide-react-native";
import CodeVerification from "@/components/auth/CodeVerification";
import PhoneInput from '@/components/auth/phone-input/PhoneInput';
import { useUserCountry } from "../(onboarding)/queries";
import { useUserDetails } from "@/common/providers/user-details";
import GradientText from "@/components/GradientText";

const { width, height } = Dimensions.get('window');

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
  
  // Animation values
  const logoAnimation = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const decorationOpacity1 = useSharedValue(0);
  const decorationOpacity2 = useSharedValue(0);
  const decorationOpacity3 = useSharedValue(0);
  const decorationRotate1 = useSharedValue(0);
  const decorationRotate2 = useSharedValue(0);

  const router = useRouter();

  useEffect(() => {
    if (userCountry.calling_code) {
      setCountryCode(`+${userCountry.calling_code}`);
    }
    
    // Animate elements on component mount
    setTimeout(() => {
      logoAnimation.value = withSpring(1.1, { damping: 12 });
      setTimeout(() => {
        logoAnimation.value = withSpring(1, { damping: 12 });
        
        // Animate decorative elements
        decorationOpacity1.value = withDelay(300, withTiming(0.7, { duration: 600 }));
        decorationOpacity2.value = withDelay(500, withTiming(0.5, { duration: 600 }));
        decorationOpacity3.value = withDelay(700, withTiming(0.6, { duration: 600 }));
        
        // Start rotating decorations
        decorationRotate1.value = withRepeat(
          withTiming(2 * Math.PI, { duration: 20000 }),
          -1, // repeat infinitely
          false // don't reverse
        );
        
        decorationRotate2.value = withRepeat(
          withTiming(2 * Math.PI, { duration: 25000 }),
          -1,
          false
        );
      }, 800);
    }, 300);
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
    
    // Visual feedback for button press
    buttonScale.value = withTiming(0.95, { duration: 100 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 100);
    
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
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
        colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Decorative elements */}
        <Animated.View style={[styles.decoration1, {
          opacity: decorationOpacity1,
          transform: [{ rotate: `${decorationRotate1.value}rad` }]
        }]}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(236, 72, 153, 0.1)']}
            style={styles.decorationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <Animated.View style={[styles.decoration2, {
          opacity: decorationOpacity2,
          transform: [{ rotate: `${decorationRotate2.value}rad` }]
        }]}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.15)']}
            style={styles.decorationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <Animated.View style={[styles.decoration3, {
          opacity: decorationOpacity3
        }]}>
          <LinearGradient
            colors={['rgba(236, 72, 153, 0.1)', 'rgba(59, 130, 246, 0.1)']}
            style={styles.decorationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/image.png')}
              style={styles.lookLogo}
              resizeMode="contain"
            />
            <GradientText 
                style={styles.welcomeText}
                gradientColors={['#8B5CF6', '#EC4899', '#3B82F6']}
            >
                Sign up to get started with Look AI
            </GradientText>
            {/* <Text style={styles.subText}>
              Sign up to get started with Look AI
            </Text> */}
          </View>

          <LinearGradient
            colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
            style={styles.formCardGradient}
          >
            <Animated.View
              style={[styles.formContainer, { 
                transform: [{ translateX: shake }],
              }]}
            >
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <User size={20} color="#8B5CF6" strokeWidth={2} />
                    </View>
                    <TextBox
                      label="First Name"
                      placeholder="First Name"
                      value={credentials.firstName}
                      onChangeText={(val: string) => onTextChange("firstName", val)}
                      error={errorMessage?.combine ? errorMessage.combine : null}
                      style={styles.input}
                      labelStyle={styles.inputLabel}
                    />
                  </View>
                </View>

                <View style={styles.nameField}>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIconContainer}>
                      <User size={20} color="#8B5CF6" strokeWidth={2} />
                    </View>
                    <TextBox
                      label="Last Name"
                      placeholder="Last Name"
                      value={credentials.lastName}
                      onChangeText={(val: string) => onTextChange("lastName", val)}
                      error={errorMessage?.combine ? errorMessage.combine : null}
                      style={styles.input}
                      labelStyle={styles.inputLabel}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Mail size={20} color="#8B5CF6" strokeWidth={2} />
                </View>
                <TextBox
                  label="Email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChangeText={(val: string) => onTextChange("email", val.toLowerCase())}
                  error={errorMessage?.combine ? errorMessage.combine : null}
                  style={styles.input}
                  labelStyle={styles.inputLabel}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <PhoneInput
                  value={credentials.phone}
                  onChange={val => onTextChange('phone', val)}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  placeholder="Enter your phone number (optional)"
                  error={errorMessage?.combine ? errorMessage.combine : null}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Lock size={20} color="#8B5CF6" strokeWidth={2} />
                </View>
                <TextBox
                  label="Password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChangeText={(val: string) => onTextChange("password", val)}
                  secureTextEntry
                  error={errorMessage?.password || errorMessage?.combine}
                  style={styles.input}
                  labelStyle={styles.inputLabel}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Lock size={20} color="#8B5CF6" strokeWidth={2} />
                </View>
                <TextBox
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={credentials.confirmPassword}
                  onChangeText={(val: string) => onTextChange("confirmPassword", val)}
                  secureTextEntry
                  error={errorMessage?.confirmPassword || errorMessage?.combine}
                  style={styles.input}
                  labelStyle={styles.inputLabel}
                />
              </View>

              {passwordMatch !== null && (
                passwordMatch ?
                  <View style={styles.passwordMatchContainer} >
                    <CircleCheck size={16} color={theme.colors.primary.green} />
                    <Text style={[
                      styles.passwordMatchText,
                      { color: theme.colors.primary.green }
                    ]}>Passwords match</Text>
                  </View> :
                  <View style={styles.passwordMatchContainer} >
                    <CircleX size={16} color={'red'} />
                    <Text style={[
                      styles.passwordMatchText,
                      { color: 'red' }
                    ]}>Passwords do not match</Text>
                  </View>
              )}
            </Animated.View>
          </LinearGradient>

          {errorMessage.combine && (
            <Animated.Text
              entering={FadeIn.duration(300)}
              exiting={FadeOut}
              style={styles.errorMessage}
            >
              {errorMessage.combine}
            </Animated.Text>
          )}

          <View style={styles.actionsContainer}>
            <Animated.View style={{ width: '100%', transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={onSignUpPress}
                style={[
                  styles.signUpButton,
                  isLoading && styles.buttonDisabled
                ]}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

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
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    paddingTop: 40,
    paddingBottom: 40,
  },
  // Decorative elements
  decoration1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -width * 0.2,
    right: -width * 0.2,
    zIndex: 0,
  },
  decoration2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    bottom: -width * 0.3,
    left: -width * 0.3,
    zIndex: 0,
  },
  decoration3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: height * 0.3,
    right: -30,
    zIndex: 0,
  },
  decorationGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    zIndex: 1,
  },
  lookLogo: {
    width: 180,
    height: 70,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'default-bold',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 16,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    fontFamily: 'default-regular',
    letterSpacing: 0.2,
  },
  formCardGradient: {
    width: '85%',
    alignSelf: 'center',
    borderRadius: 20,
    marginTop:0,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  formContainer: {
    width: "100%",
    zIndex: 2,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  nameField: {
    width: '48%',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 0,
  },
  inputIconContainer: {
    position: 'absolute',
    left: 15,
    top: 40,
    zIndex: 2,
    backgroundColor: 'rgba(245, 243, 255, 0.7)',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    paddingLeft: 45,
    borderRadius: 16,
    height: 60,
    fontFamily: 'default-medium',
    color: '#4B5563',
  },
  inputLabel: {
    color: '#8B5CF6',
    fontFamily: 'default-semibold',
    fontSize: 15,
    marginBottom: 6,
  },
  errorMessage: {
    color: "#EF4444",
    marginBottom: 10,
    fontFamily: "default-medium",
    textAlign: 'center',
    padding: 12,
    backgroundColor: 'rgba(254, 226, 226, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionsContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: Dimensions.get('window').width - 60,
    zIndex: 2,
  },
  signUpButton: {
    width: "100%",
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: theme.colors.primary.white,
    fontSize: 18,
    fontFamily: 'default-semibold',
    letterSpacing: 0.5,
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
    marginTop: 16,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 14,
    color: theme.colors.secondary.darkGray,
    textAlign: 'center',
    fontFamily: 'default-regular',
    lineHeight: 20,
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  passwordMatchText: {
    fontSize: 14,
    fontFamily: 'default-medium',
  },
});

export default SignUpScreen;
