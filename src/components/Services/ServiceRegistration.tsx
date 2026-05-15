'use client';

import React, { useState, useEffect } from 'react';
import { serviceApi, ServiceType } from '@/services/serviceApi';
import { typeConfigMap } from './ServiceTypeSelector';
import styles from './ServiceRegistration.module.scss';
import { Loader, Send, CheckCircle, ArrowLeft } from 'lucide-react';

interface ServiceRegistrationProps {
  serviceType: ServiceType;
  userAddresses: number[];
  storeNamesMap: Map<number, string>;
  onBack: () => void;
  onSuccess: () => void;
}

const ServiceRegistration: React.FC<ServiceRegistrationProps> = ({
                                                                   serviceType,
                                                                   userAddresses,
                                                                   storeNamesMap,
                                                                   onBack,
                                                                   onSuccess
                                                                 }) => {
  const [selectedAddress, setSelectedAddress] = useState<number | null>(
    userAddresses.length === 1 ? userAddresses[0] : null
  );
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress) {
      setError('Пожалуйста, выберите адрес');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await serviceApi.registerService(
        serviceType.type,
        selectedAddress,
        message
      );

      if (response.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error registering service:', err);
      setError('Ошибка при регистрации заявки');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← Назад
          </button>
          <h2>Новая заявка: {serviceType.name}</h2>
        </div>
        <div className={styles.successContainer}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h3>Заявка успешно создана!</h3>
          <p>Перенаправление к списку заявок...</p>
        </div>
      </div>
    );
  }

  const cfg = typeConfigMap.get(serviceType.type);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="typeSelectorBackButtonGray" onClick={onBack} title="Назад">
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <div className={styles.headerTitle}>
          {cfg && (
            <span
              className={styles.headerIcon}
              style={{ color: cfg.color, backgroundColor: cfg.bgColor }}
            >
              {cfg.icon}
            </span>
          )}
          <h2>{serviceType.name}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Тип сервиса</label>
          <input type="text" value={serviceType.name} disabled className={styles.disabledInput} />
        </div>

        <div className={styles.field}>
          <label>Адрес</label>
          <select
            value={selectedAddress || ''}
            onChange={(e) => setSelectedAddress(Number(e.target.value))}
            className={styles.select}
            required
          >
            <option value="">Выберите адрес</option>
            {userAddresses.map(addrId => (
              <option key={addrId} value={addrId}>
                {storeNamesMap.get(addrId) || `ID: ${addrId}`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Сообщение (необязательно)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Опишите проблему..."
            className={styles.textarea}
            rows={4}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.buttons}>
          <button type="button" onClick={onBack} className={styles.cancelButton}>
            Отмена
          </button>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? <Loader size={18} className={styles.spinner} /> : <Send size={18} />}
            Отправить заявку
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceRegistration;