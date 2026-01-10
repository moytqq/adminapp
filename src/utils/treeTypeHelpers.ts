import {
  TreeItem,
  TreeItemType,
  CompanyItem,
  DepartmentItem,
  StoreItem,
  PersonItem
} from '@/types/tree.types';

export const isCompanyItem = (item: TreeItem): item is CompanyItem => {
  return item.type === TreeItemType.COMPANY;
};

export const isDepartmentItem = (item: TreeItem): item is DepartmentItem => {
  return item.type === TreeItemType.DEPARTMENT;
};

export const isStoreItem = (item: TreeItem): item is StoreItem => {
  return item.type === TreeItemType.STORE;
};

export const isPersonItem = (item: TreeItem): item is PersonItem => {
  return item.type === TreeItemType.PERSON;
};

export const getColorForType = (type: TreeItemType): string => {
  switch (type) {
    case TreeItemType.COMPANY:
      return '#4caf50';
    case TreeItemType.DEPARTMENT:
      return '#2196f3';
    case TreeItemType.STORE:
      return '#ff9800';
    case TreeItemType.PERSON:
      return '#9c27b0';
    default:
      return '#757575';
  }
};

export const getAllowedChildTypes = (parentType: TreeItemType): TreeItemType[] => {
  switch (parentType) {
    case TreeItemType.COMPANY:
      return [TreeItemType.DEPARTMENT, TreeItemType.PERSON, TreeItemType.STORE];
    case TreeItemType.DEPARTMENT:
      return [TreeItemType.STORE, TreeItemType.PERSON, TreeItemType.DEPARTMENT];
    case TreeItemType.STORE:
      return [TreeItemType.PERSON, TreeItemType.STORE];
    case TreeItemType.PERSON:
      return [TreeItemType.DEPARTMENT, TreeItemType.STORE, TreeItemType.PERSON]; // Person теперь может иметь детей
    default:
      return [];
  }
};