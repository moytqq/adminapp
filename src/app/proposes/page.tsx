'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import PlaceholderPage from '@/components/PlaceholderPage/PlaceholderPage';
import { Lightbulb } from 'lucide-react';

const ProposesPage = () => {
  return (
    <ProtectedRoute requiredFlags={['ADMIN']} redirectTo="/main">
      <PlaceholderPage
        title="Предложения"
        description="Здесь будут отображаться идеи сотрудников, предложения по улучшению и голосования"
        icon={<Lightbulb size={48} />}
        color="#f44336"
      />
    </ProtectedRoute>
  );
};

export default ProposesPage;