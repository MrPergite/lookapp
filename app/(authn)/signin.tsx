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
import { useSharedValue, withTiming, withSpring, withRepeat, withDelay } from "react-native-reanimated";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInUp } from "react-native-reanimated";
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
import { LogIn, Mail, Lock, Sparkles } from "lucide-react-native";
import GradientText from "@/components/GradientText";

const { width, height } = Dimensions.get('window');

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
  
  // Animation values
  const logoAnimation = useSharedValue(1);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  const decorationOpacity1 = useSharedValue(0);
  const decorationOpacity2 = useSharedValue(0);
  const decorationOpacity3 = useSharedValue(0);
  const decorationRotate1 = useSharedValue(0);
  const decorationRotate2 = useSharedValue(0);
  
  useEffect(() => {
    if (userCountry.calling_code) {
      setCountryCode(`+${userCountry.calling_code}`);
    }
    
    // Animate elements on component mount
    setTimeout(() => {
      logoAnimation.value = withSpring(1.1, { damping: 12 });
      setTimeout(() => {
        logoAnimation.value = withSpring(1, { damping: 12 });
        
        // Animate form after logo animation
        formOpacity.value = withTiming(1, { duration: 800 });
        formTranslateY.value = withTiming(0, { duration: 800 });
        
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

  if (!signIn || !setActive) {
    return <></>;
  }

  const handleSignIn = async () => {
    // Visual feedback for button press
    buttonScale.value = withTiming(0.95, { duration: 100 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }, 100);
    
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
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
          scrollEnabled={false}
        >
          <View style={styles.header}>
            {/* <Animated.Image
              source={require('@/assets/images/logo.png')}
              style={[styles.logo, {
                transform: [{ scale: logoAnimation }]
              }]}
              resizeMode="contain"
            /> */}
            <Image
              source={require('@/assets/images/image.png')}
              style={styles.lookLogo}
              resizeMode="contain"
            />
            <GradientText 
                style={styles.welcomeText}
                gradientColors={['#8B5CF6', '#EC4899', '#3B82F6']}
            >
                Welcome Back
            </GradientText>
            <Text style={styles.subText}>
              Sign in to continue to your account
            </Text>
          </View>

         
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                onPress={() => setLoginType('email')} 
                style={[
                  styles.tabButton, 
                  loginType === 'email' && styles.activeTab
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  loginType === 'email' && styles.activeTabText
                ]}>
                  Email address
                </Text>
                {loginType === 'email' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setLoginType('phone')} 
                style={[
                  styles.tabButton, 
                  loginType === 'phone' && styles.activeTab
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  loginType === 'phone' && styles.activeTabText
                ]}>
                  Use phone
                </Text>
                {loginType === 'phone' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={['#ffffff', '#f5f3ff', '#f0f9ff']}
              style={styles.formCardGradient}
            >
              <Animated.View
                style={[styles.formContainer, { transform: [{ translateX: shake }], width: Dimensions.get('window').width - 80 }]}
              >
                {loginType === 'email' ? (
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
                      keyboardType="email-address"
                      autoCapitalize="none"
                      labelStyle={styles.inputLabel}
                    />
                  </View>
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
                    error={errorMessage?.combine ? errorMessage.combine : null}
                    style={styles.input}
                    labelStyle={styles.inputLabel}
                  />
                </View>
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
                  ref={signInref}
                  onPress={handleSignIn}
                  style={[
                    styles.signInButton,
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
                    <LogIn size={20} color="#FFFFFF" style={{marginRight: 8}} />
                    <Text style={styles.buttonText}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

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
    position: 'relative',
    overflow: 'hidden',
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    paddingTop: 50,
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
    marginBottom: 40,
    marginTop: 30,
    zIndex: 1,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 30,
  },
  lookLogo: {
    width: 180,
    height: 70,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 38,
    fontFamily: 'default-bold',
    marginBottom: 14,
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 26,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 5,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    width: '85%',
    alignSelf: 'center',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'default-medium',
    fontSize: 15,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#8B5CF6',
    fontFamily: 'default-semibold',
  },
  activeTabIndicator: {
    position: 'absolute',
    height: 3,
    width: '40%',
    backgroundColor: '#8B5CF6',
    bottom: 3,
    borderRadius: 1.5,
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
    zIndex: 2,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 18,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: theme.colors.primary.purple,
    fontFamily: 'default-medium',
    fontSize: 14,
  },
  errorMessage: {
    color: "#EF4444",
    marginBottom: 20,
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
    marginTop: 20,
    width: Dimensions.get('window').width - 30,
    zIndex: 2,
  },
  signInButton: {
    width: "100%",
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
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
    position: 'relative',
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
    alignSelf: 'center',
  },
  textHighlight: {
    color: theme.colors.primary.purple,
    fontFamily: 'default-semibold',
  },
  sparkleContainer: {
    position: 'absolute',
    right: 20,
  },
  formCardGradient: {
    width: '85%',
    alignSelf: 'center',
    borderRadius: 20,
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
});
