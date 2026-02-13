'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/store/hooks/hooks';
import { addStaff } from '@/store/slices/personalSlice';
import styles from './AddModal.module.scss';
import { X } from 'lucide-react';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [fio, setFio] = useState('');
  const [doe, setDoe] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fio && doe) {
      setLoading(true);
      try {
        await dispatch(addStaff({ fio, doe })).unwrap();
        setFio('');
        setDoe(new Date().toISOString().split('T')[0]);
        onClose();
      } catch (error) {
        console.error('Error adding staff:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Добавить нового сотрудника</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>ФИО сотрудника</label>
            <input
              type="text"
              className={styles.input}
              value={fio}
              onChange={(e) => setFio(e.target.value)}
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Дата трудоустройства</label>
            <input
              type="date"
              className={styles.input}
              value={doe}
              onChange={(e) => setDoe(e.target.value)}
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
              disabled={loading || !fio}
            >
              {loading ? 'Добавление...' : 'Добавить сотрудника'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;