import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot, SplashScreen, Tabs, Stack } from "expo-router";
import Toast, { BaseToast, ErrorToast, ToastConfig } from "react-native-toast-message";
import { OnBoardingContext, OnBoardingProvider } from "./(onboarding)/context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";
import theme from "@/styles/theme";
import React from "react";
import Constants from 'expo-constants';
import { ImageProvider } from "@/common/providers/image-search";
import { ScreenHistoryProvider } from "@/common/providers/screen-history";
import { UserDetailsProvider } from "@/common/providers/user-details";
import LinearGradient from "react-native-linear-gradient";

const publishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log({ publishableKey })

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in older versions)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Custom toast configuration to match the design
const toastConfig: ToastConfig = {
  success: ({ text1, text2, props, ...rest }) => (
    <View style={[styles.toastContainer, { backgroundColor: "#ecfdf3" }]}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, styles.successCircle]}>
          <Text style={styles.iconText}>✓</Text>
        </View>
      </View>
      <View style={styles.toastTextContainer}>
        <Text style={[styles.toastText, { color: theme.colors.primary.green }]}>{text1}</Text>
        {text2 && text2.length ? <Text style={[styles.toastText, { color: theme.colors.primary.green }]}>{text2}</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => Toast.hide()}
      >
        <X size={20} color={theme.colors.secondary.darkGray} />
      </TouchableOpacity>
    </View>
  ),
  error: ({ text1, text2, props, ...rest }) => (
    <View style={styles.toastContainer}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, styles.errorCircle]}>
          <Text style={styles.iconText}>✕</Text>
        </View>
      </View>
      <Text style={styles.toastText}>{text1}</Text>
      {text2 && text2.length ? <Text style={styles.toastText}>{text2}</Text> : <></>}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => Toast.hide()}
      >
        <X size={20} color="#FF0000" />
      </TouchableOpacity>
    </View>
  ),
  info: ({ text1, text2, props, ...rest }) => (
    <View style={styles.toastContainer}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, styles.infoCircle]}>
          <Text style={styles.iconText}>i</Text>
        </View>
      </View>
      <Text style={styles.toastText}>{text1}</Text>
      {text2 && <Text style={styles.toastText}>{text2}</Text>}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => Toast.hide()}
      >
        <X size={20} color="#FF0000" />
      </TouchableOpacity>
    </View>
  ),
  warning: ({ text1, props, ...rest }) => (
    <View style={styles.toastContainer}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, styles.warningCircle]}>
          <Text style={styles.iconText}>!</Text>
        </View>
      </View>
      <Text style={styles.toastText}>{text1}</Text>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => Toast.hide()}
      >
        <X size={20} color="#FF0000" />
      </TouchableOpacity>
    </View>
  ),
  itemRemoved: ({ text1, props, ...rest }) => {
    const onUndo = props?.onUndo || (() => {});
    const removedItem = props?.itemName || '';
    
    return (
      <View style={styles.slideToastContainer}>
        <LinearGradient
          colors={['#f5f5f5', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.slideToastContent}
        >
          <View style={styles.toastInfoContainer}>
            <View style={styles.removeIconContainer}>
              <X size={10} color="#FFFFFF" />
            </View>
            <Text style={styles.slideToastText}>{text1}</Text>
            {removedItem ? <Text style={styles.itemNameText} numberOfLines={1}>{removedItem}</Text> : null}
          </View>
          
          <View style={styles.toastActionContainer}>
            <TouchableOpacity 
              style={styles.undoButton} 
              onPress={onUndo}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.undoButtonText}>UNDO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.slideCloseButton}
              onPress={() => Toast.hide()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={14} color="#6C6C6C" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  },
};


export default function RootLayout() {

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={DefaultTheme}>
            <ImageProvider>
              <ScreenHistoryProvider>
                <OnBoardingProvider>
                  <Slot />
                </OnBoardingProvider>
              </ScreenHistoryProvider>
            </ImageProvider>
          <Toast
            position='top'
            topOffset={50}
            visibilityTime={4000}
            autoHide={true}
            config={toastConfig}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginHorizontal: '5%',
    alignContent: 'center',
    justifyContent: 'center',
    height: "100%",

  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    backgroundColor: '#4CAF50', // Green
  },
  errorCircle: {
    backgroundColor: '#F44336', // Red
  },
  warningCircle: {
    backgroundColor: '#FF9800', // Orange
  },
  infoCircle: {
    backgroundColor: '#2196F3', // Blue
  },
  iconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  checkmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toastText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    lineHeight: 18, // match or slightly more than fontSize
    marginVertical: 0,
    paddingVertical: 0,
  },
  closeButton: {
    padding: 4,
  },
  toastTextContainer: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
    height: "100%",
  },
  // New Slide Toast Styles
  slideToastContainer: {
    width: '90%', 
    maxWidth: 400,
    borderRadius: 8,
    marginHorizontal: '5%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  slideToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    borderRadius: 8,
  },
  removeIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#888888',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  slideToastText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  itemNameText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 26,
    marginTop: 2,
    maxWidth: 180,
  },
  toastActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoButton: {
    paddingHorizontal: 8,
    paddingVertical: 4, 
    marginRight: 8,
  },
  undoButtonText: {
    color: theme.colors.primary.purple,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  slideCloseButton: {
    padding: 2,
  },
  toastInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
