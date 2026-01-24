
/**
 * Custom Modal Hook
 * Provides easy state management for CustomModal component
 */

import { useState, useCallback } from 'react';
import { ModalType } from '../components/common/CustomModal';

interface ModalConfig {
  type?: ModalType;
  title: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
}

export const useCustomModal = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    type: 'info',
    title: '',
    message: '',
    primaryButtonText: 'OK',
  });

  const showModal = useCallback((modalConfig: ModalConfig) => {
    setConfig({
      type: modalConfig.type || 'info',
      title: modalConfig.title,
      message: modalConfig.message,
      primaryButtonText: modalConfig.primaryButtonText || 'OK',
      secondaryButtonText: modalConfig.secondaryButtonText,
      onPrimaryPress: modalConfig.onPrimaryPress,
      onSecondaryPress: modalConfig.onSecondaryPress,
    });
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
  }, []);

  const showSuccess = useCallback((title: string, message: string, onPress?: () => void) => {
    showModal({
      type: 'success',
      title,
      message,
      onPrimaryPress: onPress,
    });
  }, [showModal]);

  const showError = useCallback((title: string, message: string, onPress?: () => void) => {
    showModal({
      type: 'error',
      title,
      message,
      onPrimaryPress: onPress,
    });
  }, [showModal]);

  const showWarning = useCallback((title: string, message: string, onPress?: () => void) => {
    showModal({
      type: 'warning',
      title,
      message,
      onPrimaryPress: onPress,
    });
  }, [showModal]);

  const showInfo = useCallback((title: string, message: string, onPress?: () => void) => {
    showModal({
      type: 'info',
      title,
      message,
      onPrimaryPress: onPress,
    });
  }, [showModal]);

  return {
    visible,
    config,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
