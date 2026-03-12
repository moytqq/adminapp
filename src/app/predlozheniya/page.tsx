'use client';

import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage/PlaceholderPage';
import { Lightbulb } from 'lucide-react';

const PredlozheniyaPage = () => {
  return (
    <PlaceholderPage
      title="Предложения"
      description="Здесь будут отображаться идеи сотрудников, предложения по улучшению и голосования"
      icon={<Lightbulb size={48} />}
      color="#f44336"
    />
  );
};

export default PredlozheniyaPage;