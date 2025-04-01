import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
  Button,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../../../styles/theme";
import SearchOptions from "./search-options";
import InputText from "@/components/text-input";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

// Get environment variables
const ENV = Constants.expoConfig?.extra || {};

console.log(`Using environment: ${ENV.ENV}`);
console.log(`API URL: ${ENV.AUTH_API_CLERK}`);

const ChatScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [personalized, setPersonalized] = useState(false);
  const [secondhand, setSecondhand] = useState(false);
  const bodyRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const cardRef = useRef<View>(null);

  const suggestionItems = [
    "Find a wool coat, in a solid color perfect for winter under $200",
    "Retro but timeless color block high-top boots",
    "I need a black & white jumpsuit with a vintage vibe for a special night out",
    "Affordable winter jackets",
  ];

  return (
    <LinearGradient
      colors={[theme.colors.primary.lavender, theme.colors.primary.periwinkle]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
          style={styles.keyboardAvoidingContainer}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            <View ref={cardRef} style={styles.card}>
              <View ref={bodyRef}>
                <View style={styles.headerContainer}>
                  <Text style={styles.chatTitle}>
                    <Text style={[styles.pinkText]}>chat to shop</Text>
                    <Text style={[styles.purpleText]}>
                      {" "}
                      over{" "}
                      <View style={styles.billionHighlight}>
                        <Text
                          style={[
                            [
                              styles.chatTitle,
                              styles.purpleText,
                              styles.billionHighlight,
                            ],
                          ]}
                        >
                          1 billion
                        </Text>
                        <View style={styles.underline} />
                      </View>{" "}
                      fashion products
                    </Text>
                  </Text>
                </View>
                <SearchOptions />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsContainer}
                >
                  {suggestionItems.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.suggestionItem}>
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.footer}>
                <View style={styles.searchContainer}>
                  <TextInput
                    onFocus={() => {
                      if (bodyRef.current) {
                        bodyRef.current.setNativeProps({
                          style: { display: "none" },
                        });
                      }
                    }}
                    onBlur={() => {
                      if (bodyRef.current) {
                        bodyRef.current.setNativeProps({
                          style: { display: "flex" },
                        });
                      }
                    }}
                    style={styles.searchInput}
                    placeholder="Search for any fashion item..."
                    placeholderTextColor={theme.colors.secondary.darkGray}
                    value={searchText}
                    onChangeText={setSearchText}
                    textAlignVertical="top"
                    multiline
                  />
                  <Ionicons
                    name="send"
                    style={{ marginBottom: 2 }}
                    size={32}
                    color={theme.colors.secondary.black}
                  />
                </View>

                <View style={styles.disclaimerContainer}>
                  <Text style={styles.disclaimerText}>
                    AI can make mistakes. shop at your own risk.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
    position: "relative",
  },
  card: {
    backgroundColor: theme.colors.primary.white,
    borderRadius: theme.spacing.xl - 8,
    width: "100%",
    padding: theme.spacing.lg,
    shadowColor: theme.colors.secondary.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.opacity.low,
    shadowRadius: 4,
    elevation: 3,
    borderBottomEndRadius: 0,
    borderBottomLeftRadius: 0,
    marginTop: theme.spacing.md,
    height: "100%",
    marginBottom: 30,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    fontFamily: "default-semibold",
  },
  pinkText: {
    color: theme.colors.primary.pink,
  },
  purpleText: {
    color: theme.colors.primary.purple,
    marginTop: 0,
    marginBottom: 0,
  },
  underline: {
    position: "absolute",
    left: 0,
    bottom: -8,
    width: "100%",
    height: 2,
    backgroundColor: theme.colors.secondary.lightGray,
  },
  suggestionsContainer: {
    flexDirection: "row",
    marginTop: theme.spacing.lg,
    maxHeight: 100,
    position: "absolute",
    bottom: 0,
  },
  suggestionItem: {
    backgroundColor: theme.colors.secondary.veryLightGray,
    borderRadius: theme.spacing.xl - 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md - 4,
    marginRight: theme.spacing.sm + 2,
    maxWidth: 180,
  },
  suggestionText: {
    fontSize: 14,
    color: theme.colors.secondary.veryDarkGray,
    fontFamily: "default-regular",
  },
  searchContainer: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: theme.colors.secondary.veryLightGray,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.secondary.veryDarkGray,
    height: 50,
    textAlignVertical: "top",
    marginBottom: 10,
    width: "100%",
    flex: 1,
  },
  chatSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  chatSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary.veryLightGray,
    borderRadius: theme.spacing.xl - 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flex: 1,
    marginRight: theme.spacing.sm + 2,
  },
  chatIconContainer: {
    marginRight: theme.spacing.sm,
  },
  chatIcon: {
    fontSize: 18,
  },
  chatSearchText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  dropdownIcon: {
    opacity: theme.opacity.medium,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.secondary.veryLightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.secondary.darkGray,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary.veryLightGray,
    borderRadius: theme.spacing.xl - 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    width: "48%",
  },
  filterOptionActive: {
    backgroundColor: theme.colors.secondary.lightGray,
  },
  filterIcon: {
    marginRight: theme.spacing.sm,
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
    flex: 1,
  },
  toggleSwitch: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.secondary.mediumLightGray,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: theme.colors.secondary.mediumGray,
  },
  toggleButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary.white,
  },
  toggleButtonActive: {
    transform: [{ translateX: 16 }],
  },
  disclaimerContainer: {
    alignItems: "center",
  },
  disclaimerText: {
    fontSize: 14,
    color: theme.colors.secondary.mediumDarkGray,
  },
  billionHighlight: {
    position: "relative",
    top: 10,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    width: Dimensions.get("screen").width,
    right: 0,
    display: "flex",
    padding: 10,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    width: "100%"
  },
  scrollView: { flexGrow: 1 },
});

export default ChatScreen;
