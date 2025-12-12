
import React, { ReactNode } from 'react';
import { 
  Pressable, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps {
  title?: string;
  children?: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors, borderRadius, typography } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.accentBlue;
      case 'secondary':
        return colors.softAccent;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.accentBlue;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return colors.accentBlue;
      default:
        return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 20 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 28 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 20 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'md':
        return 16;
      case 'lg':
        return 18;
      default:
        return 16;
    }
  };

  const buttonStyle: ViewStyle[] = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      borderRadius: borderRadius.md,
      ...getPadding(),
    },
    ...(variant === 'outline' ? [{
      borderWidth: 1.5,
      borderColor: disabled ? colors.border : colors.accentBlue,
    }] : []),
    ...(style ? [style] : []),
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        buttonStyle,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          {title ? (
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: getFontSize(),
                  fontWeight: typography.body.fontWeight,
                  marginLeft: icon ? 8 : 0,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;
