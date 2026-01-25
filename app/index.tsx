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
  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (isLoading) return;

    // Authenticated users should be in main app, not auth screens
    if (isAuthenticated && (inAuthGroup || isRootPath)) {
      router.replace("/(tabs)");
      return;
    }

    // Mobile: redirect unauthenticated users to login
    if (!isWeb && !isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    // Web: handled by render logic below (shows landing page or auth routes)
  }, [isAuthenticated, isLoading, segments]);

  // Show landing page on web at root path (unauthenticated)
  if (isWeb && !isAuthenticated && !isLoading && isRootPath) {
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
