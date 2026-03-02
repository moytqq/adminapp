'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import { addPosition } from '@/store/slices/personalSlice';
import { TreeItemType } from '@/types/tree.types';
import styles from './AddModal.module.scss';
import { X } from 'lucide-react';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPositionModal: React.FC<AddPositionModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.tree);
  const [name, setName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Array<{ id: string; name: string; hid: string }>>([]);

  useEffect(() => {
    const extractStores = (items: any[]): Array<{ id: string; name: string; hid: string }> => {
      let stores: Array<{ id: string; name: string; hid: string }> = [];

      const traverse = (items: any[]) => {
        items.forEach(item => {
          if (item.type === TreeItemType.STORE) {
            const match = item.id.match(/\d+$/);
            const hid = match ? match[0] : item.id;
            stores.push({
              id: item.id,
              name: item.label || item.data?.storeName || 'Магазин',
              hid
            });
          }
          if (item.children) {
            traverse(item.children);
          }
        });
      };

      traverse(items);
      return stores;
    };

    if (isOpen) {
      const storeList = extractStores(items);
      setStores(storeList);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedStoreId) {
      setLoading(true);
      try {
        const store = stores.find(s => s.id === selectedStoreId);
        await dispatch(addPosition({ hid: store!.hid, name })).unwrap();

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
          <div className={styles.field}>
            <label className={styles.label}>Магазин</label>
            <select
              className={styles.select}
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              required
            >
              <option value="">Выберите магазин</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
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
              disabled={loading || !name || !selectedStoreId}
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