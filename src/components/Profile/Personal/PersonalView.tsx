'use client';

import React, { useState, useEffect } from 'react';
import { profileApi, UserProfile } from '@/services/profileApi';
import { hashPasswordWithSalt } from '@/utils/crypto';
import styles from './PersonalView.module.scss';

const PersonalView = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    profileApi.getProfile().then((data) => {
      setProfile(data);
      setBirthday(data.birthday ? data.birthday.slice(0, 10) : '');
      setPhone(data.phone ?? '');
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await profileApi.updateProfile({ birthday: birthday || null, phone: phone || null });
      setSaveMessage({ text: 'Данные сохранены', ok: true });
    } catch {
      setSaveMessage({ text: 'Ошибка сохранения', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Новые пароли не совпадают', ok: false });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Пароль должен быть не менее 6 символов', ok: false });
      return;
    }

    setPasswordLoading(true);
    try {
      const salt = '96678763';
      const oldHashed = await hashPasswordWithSalt(oldPassword, salt);
      const newHashed = await hashPasswordWithSalt(newPassword, salt);
      const result = await profileApi.changePassword(oldHashed, newHashed);

      if (result.status === 'success') {
        setPasswordMessage({ text: 'Пароль успешно изменён', ok: true });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ text: result.message ?? 'Ошибка смены пароля', ok: false });
      }
    } catch {
      setPasswordMessage({ text: 'Ошибка смены пароля', ok: false });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Личные данные</h2>

        <div className={styles.field}>
          <span className={styles.label}>Имя</span>
          <span className={styles.value}>{profile?.name}</span>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Логин{(profile?.logins.length ?? 0) > 1 ? 'ы' : ''}</span>
          <span className={styles.value}>{profile?.logins.join(', ')}</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="birthday">Дата рождения</label>
          <input
            id="birthday"
            type="date"
            className={styles.input}
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">Телефон</label>
          <input
            id="phone"
            type="tel"
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 999-99-99"
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {saveMessage && (
            <span className={saveMessage.ok ? styles.messageOk : styles.messageError}>
              {saveMessage.text}
            </span>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Смена пароля</h2>
        <p className={styles.hint}>
          Пароль будет изменён для всех логинов вашей учётной записи.
        </p>

        <form onSubmit={handleChangePassword}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="oldPassword">Текущий пароль</label>
            <input
              id="oldPassword"
              type="password"
              className={styles.input}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="newPassword">Новый пароль</label>
            <input
              id="newPassword"
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">Подтвердите новый пароль</label>
            <input
              id="confirmPassword"
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.saveButton} disabled={passwordLoading}>
              {passwordLoading ? 'Изменение...' : 'Изменить пароль'}
            </button>
            {passwordMessage && (
              <span className={passwordMessage.ok ? styles.messageOk : styles.messageError}>
                {passwordMessage.text}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};

export default PersonalView;
