'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PWAInstall.module.scss';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Уже установлено как PWA — не показывать
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS Safari — нет beforeinstallprompt, показываем инструкцию
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setInstalled(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) return; // iOS показывает инструкцию, не промпт
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') setVisible(false);
    deferredPrompt.current = null;
  };

  if (!visible || installed) return null;

  if (isIOS) {
    return (
      <div className={styles.banner}>
        <div className={styles.bannerText}>
          <span>Установить приложение:</span>
          <span className={styles.iosHint}>Нажмите <b>Поделиться</b> → <b>На экран «Домой»</b></span>
        </div>
        <button className={styles.closeBtn} onClick={() => setVisible(false)}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      <div className={styles.bannerText}>
        <span>Установить приложение на устройство</span>
      </div>
      <button className={styles.installBtn} onClick={handleInstall}>
        <Download size={16} />
        Установить
      </button>
      <button className={styles.closeBtn} onClick={() => setVisible(false)}>
        <X size={16} />
      </button>
    </div>
  );
}
