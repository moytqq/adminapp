import { TreeItemType } from '@/types/tree.types';

export interface BaseWidgetData {
  id: string;
  title: string;
  type: string;
  itemId: string;
  itemType: TreeItemType;
  addedDate?: string;
  isFavorite?: boolean;
}

export interface PersonWidgetData extends BaseWidgetData {
  type: 'person-info';
  personName?: string;
  position?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  salary?: number;
  isManager?: boolean;
}

export interface StoreWidgetData extends BaseWidgetData {
  type: 'store-info';
  storeName: string;
  originalName: string;
  address: string;
  phone?: string;
  email?: string;
  revenue?: number;
  employeeCount?: number;
  openingDate?: string;
  description?: string;
  departmentNames?: string[];
  originalIds?: number[];
}

export type WidgetData = PersonWidgetData | StoreWidgetData;

export interface BaseWidgetProps {
  itemId: string;
  onClose: () => void;
  isMobile?: boolean;
  showAddToFavorites?: boolean;
  onRemoveFromFavorites?: () => void;
}