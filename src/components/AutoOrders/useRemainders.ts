'use client';

import { useState, useEffect } from 'react';
import { remaindersApi, RemainderForm } from '@/services/remaindersApi';

export const useRemainders = () => {
  const [forms, setForms] = useState<RemainderForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<RemainderForm | null>(null);
  const [loadingForms, setLoadingForms] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoadingForms(true);
    try {
      const data = await remaindersApi.getFormsList();
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoadingForms(false);
    }
  };

  const selectForm = (form: RemainderForm) => {
    setSelectedForm(form);
  };

  const backToForms = () => {
    setSelectedForm(null);
  };

  return {
    forms,
    selectedForm,
    loadingForms,
    selectForm,
    backToForms,
  };
};