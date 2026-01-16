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
  PERSON = 'Person'
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
  };
}

export interface StoreItem extends BaseTreeItem {
  type: TreeItemType.STORE;
  data: {
    storeName: string;
    address: string;
    managerId?: string;
    phone?: string;
    email?: string;
    revenue?: number;
    employeeCount?: number;
    openingDate?: string;
    departmentId: string;
  };
}

export interface PersonItem extends BaseTreeItem {
  type: TreeItemType.PERSON;
  data: {
    firstName: string;
    lastName: string;
    position: string;
    email: string;
    phone?: string;
    hireDate?: string;
    salary?: number;
    managerId?: string;
    departmentId?: string;
    storeId?: string;
    isManager?: boolean;
  };
}

export type TreeItem = CompanyItem | DepartmentItem | StoreItem | PersonItem;

export interface ApiTreeItem {
  id: number;
  name: string;
  parent_id: number;
  type: 'Company' | 'Department' | 'Store' | 'Person';
  description?: string;
  data?: any;
}

export interface TreeState {
  items: TreeItem[];
  selectedItemId: string | null;
  loading: boolean;
  error: string | null;
}

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
  position?: string;
  addedDate: string;
}