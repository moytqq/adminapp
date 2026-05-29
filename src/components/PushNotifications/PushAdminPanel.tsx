'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Send, Users, CheckCircle, XCircle } from 'lucide-react';
import { pushApi, PushSubscriber } from '@/services/pushApi';
import styles from './PushAdminPanel.module.scss';

export default function PushAdminPanel() {
  const [subscribers, setSubscribers] = useState<PushSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHid, setSelectedHid] = useState<number | 'all'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    pushApi.getSubscribers()
      .then(setSubscribers)
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await pushApi.send({
        ...(selectedHid !== 'all' ? { hid: selectedHid } : {}),
        title: title.trim(),
        body: body.trim(),
      });
      if (res.status === 'ok') {
        setResult({ ok: true, message: `Отправлено: ${res.sent}, не доставлено: ${res.failed}` });
        setTitle('');
        setBody('');
      } else if (res.status === 'no_subscribers') {
        setResult({ ok: false, message: 'Нет подписчиков' });
      } else {
        setResult({ ok: false, message: 'Ошибка отправки' });
      }
    } catch {
      setResult({ ok: false, message: 'Ошибка сети' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Bell size={22} />
        <h2>Push-уведомления</h2>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Users size={16} />
            Получатель
          </div>

          {loading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : subscribers.length === 0 ? (
            <div className={styles.empty}>Нет подписчиков</div>
          ) : (
            <div className={styles.recipientList}>
              <label className={`${styles.recipientItem} ${selectedHid === 'all' ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="recipient"
                  checked={selectedHid === 'all'}
                  onChange={() => setSelectedHid('all')}
                />
                <span className={styles.recipientName}>Всем ({subscribers.length})</span>
              </label>
              {subscribers.map(s => (
                <label
                  key={s.hid}
                  className={`${styles.recipientItem} ${selectedHid === s.hid ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="recipient"
                    checked={selectedHid === s.hid}
                    onChange={() => setSelectedHid(s.hid)}
                  />
                  <span className={styles.recipientName}>{s.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Send size={16} />
            Сообщение
          </div>

          <div className={styles.form}>
            <input
              className={styles.input}
              type="text"
              placeholder="Заголовок"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
            />
            <textarea
              className={styles.textarea}
              placeholder="Текст уведомления"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              maxLength={200}
            />

            {result && (
              <div className={`${styles.result} ${result.ok ? styles.resultOk : styles.resultErr}`}>
                {result.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {result.message}
              </div>
            )}

            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim() || subscribers.length === 0}
            >
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
