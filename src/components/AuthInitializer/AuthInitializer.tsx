'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { initializeAuth } from '@/store/slices/authSlice';
import { validateToken } from '@/store/thunks/authThunk';
import { useAuthListener } from '@/store/hooks/useAuthListener';
import { useTokenValidation } from '@/store/hooks/useTokenValidation';

export default function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const initialized = useRef(false);

  useAuthListener();

  //useTokenValidation(60000);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      dispatch(initializeAuth());
      dispatch(validateToken());
    }
  }, [dispatch]);

  return null;
}