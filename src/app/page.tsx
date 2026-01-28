'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const Page = () => {
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token) {
      router.push('/main');
    } else {
      router.push('/login');
    }
  }, [token, router]);
}
export default Page;