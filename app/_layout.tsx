
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { AppDataProvider } from '../src/contexts/AppDataContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeGoogleSignIn } from '../src/services/socialAuth';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SOCIAL_AUTH_CONFIG } from '../src/config/socialAuth';

function RootLayoutNav() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Initialize Google Sign-In on native platforms
    if (Platform.OS !== 'web') {
      initializeGoogleSignIn();
    }
  }, []);

  const content = (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <AppDataProvider>
              <RootLayoutNav />
            </AppDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );

  // Wrap web with GoogleOAuthProvider
  if (Platform.OS === 'web') {
    return (
      <GoogleOAuthProvider clientId={SOCIAL_AUTH_CONFIG.google.webClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;

  // Temporarily commented out SafeAreaProvider to debug
  // const content = (
  //   <ErrorBoundary>
  //     <GestureHandlerRootView style={{ flex: 1 }}>
  //       <ThemeProvider>
  //         <AuthProvider>
  //           <AppDataProvider>
  //             <RootLayoutNav />
  //           </AppDataProvider>
  //         </AuthProvider>
  //       </ThemeProvider>
  //     </GestureHandlerRootView>
  //   </ErrorBoundary>
  // );

  // // Only use SafeAreaProvider on native platforms
  // if (Platform.OS === 'web') {
  //   return content;
  // }

  // return <SafeAreaProvider>{content}</SafeAreaProvider>;
}
