import { BaseWidgetData } from '@/types/widget.types';

export interface TreeState {
  items: TreeItem[];
  originalApiData: ApiTreeItem[] | null;
  selectedItemId: string | null;
  loading: boolean;
  error: string | null;
  viewMode: TreeViewMode;
}

export interface BaseTreeItem {
  id: string;
  label: string;
  subLabel?: string;
  children?: TreeItem[];
  isExpanded?: boolean;
  level: number;
  hasChildren?: boolean;
  parentId: string;
  description?: string;
}

export enum TreeItemType {
  COMPANY = 'Company',
  DEPARTMENT = 'Department',
  STORE = 'Store',
  PERSON = 'Person',
  ADDRESS = 'Address',
}

export interface CompanyItem extends BaseTreeItem {
  type: TreeItemType.COMPANY;
  data: {
    companyName: string;
    foundedYear?: number;
    ceoId?: string;
    totalRevenue?: number;
    employeeCount?: number;
  };
}

export interface DepartmentItem extends BaseTreeItem {
  type: TreeItemType.DEPARTMENT;
  data: {
    departmentName: string;
    managerId?: string;
    budget?: number;
    storeCount?: number;
    employeeCount?: number;
    description?: string;
    originalId?: number;
  };
}

export interface StoreItem extends BaseTreeItem {
  type: TreeItemType.STORE;
  data: {
    storeName: string;
    originalName?: string;
    description: string;
    address: string;
    managerId?: string;
    phone?: string;
    email?: string;
    revenue?: number;
    employeeCount?: number;
    openingDate?: string;
    originalId?: number;
    originalIds?: number[];
  };
}

export interface PersonItem extends BaseTreeItem {
  type: TreeItemType.PERSON;
  data: {
    firstName: string;
    lastName: string;
    middleName?: string;
    birthDate?: string;
    position: string;
    email: string;
    phone?: string;
    citizenship?: string;
    registration?: string;
    contractType?: 'employment' | 'gph' | 'patent' | 'none';
    hireDate?: string;
    department?: string;
    managerId?: string;
    departmentId?: string;
    storeId?: string;
    isManager?: boolean;
    salary?: number;
  };
}

export interface AddressItem extends BaseTreeItem {
  type: TreeItemType.ADDRESS;
  data: {
    addressName: string;
    fullAddress: string;
    storeCount?: number;
    description?: string;
  };
}

export type TreeItem = CompanyItem | DepartmentItem | StoreItem | PersonItem | AddressItem;

export interface ApiTreeItem {
  id: number;
  name: string;
  parent_id: number;
  type: 'Company' | 'Department' | 'Store' | 'Person' | 'Address';
  description?: string;
  data?: any;
}

export type TreeViewMode = 'hierarchy' | 'store-departments' | 'addresses';

export interface WidgetItem {
  id: string;
  title: string;
  description: string;
  type: string;
  availableFor?: TreeItemType[];
  icon?: string;
}

export interface FavoriteWidget {
  id: string;
  type: string;
  title: string;
  itemId: string;
  itemType: TreeItemType;
  personName?: string;
  storeName?: string;
  position?: string;
  hid?: string;
  addedDate: string;
}