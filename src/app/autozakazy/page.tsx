'use client';

import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage/PlaceholderPage';
import { ShoppingCart } from 'lucide-react';

const AutozakazyPage = () => {
  return (
    <PlaceholderPage
      title="Автозаказы"
      description="Здесь будет отображаться система автоматических заказов, история поставок и управление ассортиментом"
      icon={<ShoppingCart size={48} />}
      color="#ff9800"
    />
  );
};

export default AutozakazyPage;