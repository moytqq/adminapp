'use client';

import React, { useState, useEffect } from 'react';
import { serviceApi, ServiceRequest } from '@/services/serviceApi';
import styles from './ServiceHistory.module.scss';
import { Loader, CheckCircle, Clock, Eye, RefreshCw, ArrowLeft } from 'lucide-react';

interface ServiceHistoryProps {
  onBack: () => void;
  userHids: number[];
  storeNamesMap: Map<number, string>;
  isAdmin: boolean;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ onBack, userHids, storeNamesMap, isAdmin }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadServiceList();
  }, []);

  const loadServiceList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceApi.getServiceList();
      // Фильтруем заявки по доступным пользователю HID
      let filtered = data.filter(request => userHids.includes(request.address));

      filtered = filtered.sort((a, b) => {
        const aLastLog = a.logs[a.logs.length - 1];
        const bLastLog = b.logs[b.logs.length - 1];
        const aStatus = aLastLog?.status || 'registered';
        const bStatus = bLastLog?.status || 'registered';

        if (aStatus !== bStatus) {
          if (aStatus === 'registered') return -1;
          if (bStatus === 'registered') return 1;
        }

        return b.id - a.id;
      });

      setRequests(filtered);
    } catch (err) {
      console.error('Error loading service list:', err);
      setError('Ошибка при загрузке списка заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRequest = async (request: ServiceRequest) => {
    if (!window.confirm('Закрыть эту заявку как выполненную?')) return;

    setClosingId(request.id);
    try {
      const response = await serviceApi.changeStatus(request.id, request.type, 'closed');
      if (response.status === 'success') {
        await loadServiceList();
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error closing request:', err);
      setError('Ошибка при закрытии заявки');
    } finally {
      setClosingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <Clock size={16} className={styles.statusRegistered} />;
      case 'closed':
        return <CheckCircle size={16} className={styles.statusClosed} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registered':
        return 'В работе';
      case 'closed':
        return 'Выполнено';
      default:
        return status;
    }
  };

  const getStoreName = (addressId: number): string => {
    return storeNamesMap.get(addressId) || `ID: ${addressId}`;
  };

  const getTypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      base_type: 'Другое',
    };
    return typeNames[type] || type;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasMessage = (request: ServiceRequest): boolean => {
    return request.logs.some(log => log.message && log.message.trim() !== '');
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={48} className={styles.spinner} />
        <p>Загрузка заявок...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadServiceList}>Повторить</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="typeSelectorBackButtonGray" onClick={onBack} title="Назад">
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h2>История заявок</h2>
        <button className={styles.refreshButton} onClick={loadServiceList} title="Обновить">
          <RefreshCw size={18} />
        </button>
      </div>

      {requests.length === 0 ? (
        <div className={styles.empty}>
          <p>Нет заявок</p>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map(request => {
            const lastLog = request.logs[request.logs.length - 1];
            const currentStatus = lastLog?.status || 'registered';
            const hasAnyMessage = hasMessage(request);

            return (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.requestHeader}>
                  <div className={styles.requestInfo}>
                    <span className={styles.requestType}>
                      {getTypeName(request.type)}
                    </span>
                    <span className={styles.requestAddress}>
                      {getStoreName(request.address)}
                    </span>
                  </div>
                  <div className={styles.requestStatus}>
                    {getStatusIcon(currentStatus)}
                    <span>{getStatusText(currentStatus)}</span>
                  </div>
                </div>

                <div className={styles.requestMeta}>
                  <div className={styles.requestMetaContainer}>
                    <span className={styles.requestId}>№{request.id}</span>
                    <span className={styles.requestDate}>
                      📅 {formatDate(request.logs[0]?.timestamp || '')}
                    </span>
                  </div>

                  {hasAnyMessage && (
                    <button
                      className={styles.expandButton}
                      onClick={() => toggleExpand(request.id)}
                    >
                      {expandedId === request.id ? 'Скрыть сообщение' : 'Показать сообщение'}
                      <Eye size={14} />
                    </button>
                  )}
                </div>

                {expandedId === request.id && (
                  <div className={styles.requestLogs}>
                    {request.logs.map(log => (
                      log.message && log.message.trim() !== '' && (
                        <div key={log.id} className={styles.logItem}>
                          <div className={styles.logMessage}>
                            📝 Сообщение: {log.message}
                          </div>
                          <div className={styles.logDate}>
                            {formatDate(log.timestamp)}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {isAdmin && currentStatus === 'registered' && (
                  <div className={styles.requestActions}>
                    <button
                      className={styles.closeButton}
                      onClick={() => handleCloseRequest(request)}
                      disabled={closingId === request.id}
                    >
                      {closingId === request.id ? (
                        <Loader size={16} className={styles.spinnerSmall} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Закрыть заявку
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;