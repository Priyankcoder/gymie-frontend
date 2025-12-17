
# Gymie - Fitness Tracking Mobile App

A comprehensive fitness tracking application built with React Native and Expo.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for emulators)
- Expo Go app on your physical device (optional)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

#### On iOS Simulator (Mac only)
```bash
npm run ios
```

#### On Android Emulator
```bash
npm run android
```

#### On Physical Device
1. Install Expo Go from App Store or Play Store
2. Scan the QR code shown in the terminal
3. App will load on your device

## 📱 Features

- **Workout Tracking**: Log exercises, sets, reps, and weights
- **Nutrition Logging**: Track meals, calories, and macros
- **Progress Tracking**: Monitor weight, measurements, and progress photos
- **User Profile**: Manage personal information and app settings
- **Offline Support**: Works without internet connection

## 🏗️ Project Structure

```
frontend/
├── app/                    # Expo Router pages
│   └── (tabs)/            # Tab navigation screens
├── src/
│   ├── components/        # React components
│   │   ├── features/     # Feature-specific components
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and data services
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, etc.
├── docs/                 # Documentation
└── __tests__/           # Test files

```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Current Test Coverage:**
- ✅ 100% coverage on utility functions
- ✅ 100% coverage on custom hooks
- 🔄 Component testing in progress

## 📚 Documentation

- **[Frontend Documentation](docs/README.md)** - Architecture, patterns, and guides
- **[API Contract](docs/API_CONTRACT.md)** - Backend API specification
- **[Project Root Docs](../docs/)** - Shared project documentation

## 🛠️ Development

### Adding a New Feature

1. Create feature components in `src/components/features/your-feature/`
2. Create custom hook in `src/hooks/useYourFeature.ts`
3. Add screen in `app/(tabs)/your-feature.tsx`
4. Update navigation if needed

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (run `npm run format`)
- **Linting**: ESLint (run `npm run lint`)

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```env
API_BASE_URL=https://api.gymie.com/v1
```

### App Configuration

Edit `app.json` or `app.config.js` for:
- App name and version
- Icons and splash screens
- Build settings
- Plugin configuration

## 📦 Building

### Development Build
```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Production Build
```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Local Builds
```bash
# iOS (requires Mac)
npm run prebuild
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npm run prebuild
npx react-native run-android
```

## 🐛 Troubleshooting

### Clear Cache
```bash
npm start -- --clear
```

### Reset Everything
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### iOS Pod Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Gradle Issues
```bash
cd android
./gradlew clean
cd ..
```

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **State Management**: React Context + Custom Hooks
- **Storage**: AsyncStorage
- **Testing**: Jest + React Native Testing Library
- **HTTP Client**: Axios (planned)

## 🔗 Backend Integration

The app is designed to work with a Go-based backend API. See [API_CONTRACT.md](docs/API_CONTRACT.md) for the complete API specification.

**Current Status:** Using mock data (`src/services/localApi.ts`)

**Next Steps:**
1. Replace mock API with real HTTP client
2. Implement authentication flow
3. Add error handling and retry logic
4. Implement offline sync

## 🤝 Contributing

1. Check existing issues or create a new one
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Add tests for new features
6. Ensure all tests pass
7. Submit a pull request

## 📄 License

[Add your license here]

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the [documentation](docs/README.md)
- Review the [API contract](docs/API_CONTRACT.md)

---

**Note**: This is the frontend application. For backend documentation, see [`../backend/`](../backend/)
