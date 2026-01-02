
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Card } from '../../../ui';
import { SettingItem } from './SettingItem';
import { useTheme } from '../../../../contexts/ThemeContext';

export const SettingsSection: React.FC = () => {
  const { colors, isDark, toggleTheme, typography } = useTheme();

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Notification settings will be available soon!');
  };

  const handleUnits = () => {
    Alert.alert('Units', 'Unit preferences will be available soon!');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Privacy settings will be available soon!');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Support options will be available soon!');
  };

  const handleAbout = () => {
    Alert.alert('About', 'Gymie v1.0.0\n\nYour personal fitness companion');
  };

  return (
    <View style={styles.container}>
      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.caption }]}>
          PREFERENCES
        </Text>
        <Card style={styles.card}>
          <SettingItem
            icon="moon-outline"
            label="Dark Mode"
            value={isDark}
            type="toggle"
            onToggle={toggleTheme}
          />
          <SettingItem
            icon="notifications-outline"
            label="Notifications"
            value="All"
            type="select"
            onPress={handleNotifications}
            hasBorder
          />
          <SettingItem
            icon="barbell-outline"
            label="Weight Units"
            value="kg"
            type="select"
            onPress={handleUnits}
            hasBorder
          />
        </Card>
      </View>

      {/* Privacy & Support Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.caption }]}>
          PRIVACY & SUPPORT
        </Text>
        <Card style={styles.card}>
          <SettingItem
            icon="shield-checkmark-outline"
            label="Privacy Settings"
            type="navigation"
            onPress={handlePrivacy}
          />
          <SettingItem
            icon="help-circle-outline"
            label="Help & Support"
            type="navigation"
            onPress={handleSupport}
            hasBorder
          />
        </Card>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.caption }]}>
          ABOUT
        </Text>
        <Card style={styles.card}>
          <SettingItem
            icon="information-circle-outline"
            label="App Version"
            value="1.0.0"
            type="info"
          />
          <SettingItem
            icon="logo-github"
            label="About Gymie"
            type="navigation"
            onPress={handleAbout}
            hasBorder
          />
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  card: {
    padding: 0,
  },
});
