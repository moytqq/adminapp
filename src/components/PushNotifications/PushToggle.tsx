'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { pushApi } from '@/services/pushApi';
import styles from './PushToggle.module.scss';

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      pushApi.isSubscribed().then(v => {
        setSubscribed(v);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const toggle = async () => {
    setLoading(true);
    setError(null);
    try {
      if (subscribed) {
        await pushApi.unsubscribe();
        setSubscribed(false);
      } else {
        const ok = await pushApi.subscribe();
        setSubscribed(ok);
      }
    } catch (e: any) {
      console.error('Push toggle error:', e);
      setError(e?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        className={`${styles.btn} ${subscribed ? styles.active : ''}`}
        onClick={toggle}
        disabled={loading}
        title={subscribed ? 'Отключить уведомления' : 'Включить уведомления'}
      >
        {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
        <span>{loading ? '...' : subscribed ? 'Уведомления вкл.' : 'Уведомления выкл.'}</span>
      </button>
      {error && <span style={{ fontSize: 11, color: '#e53e3e' }}>{error}</span>}
    </div>
  );
}
