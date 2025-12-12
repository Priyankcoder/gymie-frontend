
import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IconName;
  color: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ name, color, focused }) => {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
};

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentBlue,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'barbell' : 'barbell-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'nutrition' : 'nutrition-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'construct' : 'construct-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
  },
  iconContainerFocused: {
    // Add subtle highlight for focused state
  },
});
