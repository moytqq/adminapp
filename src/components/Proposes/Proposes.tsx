'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { proposesApi, Suggestion } from '@/services/proposesApi';
import styles from './Proposes.module.scss';
import { Lightbulb, Send, ChevronDown, ChevronUp, Loader } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  correction: 'Исправление',
  message: 'Столкнулся с ошибкой',
};

const Proposes: React.FC = () => {
  const { flags } = useSelector((state: RootState) => state.auth);
  const canView = flags.includes('ADMIN') || flags.includes('TECH_SUPPORT');

  // Форма
  const [category, setCategory] = useState<'correction' | 'message'>('message');
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Список (только для ADMIN/TECH_SUPPORT)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [filterCat, setFilterCat] = useState<'all' | 'correction' | 'message'>('all');

  useEffect(() => {
    if (canView && showList) {
      loadList();
    }
  }, [canView, showList]);

  const loadList = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await proposesApi.getAll();
      if (res.status === 'success' && res.data) {
        setSuggestions(res.data);
      } else {
        setListError(res.message || 'Ошибка загрузки');
      }
    } catch {
      setListError('Ошибка загрузки');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await proposesApi.submit({ category, text, contact: contact || undefined });
      if (res.status === 'success') {
        setSubmitResult({ ok: true, msg: 'Спасибо! Ваше предложение отправлено.' });
        setText('');
        setContact('');
      } else {
        setSubmitResult({ ok: false, msg: res.message || 'Ошибка отправки' });
      }
    } catch {
      setSubmitResult({ ok: false, msg: 'Ошибка отправки' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filterCat === 'all'
    ? suggestions
    : suggestions.filter(s => s.category === filterCat);

  return (
    <div className={styles.page}>
      {/* Форма отправки — видна всем */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <Lightbulb size={28} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Поддержка Экосистемы</h1>
            <p className={styles.subtitle}>Сообщите нам об ошибке или предложите исправление</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Тип обращения</label>
            <div className={styles.categoryButtons}>
              <button
                type="button"
                className={`${styles.catBtn} ${category === 'message' ? styles.catBtnActive : ''}`}
                onClick={() => setCategory('message')}
              >
                Столкнулся с ошибкой
              </button>
              <button
                type="button"
                className={`${styles.catBtn} ${category === 'correction' ? styles.catBtnActive : ''}`}
                onClick={() => setCategory('correction')}
              >
                Предложить исправление
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              {category === 'correction' ? 'Что нужно исправить?' : 'Описание ошибки'}
            </label>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={
                category === 'correction'
                  ? 'Опишите что именно нужно исправить и где...'
                  : 'Опишите ошибку: что делали, что пошло не так...'
              }
              rows={5}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Контакт для связи (необязательно)</label>
            <input
              className={styles.input}
              type="text"
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="Телефон, email или имя..."
            />
          </div>

          {submitResult && (
            <div className={submitResult.ok ? styles.success : styles.error}>
              {submitResult.msg}
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={submitting || !text.trim()}>
            {submitting
              ? <Loader size={18} className={styles.spinner} />
              : <Send size={18} />}
            Отправить
          </button>
        </form>
      </div>

      {/* Список предложений — только ADMIN / TECH_SUPPORT */}
      {canView && (
        <div className={styles.adminCard}>
          <button
            className={styles.toggleButton}
            onClick={() => setShowList(v => !v)}
          >
            <span>Все предложения {suggestions.length > 0 && !loadingList ? `(${suggestions.length})` : ''}</span>
            {showList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showList && (
            <div className={styles.listSection}>
              <div className={styles.filterRow}>
                {(['all', 'message', 'correction'] as const).map(cat => (
                  <button
                    key={cat}
                    className={`${styles.filterBtn} ${filterCat === cat ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilterCat(cat)}
                  >
                    {cat === 'all' ? 'Все' : CATEGORY_LABELS[cat]}
                  </button>
                ))}
                <button className={styles.refreshBtn} onClick={loadList} disabled={loadingList}>
                  {loadingList ? <Loader size={14} className={styles.spinner} /> : '↻'}
                </button>
              </div>

              {loadingList ? (
                <div className={styles.listEmpty}>
                  <Loader size={24} className={styles.spinner} />
                  <span>Загрузка...</span>
                </div>
              ) : listError ? (
                <div className={styles.error}>{listError}</div>
              ) : filtered.length === 0 ? (
                <div className={styles.listEmpty}>Предложений нет</div>
              ) : (
                <div className={styles.suggestionList}>
                  {filtered.map(s => (
                    <div key={s.id} className={styles.suggestionItem}>
                      <div className={styles.suggestionMeta}>
                        <span className={`${styles.badge} ${styles[`badge_${s.category}`]}`}>
                          {CATEGORY_LABELS[s.category]}
                        </span>
                        {s.hid && <span className={styles.hid}>hid {s.hid}</span>}
                        <span className={styles.date}>
                          {new Date(s.created_at).toLocaleString('ru-RU', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className={styles.suggestionText}>{s.text}</p>
                      {s.contact && (
                        <p className={styles.contact}>Контакт: {s.contact}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Proposes;
