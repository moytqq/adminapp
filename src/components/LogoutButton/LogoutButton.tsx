'use client';

import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/store/store';
import { logout } from '@/store/slices/authSlice';
import { LogOut } from 'lucide-react';
import styles from './LogoutButton.module.scss';

export default function LogoutButton() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className={styles.logoutButtonContainer}>
      <button
        className={styles.logoutButton}
        onClick={handleLogout}>
        <LogOut size={24} />
      </button>
    </div>

  );
}