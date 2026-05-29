'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { pushApi } from '@/services/pushApi';
import styles from './PushToggle.module.scss';

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

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
    try {
      if (subscribed) {
        await pushApi.unsubscribe();
        setSubscribed(false);
      } else {
        const ok = await pushApi.subscribe();
        setSubscribed(ok);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      className={`${styles.btn} ${subscribed ? styles.active : ''}`}
      onClick={toggle}
      disabled={loading}
      title={subscribed ? 'Отключить уведомления' : 'Включить уведомления'}
    >
      {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
      <span>{loading ? '...' : subscribed ? 'Уведомления вкл.' : 'Уведомления выкл.'}</span>
    </button>
  );
}
