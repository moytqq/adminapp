'use client';

import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/store/store';
import { logout } from '@/store/slices/authSlice';

export default function LogoutButton() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  return (
    <button onClick={handleLogout}>
      Выйти
    </button>
  );
}