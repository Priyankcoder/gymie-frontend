# Node Version Update to Node 20

## Overview
This project now requires **Node.js version 20.19.4 or higher** to run properly. The recent dependency updates, particularly React Native 0.81.5 and Metro bundler, require this minimum version.

## What Changed
- Created [`.nvmrc`](frontend/.nvmrc) file specifying Node 20
- Updated all npm dependencies to their latest compatible versions
- Added `engines` field in [`package.json`](frontend/package.json) to enforce Node 20 requirement

## How to Switch to Node 20

### Option 1: Using NVM (Node Version Manager) - Recommended

If you have NVM installed:

```bash
# Navigate to the frontend directory
cd frontend

# Install Node 20 (if not already installed)
nvm install 20

# Use Node 20
nvm use 20

# Verify the version
node --version  # Should show v20.x.x
```

### Option 2: Using fnm (Fast Node Manager)

```bash
# Install Node 20
fnm install 20

# Use Node 20
fnm use 20

# Verify the version
node --version
```

### Option 3: Direct Installation

Download and install Node 20 from the official website:
- Visit: https://nodejs.org/
- Download Node 20 LTS
- Install and verify with `node --version`

## Reinstalling Dependencies

After switching to Node 20, reinstall dependencies:

```bash
cd frontend

# Remove old node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clean npm cache (optional but recommended)
npm cache clean --force

# Install dependencies with Node 20
npm install
```

## Why Node 20?

The following core packages now require Node 20.19.4+:
- `react-native@0.81.5`
- `metro@0.83.3` and all metro-related packages
- `@react-native/*` packages
- `expo-server@1.0.5`

## Troubleshooting

If you see warnings about unsupported engine:
1. Verify you're using Node 20: `node --version`
2. If using NVM, ensure you're in the correct directory and run `nvm use`
3. Clear npm cache and reinstall: `rm -rf node_modules && npm install`

## Project Scripts

All existing scripts work the same way:
```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm test           # Run tests
```
