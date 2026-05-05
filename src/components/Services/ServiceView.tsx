'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { serviceApi, ServiceType } from '@/services/serviceApi';
import ServiceRegistration from './ServiceRegistration';
import ServiceHistory from './ServiceHistory';
import styles from './ServiceView.module.scss';
import { Loader } from 'lucide-react';

interface ServiceViewProps {
  serviceType: ServiceType;
  onBack: () => void;
}

const ServiceView: React.FC<ServiceViewProps> = ({ serviceType, onBack }) => {
  const [userAddresses, setUserAddresses] = useState<number[]>([]);
  const [storeNamesMap, setStoreNamesMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const { flags } = useSelector((state: RootState) => state.auth);

  const isHistory = serviceType.type === 'history';
  const isServiceAdmin = flags.includes('SERVICE_ADMIN') || flags.includes('ADMIN');

  useEffect(() => {
    loadUserAddresses();
  }, []);

  const loadUserAddresses = async () => {
    setLoading(true);
    try {
      const hids: number[] = [];
      flags.forEach(flag => {
        if (flag.startsWith('LS_') || flag.startsWith('TM_')) {
          const hid = parseInt(flag.split('_')[1], 10);
          if (!isNaN(hid)) {
            hids.push(hid);
          }
        }
      });
      setUserAddresses(hids);

      const map = new Map<number, string>();
      hids.forEach(hid => {
        map.set(hid, `Магазин ${hid}`);
      });
      setStoreNamesMap(map);
    } catch (error) {
      console.error('Error loading user addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setShowHistory(true);
  };

  const handleBackToRegistration = () => {
    setShowHistory(false);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={48} className={styles.spinner} />
        <p>Загрузка...</p>
      </div>
    );
  }

  if (isHistory) {
    return (
      <ServiceHistory
        onBack={onBack}
        userHids={userAddresses}
        storeNamesMap={storeNamesMap}
        isAdmin={isServiceAdmin}
      />
    );
  }

  if (showHistory) {
    return (
      <ServiceHistory
        onBack={handleBackToRegistration}
        userHids={userAddresses}
        storeNamesMap={storeNamesMap}
        isAdmin={isServiceAdmin}
      />
    );
  }

  return (
    <ServiceRegistration
      serviceType={serviceType}
      userAddresses={userAddresses}
      storeNamesMap={storeNamesMap}
      onBack={onBack}
      onSuccess={handleRegistrationSuccess}
    />
  );
};

export default ServiceView;