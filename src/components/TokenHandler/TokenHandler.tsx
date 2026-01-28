'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { checkTokenFromUrl } from '@/store/thunks/authThunk';
import { setTokenFromUrl, clearTokenFromUrl } from '@/store/slices/authSlice';

export default function TokenHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { token, status } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const handleTokenFromUrl = async () => {
      const pathParts = pathname.split('/');
      const tokenFromPath = pathParts[2];

      const tokenFromQuery = searchParams.get('token');

      const tokenToCheck = tokenFromPath || tokenFromQuery;

      if (tokenToCheck && !token && status !== 'loading') {
        try {
          dispatch(setTokenFromUrl(tokenToCheck));

          const result = await dispatch(checkTokenFromUrl(tokenToCheck)).unwrap();

          if (result.success) {
            dispatch(clearTokenFromUrl());

            router.push('/main');
          } else {
            router.push('/login');
          }
        } catch (error) {
          console.error('Ошибка при проверке токена из URL:', error);
          router.push('/login');
        }
      }
    };

    handleTokenFromUrl();
  }, [pathname, searchParams, dispatch, router, token, status]);

  return null;
}