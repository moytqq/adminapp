'use client';

import React, { useState, useEffect } from 'react';
import { chatApi, ChatUser } from '@/services/chatApi';
import styles from './CreateChatModal.module.scss';
import { X, Users, User } from 'lucide-react';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: () => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ isOpen, onClose, onChatCreated }) => {
  const [senders, setSenders] = useState<ChatUser[]>([]);
  const [receivers, setReceivers] = useState<ChatUser[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>('');
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      setSelectedSender('');
      setSelectedReceiver('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

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
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedSender || !selectedReceiver) {
      setError('Выберите отправителя и получателя');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await chatApi.createChat(
        parseInt(selectedSender),
        parseInt(selectedReceiver)
      );

      if (response.status === 'success') {
        setSuccess('Чат успешно создан');
        setTimeout(() => {
          onChatCreated();
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Ошибка создания чата');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка создания чата');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Новый чат</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success}>
              {success}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>От кого</label>
            <select
              className={styles.select}
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              disabled={loading}
            >
              <option value="">Выберите отправителя</option>
              {senders.map(sender => (
                <option key={sender.id} value={sender.id}>
                  {sender.name} ({sender.type === 'Company' ? 'Компания' :
                  sender.type === 'Department' ? 'Департамент' : 'Сотрудник'})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Кому</label>
            <select
              className={styles.select}
              value={selectedReceiver}
              onChange={(e) => setSelectedReceiver(e.target.value)}
              disabled={loading}
            >
              <option value="">Выберите получателя</option>
              {receivers.map(receiver => (
                <option key={receiver.id} value={receiver.id}>
                  {receiver.name} ({receiver.type === 'Person' ? 'Сотрудник' : 'Департамент'})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              className={styles.createButton}
              onClick={handleCreateChat}
              disabled={loading || !selectedSender || !selectedReceiver}
            >
              {loading ? 'Создание...' : 'Создать чат'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChatModal;