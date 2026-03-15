import React from 'react';
import { Platform, StatusBar, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom' | 'left' | 'right';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  edges?: Edge[];
}

/**
 * Robust SafeAreaView for iOS and Android.
 * Uses useSafeAreaInsets with a StatusBar.currentHeight fallback for Android
 * to handle all device types (notch, punch-hole, status bar, home indicator).
 */
export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  style,
  edges,
}) => {
  const insets = useSafeAreaInsets();
  const activeEdges = edges ?? ['top', 'bottom', 'left', 'right'];

  const topInset = activeEdges.includes('top')
    ? insets.top || (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0)
    : 0;

  const bottomInset = activeEdges.includes('bottom') ? insets.bottom : 0;
  const leftInset = activeEdges.includes('left') ? insets.left : 0;
  const rightInset = activeEdges.includes('right') ? insets.right : 0;

  return (
    <View
      style={[
        { flex: 1 },
        {
          paddingTop: topInset,
          paddingBottom: bottomInset,
          paddingLeft: leftInset,
          paddingRight: rightInset,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default SafeAreaView;
