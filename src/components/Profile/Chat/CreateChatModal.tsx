'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatApi, ChatUser } from '@/services/chatApi';
import styles from './CreateChatModal.module.scss';
import { X, Search } from 'lucide-react';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: () => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ isOpen, onClose, onChatCreated }) => {
  const [senders, setSenders] = useState<ChatUser[]>([]);
  const [receivers, setReceivers] = useState<ChatUser[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>('');
  const [selectedReceiver, setSelectedReceiver] = useState<ChatUser | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      setSelectedReceiver(null);
      setSearch('');
      setError(null);
    }
  }, [isOpen]);

  // Фокус на поиск при открытии
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen, loading]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sendersData, receiversData] = await Promise.all([
        chatApi.getSendersList(),
        chatApi.getReceiversList(),
      ]);
      setSenders(sendersData);
      setReceivers(receiversData);
      // Если отправитель один — выбираем автоматически
      if (sendersData.length === 1) {
        setSelectedSender(String(sendersData[0].id));
      }
    } catch {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedSender || !selectedReceiver) return;
    setCreating(true);
    setError(null);
    try {
      const response = await chatApi.createChat(
        parseInt(selectedSender),
        selectedReceiver.id,
      );
      if (response.status === 'success') {
        onChatCreated();
        onClose();
      } else {
        setError(response.message || 'Ошибка создания чата');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка создания чата');
    } finally {
      setCreating(false);
    }
  };

  const filtered = receivers.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const singleSender = senders.length === 1 ? senders[0] : null;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Новый чат</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Отправитель — только если вариантов больше одного */}
          {!singleSender && (
            <div className={styles.field}>
              <label className={styles.label}>От кого</label>
              <select
                className={styles.select}
                value={selectedSender}
                onChange={e => setSelectedSender(e.target.value)}
                disabled={loading}
              >
                <option value="">Выберите отправителя</option>
                {senders.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.type !== 'Person' ? ` (${s.type === 'Department' ? 'Департамент' : 'Компания'})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Поиск получателя */}
          <div className={styles.field}>
            <label className={styles.label}>
              Кому{selectedReceiver ? `: ${selectedReceiver.name}` : ''}
            </label>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                ref={searchRef}
                className={styles.searchInput}
                placeholder="Поиск сотрудника..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.receiverList}>
              {loading ? (
                <div className={styles.listEmpty}>Загрузка...</div>
              ) : filtered.length === 0 ? (
                <div className={styles.listEmpty}>Ничего не найдено</div>
              ) : (
                filtered.map(r => (
                  <button
                    key={r.id}
                    className={`${styles.receiverItem} ${selectedReceiver?.id === r.id ? styles.selected : ''}`}
                    onClick={() => setSelectedReceiver(r)}
                  >
                    <span className={styles.receiverName}>{r.name}</span>
                    {r.type !== 'Person' && (
                      <span className={styles.receiverType}>
                        {r.type === 'Department' ? 'Департамент' : 'Компания'}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose} disabled={creating}>
              Отмена
            </button>
            <button
              className={styles.createButton}
              onClick={handleCreateChat}
              disabled={creating || !selectedSender || !selectedReceiver}
            >
              {creating ? 'Создание...' : 'Создать чат'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChatModal;
