'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { initializeAuth } from '@/store/slices/authSlice';
import { validateToken } from '@/store/thunks/authThunk';

export default function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(initializeAuth());
    dispatch(validateToken());
  }, [dispatch]);

  return null;
}