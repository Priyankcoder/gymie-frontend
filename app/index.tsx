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

  useEffect(() => {
    // Skip redirects on web - show landing page instead
    if (Platform.OS === 'web' && !isAuthenticated) {
      return;
    }

    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated (mobile only)
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace("/(tabs)");
    } else if (isAuthenticated && segments.length === 0) {
      // First load after authentication
      router.replace("/(tabs)");
    } else if (!isAuthenticated && segments.length === 0 && Platform.OS !== 'web') {
      // First load without authentication (mobile only)
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, segments]);

  // Show landing page on web for unauthenticated users
  if (Platform.OS === 'web' && !isAuthenticated && !isLoading) {
    return <LandingPage />;
  }

  // Show loading spinner while checking auth
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
