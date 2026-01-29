import React from 'react';
import Favorites from '@/components/Favorites/Favorites';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

const FavoritesPage = () => {
  return (
    <ProtectedRoute>
      <Favorites />
    </ProtectedRoute>
  );
};

export default FavoritesPage;