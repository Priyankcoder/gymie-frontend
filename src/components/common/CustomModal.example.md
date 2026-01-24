
# CustomModal Component Usage Examples

The `CustomModal` component is a reusable, cross-platform modal with consistent design across Android, iOS, and Web.

## Features
- ✅ Cross-platform (Android, iOS, Web)
- ✅ 6 modal types: success, error, warning, info, confirm, destructive
- ✅ Custom icons and colors for each type
- ✅ iOS blur effect and Android solid overlay
- ✅ Primary and secondary action buttons
- ✅ Custom icon override support
- ✅ Consistent design with theme integration
- ✅ Easy state management with `useCustomModal` hook

## Basic Usage

### 1. Import the hook and component
```typescript
import { CustomModal } from '../../src/components/common/CustomModal';
import { useCustomModal } from '../../src/hooks/useCustomModal';
```

### 2. Initialize in your component
```typescript
const modal = useCustomModal();
```

### 3. Add the modal to your JSX
```typescript
<CustomModal
  visible={modal.visible}
  type={modal.config.type}
  title={modal.config.title}
  message={modal.config.message}
  primaryButtonText={modal.config.primaryButtonText}
  secondaryButtonText={modal.config.secondaryButtonText}
  onPrimaryPress={() => {
    modal.config.onPrimaryPress?.();
    modal.hideModal();
  }}
  onSecondaryPress={modal.config.onSecondaryPress}
  onClose={modal.hideModal}
/>
```

## Examples

### Success Modal
```typescript
modal.showSuccess(
  'Success!',
  'Your changes have been saved successfully.',
  () => {
    modal.hideModal();
    router.push('/dashboard');
  }
);
```

### Error Modal
```typescript
modal.showError(
  'Error',
  'Something went wrong. Please try again.',
  () => modal.hideModal()
);
```

### Warning Modal
```typescript
modal.showWarning(
  'Warning',
  'This action cannot be undone. Are you sure?',
  () => modal.hideModal()
);
```

### Info Modal
```typescript
modal.showInfo(
  'Information',
  'Your session will expire in 5 minutes.',
  () => modal.hideModal()
);
```

### Confirm Modal
```typescript
modal.showModal({
  type: 'confirm',
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed with this action?',
  primaryButtonText: 'Yes',
  secondaryButtonText: 'No',
  onPrimaryPress: () => {
    modal.hideModal();
    handleAction();
  },
  onSecondaryPress: () => modal.hideModal(),
});
```

### Destructive Modal (e.g., Logout, Delete)
```typescript
modal.showModal({
  type: 'destructive',
  title: 'Logout',
  message: 'Are you sure you want to logout?',
  primaryButtonText: 'Logout',
  secondaryButtonText: 'Cancel',
  onPrimaryPress: () => {
    modal.hideModal();
    handleLogout();
  },
  onSecondaryPress: () => modal.hideModal(),
});
```

### Custom Modal with Custom Icon
```typescript
modal.showModal({
  type: 'destructive',
  title: 'Delete Account',
  message: 'This action cannot be undone. All your data will be permanently deleted.',
  primaryButtonText: 'Delete',
  secondaryButtonText: 'Cancel',
  customIcon: 'trash-outline',
  customIconColor: '#EF4444',
  onPrimaryPress: () => {
    modal.hideModal();
    handleDeleteAccount();
  },
  onSecondaryPress: () => modal.hideModal(),
});
```

## API Reference

### useCustomModal Hook

#### Methods
- `showModal(config)` - Show modal with custom configuration
- `showSuccess(title, message, onPress?)` - Show success modal
- `showError(title, message, onPress?)` - Show error modal
- `showWarning(title, message, onPress?)` - Show warning modal
- `showInfo(title, message, onPress?)` - Show info modal
- `hideModal()` - Hide the modal

#### Properties
- `visible` - Boolean indicating if modal is visible
- `config` - Current modal configuration

### CustomModal Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | boolean | Yes | Controls modal visibility |
| `type` | 'success' \| 'error' \| 'warning' \| 'info' \| 'confirm' \| 'destructive' | No | Modal type (default: 'info') |
| `title` | string | Yes | Modal title |
| `message` | string | Yes | Modal message |
| `primaryButtonText` | string | No | Primary button text (default: 'OK') |
| `secondaryButtonText` | string | No | Secondary button text |
| `onPrimaryPress` | () => void | Yes | Primary button handler |
| `onSecondaryPress` | () => void | No | Secondary button handler |
| `onClose` | () => void | No | Close handler (e.g., for backdrop tap) |
| `customIcon` | keyof typeof Ionicons.glyphMap | No | Override default icon |
| `customIconColor` | string | No | Override default icon color |

## Styling

The modal automatically adapts to your theme colors through the `useTheme` hook. It uses:
- `colors.cardBackground` for modal background (with Android transparency fallback)
- `colors.textPrimary` for title
- `colors.textSecondary` for message
- `colors.border` for secondary button

Each modal type has its own icon color:
- Success: `#10B981` (green)
- Error: `#EF4444` (red)
- Warning: `#F59E0B` (orange)
- Info: `#3B82F6` (blue)
- Confirm: Theme's `colors.primary`
- Destructive: `#EF4444` (red)

You can override the icon and color using `customIcon` and `customIconColor` props.

## Platform Differences

The modal renders consistently across platforms with appropriate shadows:
- **iOS**: Uses `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- **Android**: Uses `elevation`
- **Web**: Uses CSS `boxShadow`
