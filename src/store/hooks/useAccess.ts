import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

// Маппинг страниц на необходимые флаги
export const pageAccessMap: Record<string, string[]> = {
  '/services': ['SERVICE', 'SERVICE_ADMIN', 'ADMIN'],
  '/autoOrders': ['TM_AUTOZAKAZI', 'ADMIN'],
  '/remainders': ['LS_AUTOZAKAZI', 'TM_AUTOZAKAZI', 'ADMIN'],
  '/results': ['RESULTS', 'ADMIN'],
  '/chat': ['CHAT', 'ADMIN'],
  '/mail': ['MAIL', 'ADMIN'],
  '/staff': ['ADMIN', 'MANAGER'],
  '/planner': ['ADMIN'],
  '/proposes': [],
  '/profile': [],
  '/main': [],
};

export const useAccess = () => {
  const { flags, token } = useSelector((state: RootState) => state.auth);

  const hasFlag = (requiredFlags: string[]): boolean => {
    if (!token) return false;
    if (requiredFlags.length === 0) return true;
    if (flags.includes('ADMIN')) return true;
    return requiredFlags.some(flag => flags.includes(flag));
  };

  const canAccessPage = (path: string): boolean => {
    const requiredFlags = pageAccessMap[path];
    if (!requiredFlags) return true;
    return hasFlag(requiredFlags);
  };

  const getVisibleMenuItems = () => {
    const menuItems = [
      { path: '/main', label: 'Компания', icon: 'Building2' },
      { path: '/profile', label: 'Личный кабинет', icon: 'User' },
      { path: '/autoOrders', label: 'Автозаказы', icon: 'ListOrdered', requiredFlags: ['TM_AUTOZAKAZI', 'ADMIN'] },
      { path: '/remainders', label: 'Остатки', icon: 'Package', requiredFlags: ['LS_AUTOZAKAZI', 'TM_AUTOZAKAZI', 'ADMIN'] },
      { path: '/staff', label: 'Линейный персонал', icon: 'Users', requiredFlags: ['ADMIN', 'MANAGER'] },
      { path: '/planner', label: 'Планировщик', icon: 'ClipboardCheck', requiredFlags: ['ADMIN'] },
      { path: '/results', label: 'Результаты', icon: 'FileText', requiredFlags: ['RESULTS', 'ADMIN'] },
      { path: '/services', label: 'Сервис', icon: 'Wrench', requiredFlags: ['SERVICE', 'SERVICE_ADMIN', 'ADMIN'] },
      { path: '/chat', label: 'Чат', icon: 'MessageCircleMore', requiredFlags: ['CHAT', 'ADMIN'] },
      { path: '/mail', label: 'Почта', icon: 'Mail', requiredFlags: ['MAIL', 'ADMIN'] },
      { path: '/proposes', label: 'Предложения', icon: 'Lightbulb' },
    ];

    return menuItems.filter(item => {
      if (!item.requiredFlags) return true;
      return hasFlag(item.requiredFlags);
    });
  };

  return {
    hasFlag,
    canAccessPage,
    getVisibleMenuItems,
    flags,
    isAdmin: flags.includes('ADMIN'),
  };
};