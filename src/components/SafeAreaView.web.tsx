
import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

/**
 * Web-specific SafeAreaView component
 * Uses a regular View since web doesn't need safe area handling
 */
interface SafeAreaViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};

export default SafeAreaView;
