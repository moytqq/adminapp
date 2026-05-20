'use client';

import React from 'react';
import Favorites from '@/components/Favorites/Favorites';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import PageTitle from '@/components/PageTitle/PageTitle';

const FavoritesPage = () => {
  return (
    <ProtectedRoute>
      <PageTitle title="Избранное" />
      <Favorites />
    </ProtectedRoute>
  );
};

export default FavoritesPage;