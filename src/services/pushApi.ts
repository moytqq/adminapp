import { api } from './api';

export interface PushSubscriber {
  hid: number;
  name: string;
  since: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export const pushApi = {
  async getVapidKey(): Promise<string> {
    const res = await api.get('/push/vapid-key');
    return res.data.publicKey;
  },

  async subscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const publicKey = await pushApi.getVapidKey();
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const { endpoint, keys } = subscription.toJSON() as any;
    await api.post('/push/subscribe', {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });
    return true;
  },

  async unsubscribe(): Promise<void> {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await api.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
    await sub.unsubscribe();
  },

  async isSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  },

  async getSubscribers(): Promise<PushSubscriber[]> {
    const res = await api.get('/push/subscribers');
    return res.data.status === 'success' ? res.data.data : [];
  },

  async send(params: { hid?: number; title: string; body: string }) {
    const res = await api.post('/push/send', params);
    return res.data;
  },
};
