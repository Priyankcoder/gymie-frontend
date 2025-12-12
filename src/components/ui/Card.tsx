
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress,
  variant = 'default' 
}) => {
  const { colors, borderRadius, shadows } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      ...(variant === 'elevated' ? shadows.md : shadows.sm),
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

export default Card;
