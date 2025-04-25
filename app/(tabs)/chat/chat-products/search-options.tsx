import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import theme from "@/styles/theme";
import { IconSymbol, IconSymbolName } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ThemedText";

const { width } = Dimensions.get("window");
const cardWidth = (width - 64) / 2;

const SearchOptions = () => {
  const options: {
    id: string;
    title: string;
    description: string;
    gradientColors: string[];
    shadowColor: string;
    icon: IconSymbolName;
  }[] = [
    {
      id: "visual",
      title: "Visual Search",
      description: "Upload and find similar items",
      icon: "magnifyingglass",
      gradientColors: ["#ff6b8b", "#ff8fa3"],
      shadowColor: "rgba(255, 107, 139, 0.3)",
    },
    {
      id: "social",
      title: "Social Media",
      description: "Find items from TikTok/Instagram",
      icon: "globe.americas",
      gradientColors: ["#ff9e5e", "#ffbb7c"],
      shadowColor: "rgba(255, 158, 94, 0.3)",
    },
    {
      id: "outfit",
      title: "Outfit Matcher",
      description: "Match items with your wardrobe",
      icon: "shield.righthalf.filled",
      gradientColors: ["#4fdfff", "#7aebff"],
      shadowColor: "rgba(79, 223, 255, 0.3)",
    },
  ];

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.headerText}>
        Must Try
      </ThemedText>
      <View style={styles.optionsGrid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.8}
            style={[
              styles.optionCardContainer,
              { shadowColor: option.shadowColor },
            ]}
          >
            <View style={styles.optionCard}>
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={option.gradientColors}
                  style={styles.gradientCircle}
                >
                  <IconSymbol
                    color={"#fff"}
                    weight="medium"
                    size={20}
                    name={option.icon}
                  >
                    {option.icon}
                  </IconSymbol>
                </LinearGradient>
              </View>
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                <ThemedText style={styles.optionTitle}>
                  {option.title}
                </ThemedText>
                <ThemedText style={styles.optionDescription}>
                  {option.description}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  optionsGrid: {
    flexDirection: "column",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    width: "100%",
  },
  optionCardContainer: {
    width: "100%",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: "column",
  },
  optionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    borderWidth: 0.3,
  },
  iconCircle: {
    width: 40,
    height: 40,
    marginBottom: 0,
    borderRadius: 35,
    overflow: "hidden",
  },
  gradientCircle: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 30,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 0,
    textAlign: "center",
    color: "#333333",
    fontFamily: "default-medium",
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: "#888888",
    textAlign: "center",
    paddingHorizontal: 4,
    fontFamily: "default-regular",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "400",
    padding: theme.spacing.sm,
    fontFamily: "default-regular",
    textAlign: "center",
  },
});

export default SearchOptions;
