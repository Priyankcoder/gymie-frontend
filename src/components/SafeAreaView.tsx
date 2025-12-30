import React from 'react';
import { SafeAreaView as RNSafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

/**
 * Native SafeAreaView component (iOS/Android)
 * Uses react-native-safe-area-context for proper safe area handling
 * Web version is in SafeAreaView.web.tsx
 */
export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  style,
  edges,
  ...props
}) => {
  return (
    <RNSafeAreaView style={style} edges={edges} {...props}>
      {children}
    </RNSafeAreaView>
  );
};

export default SafeAreaView;
