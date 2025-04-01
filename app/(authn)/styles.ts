import theme from "@/styles/theme";
import { StyleSheet } from "react-native";

export const authnStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: theme.colors.primary.lavender,
  },
  ctaActionContainer: {
    backgroundColor: theme.colors.secondary.black,
    padding: 15,
    borderRadius: 24,
    width: 300,
    alignItems: "center",
  },
  ctaActionText: {
    color: theme.colors.primary.white,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "default-semibold",
  },
  errorMessage: {
    color: "red",
    marginBottom: 10,
    fontFamily: "default-medium",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "default-semibold",
  },
});
