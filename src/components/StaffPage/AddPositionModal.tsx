'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import { addPosition } from '@/store/slices/personalSlice';
import { loadStores } from '@/store/slices/addressSlice';
import styles from './AddModal.module.scss';
import { X } from 'lucide-react';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPositionModal: React.FC<AddPositionModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { stores, loading: storesLoading, error } = useAppSelector((state) => state.address);
  const [name, setName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stores.length === 0 && !storesLoading) {
      dispatch(loadStores());
    }

    if (!isOpen) {
      setName('');
      setSelectedStoreId('');
    }
  }, [isOpen, stores.length, storesLoading, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedStoreId) {
      setLoading(true);
      try {
        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) throw new Error('Магазин не найден');

        await dispatch(addPosition({ hid: store.hid, name })).unwrap();

        setName('');
        setSelectedStoreId('');
        onClose();
      } catch (error) {
        console.error('Error adding position:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Добавить новую вакансию</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Магазин</label>
            <select
              className={styles.select}
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              required
              disabled={storesLoading}
            >
              <option value="">
                {storesLoading ? 'Загрузка магазинов...' : 'Выберите магазин'}
              </option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.formattedName}
                </option>
              ))}
            </select>
            {storesLoading && (
              <div className={styles.loadingHint}>Загрузка списка магазинов...</div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Название вакансии</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Продавец"
              required
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !name || !selectedStoreId || storesLoading}
            >
              {loading ? 'Добавление...' : 'Добавить вакансию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPositionModal;