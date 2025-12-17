
/**
 * Custom hook for managing modal state
 * Replaces multiple boolean states with a single managed state
 */

import { useState, useCallback } from 'react';

export type ModalType = 
  | 'exercise'
  | 'rest'
  | 'template'
  | 'prebuiltPlans'
  | 'planDetails'
  | 'planCustomization'
  | 'dayExercises'
  | 'recurrence'
  | 'calendar'
  | 'addMeal'
  | 'aiEstimate'
  | 'recipe'
  | 'exercisePicker'
  | 'weightModal'
  | null;

interface ModalState<T = any> {
  type: ModalType;
  data?: T;
}

export const useModalManager = () => {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const openModal = useCallback(<T = any>(type: ModalType, data?: T) => {
    setModalState({ type, data });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  const isOpen = useCallback((type: ModalType): boolean => {
    return modalState?.type === type;
  }, [modalState]);

  const getModalData = useCallback(<T = any>(): T | undefined => {
    return modalState?.data as T;
  }, [modalState]);

  return {
    activeModal: modalState?.type || null,
    modalData: modalState?.data,
    openModal,
    closeModal,
    isOpen,
    getModalData,
  };
};
