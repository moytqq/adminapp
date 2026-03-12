'use client';

import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage/PlaceholderPage';
import { Calendar } from 'lucide-react';

const PlanirovschikPage = () => {
  return (
    <PlaceholderPage
      title="Планировщик"
      description="Здесь будет отображаться календарь задач, графики работы и планирование мероприятий"
      icon={<Calendar size={48} />}
      color="#4caf50"
    />
  );
};

export default PlanirovschikPage;