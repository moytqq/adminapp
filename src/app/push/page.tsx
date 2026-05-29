'use client';

import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import PushAdminPanel from '@/components/PushNotifications/PushAdminPanel';

export default function PushPage() {
  return (
    <ProtectedRoute requiredFlags={['ADMIN']}>
      <PushAdminPanel />
    </ProtectedRoute>
  );
}
