import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/contexts/ThemeContext";

export default function Index() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  
  const isRootPath = segments.length === 0;

  useEffect(() => {
    if (isLoading) return;

    // Only handle redirects for root path - let other routes render naturally
    if (!isRootPath) return;

    // Authenticated users at root should go to main app
    if (isAuthenticated) {
      router.replace("/(tabs)");
      return;
    }

    // Unauthenticated users at root should go to login (web & mobile)
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, segments]);

  // Only render something if we're at the root path
  if (!isRootPath) {
    // Let Expo Router handle auth routes like /login, /register, /verify-email
    return null;
  }

  // Show loading spinner while checking auth (only at root)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accentBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
