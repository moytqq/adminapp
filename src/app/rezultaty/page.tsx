// app/rezultaty/page.tsx

'use client';

import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage/PlaceholderPage';
import { BarChart3 } from 'lucide-react';

const RezultatyPage = () => {
  return (
    <PlaceholderPage
      title="Результаты"
      description="Здесь будет отображаться статистика продаж, отчёты и аналитика эффективности"
      icon={<BarChart3 size={48} />}
      color="#9c27b0"
    />
  );
};

export default RezultatyPage;