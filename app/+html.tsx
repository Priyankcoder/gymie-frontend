
import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Primary Meta Tags */}
        <title>Gymie - Track Every Rep. Build Real Strength.</title>
        <meta
          name="description"
          content="Log workouts, track nutrition, measure progress. Everything you need to build muscle and strength. 100% private. Free forever. 10,000+ lifters trust Gymie."
        />
        <meta
          name="keywords"
          content="fitness app, workout tracker, nutrition tracking, Indian food recognition, AI fitness, offline fitness app, meal tracker, gym app, bodybuilding app, weight loss app"
        />
        <meta name="author" content="Gymie" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gymie" />
        <meta property="og:title" content="Gymie - Track Every Rep. Build Real Strength." />
        <meta
          property="og:description"
          content="Log workouts, track nutrition, measure progress. Everything you need to build muscle and strength. 100% private. Free forever."
        />
        <meta property="og:url" content="https://gymie.fit" />
        <meta property="og:image" content="https://gymie.fit/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Gymie - AI-Powered Fitness Tracker" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@gymieapp" />
        <meta name="twitter:creator" content="@gymieapp" />
        <meta name="twitter:title" content="Gymie - Track Every Rep. Build Real Strength." />
        <meta
          name="twitter:description"
          content="Log workouts, track nutrition, measure progress. 100% private. Free forever. Join 10,000+ lifters."
        />
        <meta name="twitter:image" content="https://gymie.fit/twitter-card.png" />
        <meta name="twitter:image:alt" content="Gymie App Screenshot" />

        {/* Mobile App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Gymie" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#667eea" />

        {/* App Store Links */}
        <meta property="al:ios:url" content="gymie://app" />
        <meta property="al:ios:app_store_id" content="123456789" />
        <meta property="al:ios:app_name" content="Gymie" />
        <meta property="al:android:url" content="gymie://app" />
        <meta property="al:android:app_name" content="Gymie" />
        <meta property="al:android:package" content="com.gymie.app" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://gymie.fit" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Gymie',
              url: 'https://gymie.fit',
              logo: 'https://gymie.fit/logo.png',
              description: 'Serious workout and nutrition tracking app for disciplined lifters',
              sameAs: [
                'https://twitter.com/gymieapp',
                'https://facebook.com/gymieapp',
                'https://instagram.com/gymieapp',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@gymie.fit',
              },
            }),
          }}
        />

        {/* Structured Data - Mobile Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MobileApplication',
              name: 'Gymie',
              operatingSystem: 'iOS, Android',
              applicationCategory: 'HealthApplication',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '10000',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              description:
                'Track workouts, calories, and body metrics. Visualize progress over time. Built for serious training with complete data privacy.',
              features: [
                'Exercise logging with sets, reps, weight',
                'Calorie and macro tracking',
                'Progress charts and analytics',
                'Body measurements and photos',
                'Workout planning and routines',
              ],
            }),
          }}
        />

        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Gymie',
              url: 'https://gymie.fit',
              description: 'AI-powered fitness tracking app',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://gymie.fit/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* Structured Data - SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Gymie',
              operatingSystem: 'iOS 13.0 or later, Android 8.0 or later',
              applicationCategory: 'HealthApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '10000',
                bestRating: '5',
                worstRating: '1',
              },
              description:
                'Track workouts, calories, and body metrics with clarity and discipline. Visualize strength gains and progress over time. Built for serious training with complete data privacy.',
              screenshot: 'https://gymie.fit/screenshots/app-screenshot.png',
              softwareVersion: '1.0.0',
              datePublished: '2026-01-01',
              author: {
                '@type': 'Organization',
                name: 'Gymie',
              },
            }),
          }}
        />

        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
