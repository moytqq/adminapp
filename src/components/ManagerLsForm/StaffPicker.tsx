'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '@/store/hooks/hooks';
import { addStaff } from '@/store/slices/personalSlice';
import { Search, ChevronDown, Plus, Loader2, X } from 'lucide-react';
import styles from './StaffPicker.module.scss';

interface Staff {
  lsid: string;
  fio: string;
}

interface StaffPickerProps {
  allStaff: Staff[];
  value: string | null;
  onChange: (lsid: string | null) => void;
  loading?: boolean;
}

const StaffPicker: React.FC<StaffPickerProps> = ({ allStaff, value, onChange, loading }) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFio, setNewFio] = useState('');
  const [adding, setAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const newFioRef = useRef<HTMLInputElement>(null);

  const selected = allStaff.find(s => s.lsid === value);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
      setShowAddForm(false);
      setNewFio('');
    }
  }, [open]);

  useEffect(() => {
    if (showAddForm) {
      setTimeout(() => newFioRef.current?.focus(), 50);
    }
  }, [showAddForm]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = allStaff.filter(s =>
    s.fio.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (lsid: string | null) => {
    onChange(lsid);
    setOpen(false);
  };

  const handleAddStaff = async () => {
    if (!newFio.trim() || adding) return;
    setAdding(true);
    try {
      await dispatch(addStaff({
        fio: newFio.trim(),
        doe: new Date().toISOString().split('T')[0],
      })).unwrap();
      setSearch(newFio.trim());
      setShowAddForm(false);
      setNewFio('');
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={14} className={styles.spinner} />
        ) : (
          <span className={value ? styles.selectedLabel : styles.vacantLabel}>
            {selected ? selected.fio : 'Вакантно'}
          </span>
        )}
        <ChevronDown size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.searchRow}>
            <Search size={14} className={styles.searchIcon} />
            <input
              ref={searchRef}
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени..."
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className={styles.list}>
            {!search && (
              <button
                className={`${styles.item} ${!value ? styles.itemActive : ''}`}
                onClick={() => handleSelect(null)}
              >
                <span className={styles.vacantLabel}>Вакантно</span>
              </button>
            )}
            {filtered.map(s => (
              <button
                key={s.lsid}
                className={`${styles.item} ${s.lsid === value ? styles.itemActive : ''}`}
                onClick={() => handleSelect(s.lsid)}
              >
                {s.fio}
              </button>
            ))}
            {filtered.length === 0 && search && (
              <p className={styles.empty}>Не найдено</p>
            )}
          </div>

          <div className={styles.addSection}>
            {showAddForm ? (
              <div className={styles.addForm}>
                <input
                  ref={newFioRef}
                  className={styles.addInput}
                  value={newFio}
                  onChange={e => setNewFio(e.target.value)}
                  placeholder="ФИО нового сотрудника"
                  onKeyDown={e => e.key === 'Enter' && handleAddStaff()}
                />
                <button
                  className={styles.addSubmit}
                  onClick={handleAddStaff}
                  disabled={adding || !newFio.trim()}
                >
                  {adding ? <Loader2 size={13} className={styles.spinner} /> : 'Добавить'}
                </button>
                <button className={styles.addCancel} onClick={() => setShowAddForm(false)}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button className={styles.addTrigger} onClick={() => setShowAddForm(true)}>
                <Plus size={14} />
                <span>Добавить сотрудника</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPicker;
