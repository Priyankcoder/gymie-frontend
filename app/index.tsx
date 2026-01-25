import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/contexts/ThemeContext";
import LandingPage from "../src/components/landing/LandingPage";

export default function Index() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  
  const isWeb = Platform.OS === 'web';
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

    // Mobile unauthenticated users at root should go to login
    // Web users stay on landing page (no redirect)
    if (!isWeb && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, segments]);

  // Only render something if we're at the root path
  if (!isRootPath) {
    // Let Expo Router handle auth routes like /login, /register, /verify-email
    return null;
  }

  // Show loading spinner while checking auth (only at root)
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  // Show landing page on web at root path (unauthenticated)
  if (isWeb && !isAuthenticated) {
    return <LandingPage />;
  }

  // Fallback loading (shouldn't normally reach here)
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
