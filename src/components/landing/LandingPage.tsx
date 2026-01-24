
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LandingPage() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const goToSignup = () => router.push('/(auth)/register');
  const goToLogin = () => router.push('/(auth)/login');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#fafafa' }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Integrated Social Proof */}
        <Animated.View 
          style={[
            styles.hero,
            { 
              backgroundColor: isDark ? '#0a0a0a' : '#fafafa',
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Trust Badge - Above the Fold */}
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeText}>
              ⭐ 4.9 Rating • 10,000+ Active Lifters
            </Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
              Track Every Rep.{'\n'}Build Real Strength.
            </Text>
            <Text style={[styles.heroSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Log workouts, track nutrition, measure progress.{'\n'}
              Everything you need to build muscle and strength.
            </Text>

            {/* Single Primary CTA */}
            <Pressable onPress={goToSignup} style={styles.primaryButton}>
              <LinearGradient
                colors={['#667eea', '#5a67d8']}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Start Free Today</Text>
              </LinearGradient>
            </Pressable>

            {/* Secondary CTA - Less Prominent */}
            <Pressable onPress={goToLogin} style={styles.textButton}>
              <Text style={[styles.textButtonText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Already training? Sign in →
              </Text>
            </Pressable>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatNumber, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
                500K+
              </Text>
              <Text style={[styles.quickStatLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Workouts Logged
              </Text>
            </View>
            <View style={[styles.quickStatDivider, { backgroundColor: isDark ? '#374151' : '#d1d5db' }]} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatNumber, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
                100% Private
              </Text>
              <Text style={[styles.quickStatLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Your Data Stays Yours
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Privacy & Trust Bar - High Priority for Health Apps */}
        <View style={[styles.trustBar, { backgroundColor: isDark ? '#111111' : '#ffffff' }]}>
          <View style={styles.trustBarContent}>
            <TrustItem icon="🔒" text="End-to-end encrypted" isDark={isDark} />
            <TrustItem icon="📱" text="Works offline" isDark={isDark} />
            <TrustItem icon="✓" text="HIPAA compliant" isDark={isDark} />
            <TrustItem icon="🚫" text="No ads, ever" isDark={isDark} />
          </View>
        </View>

        {/* Core Features - Benefit-Focused */}
        <View style={[styles.section, { backgroundColor: isDark ? '#0a0a0a' : '#fafafa' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
            Everything you need. Nothing you don't.
          </Text>
          
          <View style={styles.featuresGrid}>
            <FeatureCard
              number="01"
              title="Log Workouts Fast"
              description="Sets, reps, weight. Pre-filled from last time. In and out in 30 seconds."
              isDark={isDark}
            />
            <FeatureCard
              number="02"
              title="Track Nutrition"
              description="Calories, macros, meals. See exactly what fuels your gains."
              isDark={isDark}
            />
            <FeatureCard
              number="03"
              title="Measure Progress"
              description="Strength charts, body weight, photos. Watch yourself transform."
              isDark={isDark}
            />
            <FeatureCard
              number="04"
              title="Plan Your Training"
              description="Custom programs, workout templates, rest day scheduling."
              isDark={isDark}
            />
          </View>
        </View>

        {/* How It Works - Clear Process */}
        <View style={[styles.section, { backgroundColor: isDark ? '#111111' : '#ffffff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
            Simple to start. Powerful when you need it.
          </Text>

          <View style={styles.stepsContainer}>
            <StepCard
              step="1"
              title="Create Your Routine"
              description="Pick exercises. Set target reps and sets. Takes 2 minutes."
              isDark={isDark}
            />
            <StepCard
              step="2"
              title="Log During Training"
              description="Quick entry. Auto-filled from history. Focus on lifting, not typing."
              isDark={isDark}
            />
            <StepCard
              step="3"
              title="Track Your Gains"
              description="Charts show strength increases, volume trends, personal records."
              isDark={isDark}
            />
          </View>
        </View>

        {/* Who It's For - Clear Segments */}
        <View style={[styles.section, { backgroundColor: isDark ? '#0a0a0a' : '#fafafa' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
            Built for serious lifters at every level
          </Text>

          <View style={styles.audienceGrid}>
            <AudienceCard
              level="Beginner"
              description="Learn proper progression. Follow proven programs. Build consistency."
              isDark={isDark}
            />
            <AudienceCard
              level="Intermediate"
              description="Track progressive overload. Optimize volume and recovery. Hit new PRs."
              isDark={isDark}
            />
            <AudienceCard
              level="Advanced"
              description="Detailed analytics. Periodization planning. Peak for competitions."
              isDark={isDark}
            />
          </View>
        </View>

        {/* Privacy Deep Dive - Required for Health Apps */}
        <View style={[styles.section, { backgroundColor: isDark ? '#111111' : '#ffffff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
            Your health data is sacred
          </Text>

          <View style={styles.privacyContent}>
            <Text style={[styles.privacyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Gymie is built with privacy at its core. Your workout data, nutrition logs, 
              body measurements, and progress photos never leave your device without your 
              explicit permission. We don't sell data. We don't show ads. We don't track 
              you across the web.
            </Text>

            <View style={styles.privacyFeatures}>
              <PrivacyFeature
                title="Local-first storage"
                description="All data stored on your device. Sync only if you choose."
                isDark={isDark}
              />
              <PrivacyFeature
                title="End-to-end encryption"
                description="If you sync, data is encrypted before leaving your phone."
                isDark={isDark}
              />
              <PrivacyFeature
                title="No third-party trackers"
                description="No Facebook Pixel. No Google Analytics on sensitive screens."
                isDark={isDark}
              />
              <PrivacyFeature
                title="App Store compliant"
                description="Meets Apple Health and Google Fit privacy standards."
                isDark={isDark}
              />
            </View>
          </View>
        </View>

        {/* Proof - Real Numbers */}
        <View style={[styles.section, { backgroundColor: isDark ? '#0a0a0a' : '#fafafa' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
            Trusted by lifters worldwide
          </Text>

          <View style={styles.statsGrid}>
            <StatCard 
              number="10,000+" 
              label="Active Users" 
              detail="Growing daily"
              isDark={isDark}
            />
            <StatCard 
              number="500K+" 
              label="Workouts Logged" 
              detail="And counting"
              isDark={isDark}
            />
            <StatCard 
              number="4.9/5.0" 
              label="App Store Rating" 
              detail="2,000+ reviews"
              isDark={isDark}
            />
          </View>
        </View>

        {/* Final CTA - Clear Value Prop */}
        <View style={[styles.finalCta, { backgroundColor: isDark ? '#111111' : '#ffffff' }]}>
          <Text style={[styles.finalCtaTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
            Start building strength today
          </Text>
          <Text style={[styles.finalCtaSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Free forever. No credit card. No commitment.
          </Text>

          <Pressable onPress={goToSignup} style={styles.finalCtaButton}>
            <LinearGradient
              colors={['#667eea', '#5a67d8']}
              style={styles.finalCtaButtonGradient}
            >
              <Text style={styles.finalCtaButtonText}>Create Free Account</Text>
            </LinearGradient>
          </Pressable>

          <Text style={[styles.finalCtaFooter, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            Join 10,000+ lifters. Start tracking in under 60 seconds.
          </Text>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: isDark ? '#0a0a0a' : '#fafafa' }]}>
          <Text style={[styles.footerText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            © 2026 Gymie. Built for lifters, by lifters.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={[styles.footerLink, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Privacy Policy
            </Text>
            <Text style={[styles.footerDivider, { color: isDark ? '#374151' : '#d1d5db' }]}>
              {' • '}
            </Text>
            <Text style={[styles.footerLink, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Terms of Service
            </Text>
            <Text style={[styles.footerDivider, { color: isDark ? '#374151' : '#d1d5db' }]}>
              {' • '}
            </Text>
            <Text style={[styles.footerLink, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              support@gymie.fit
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Trust Item Component (for trust bar)
const TrustItem = ({ icon, text, isDark }: any) => (
  <View style={styles.trustItem}>
    <Text style={styles.trustItemIcon}>{icon}</Text>
    <Text style={[styles.trustItemText, { color: isDark ? '#e5e7eb' : '#374151' }]}>
      {text}
    </Text>
  </View>
);

// Feature Card Component - Simplified
const FeatureCard = ({ number, title, description, isDark }: any) => (
  <View style={[styles.featureCard, { 
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    borderColor: isDark ? '#2a2a2a' : '#e5e7eb',
  }]}>
    <Text style={[styles.featureNumber, { color: isDark ? '#667eea' : '#5a67d8' }]}>
      {number}
    </Text>
    <Text style={[styles.featureTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
      {title}
    </Text>
    <Text style={[styles.featureDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
      {description}
    </Text>
  </View>
);

// Step Card Component
const StepCard = ({ step, title, description, isDark }: any) => (
  <View style={styles.stepCard}>
    <View style={[styles.stepBadge, { 
      backgroundColor: isDark ? '#667eea' : '#5a67d8',
    }]}>
      <Text style={styles.stepBadgeText}>{step}</Text>
    </View>
    <Text style={[styles.stepTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
      {title}
    </Text>
    <Text style={[styles.stepDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
      {description}
    </Text>
  </View>
);

// Audience Card Component - Simplified
const AudienceCard = ({ level, description, isDark }: any) => (
  <View style={[styles.audienceCard, {
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    borderColor: isDark ? '#2a2a2a' : '#e5e7eb',
  }]}>
    <Text style={[styles.audienceLevel, { color: isDark ? '#667eea' : '#5a67d8' }]}>
      {level}
    </Text>
    <Text style={[styles.audienceDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
      {description}
    </Text>
  </View>
);

// Privacy Feature Component
const PrivacyFeature = ({ title, description, isDark }: any) => (
  <View style={styles.privacyFeature}>
    <Text style={[styles.privacyFeatureTitle, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
      ✓ {title}
    </Text>
    <Text style={[styles.privacyFeatureDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
      {description}
    </Text>
  </View>
);

// Stat Card Component
const StatCard = ({ number, label, detail, isDark }: any) => (
  <View style={styles.statCard}>
    <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#0a0a0a' }]}>
      {number}
    </Text>
    <Text style={[styles.statLabel, { color: isDark ? '#e5e7eb' : '#374151' }]}>
      {label}
    </Text>
    <Text style={[styles.statDetail, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
      {detail}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },

  // Hero Section
  hero: {
    paddingTop: isWeb ? 80 : 60,
    paddingBottom: isWeb ? 80 : 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  trustBadge: {
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  trustBadgeText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '700',
  },
  heroContent: {
    maxWidth: 700,
    width: '100%',
    alignItems: 'center',
    marginBottom: 50,
  },
  heroTitle: {
    fontSize: isWeb ? 56 : 38,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: isWeb ? 64 : 46,
    marginBottom: 20,
    letterSpacing: -1.5,
  },
  heroSubtitle: {
    fontSize: isWeb ? 19 : 17,
    textAlign: 'center',
    lineHeight: isWeb ? 30 : 26,
    marginBottom: 40,
    maxWidth: 600,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textButton: {
    paddingVertical: 8,
  },
  textButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickStatDivider: {
    width: 1,
    height: 40,
  },

  // Trust Bar
  trustBar: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  trustBarContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    maxWidth: 900,
    alignSelf: 'center',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustItemIcon: {
    fontSize: 18,
  },
  trustItemText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Section
  section: {
    paddingVertical: isWeb ? 80 : 60,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: isWeb ? 40 : 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 60,
    letterSpacing: -1,
    maxWidth: 800,
    alignSelf: 'center',
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  featureCard: {
    width: isWeb ? 250 : SCREEN_WIDTH - 40,
    padding: 28,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureNumber: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 1,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Steps Container
  stepsContainer: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 32,
    maxWidth: 1100,
    alignSelf: 'center',
  },
  stepCard: {
    flex: 1,
    minWidth: isWeb ? 280 : undefined,
    alignItems: isWeb ? 'flex-start' : 'center',
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepBadgeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: isWeb ? 'left' : 'center',
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: isWeb ? 'left' : 'center',
  },

  // Audience Grid
  audienceGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 24,
    maxWidth: 1100,
    alignSelf: 'center',
  },
  audienceCard: {
    flex: 1,
    minWidth: isWeb ? 300 : undefined,
    padding: 28,
    borderRadius: 12,
    borderWidth: 1,
  },
  audienceLevel: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  audienceDescription: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Privacy Content
  privacyContent: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  privacyText: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 40,
  },
  privacyFeatures: {
    gap: 24,
  },
  privacyFeature: {
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 114, 128, 0.1)',
  },
  privacyFeatureTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  privacyFeatureDescription: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
    justifyContent: 'center',
    maxWidth: 900,
    alignSelf: 'center',
  },
  statCard: {
    alignItems: 'center',
    minWidth: 180,
  },
  statNumber: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Final CTA
  finalCta: {
    paddingVertical: isWeb ? 100 : 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  finalCtaTitle: {
    fontSize: isWeb ? 44 : 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  finalCtaSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  finalCtaButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  finalCtaButtonGradient: {
    paddingHorizontal: 44,
    paddingVertical: 20,
  },
  finalCtaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  finalCtaFooter: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    fontSize: 14,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  footerLink: {
    fontSize: 14,
  },
  footerDivider: {
    fontSize: 14,
  },
});
