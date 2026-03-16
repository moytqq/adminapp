// utils/apiTransformers.ts

import {
  ApiTreeItem,
  TreeItem,
  TreeItemType,
  CompanyItem,
  DepartmentItem,
  StoreItem,
  PersonItem, AddressItem,
} from '@/types/tree.types';

const mapApiTypeToTreeItemType = (apiType: string): TreeItemType => {
  switch (apiType) {
    case 'Company':
      return TreeItemType.COMPANY;
    case 'Department':
      return TreeItemType.DEPARTMENT;
    case 'Store':
      return TreeItemType.STORE;
    case 'Person':
      return TreeItemType.PERSON;
    case 'Address':
      return TreeItemType.ADDRESS;
    default:
      return TreeItemType.PERSON;
  }
};

const transformApiItemToTreeItem = (apiItem: ApiTreeItem): TreeItem => {
  const baseItem = {
    id: apiItem.id.toString(),
    label: apiItem.name,
    parentId: apiItem.parent_id.toString(),
    description: apiItem.description,
    level: 0,
    isExpanded: false,
    hasChildren: false,
  };

  const type = mapApiTypeToTreeItemType(apiItem.type);

  switch (type) {
    case TreeItemType.COMPANY:
      return {
        ...baseItem,
        type: TreeItemType.COMPANY,
        data: {
          companyName: apiItem.name,
          ...(apiItem.data || {}),
        },
      } as CompanyItem;

    case TreeItemType.DEPARTMENT:
      return {
        ...baseItem,
        type: TreeItemType.DEPARTMENT,
        data: {
          departmentName: apiItem.name,
          description: apiItem.description,
          ...(apiItem.data || {}),
        },
      } as DepartmentItem;

    case TreeItemType.STORE:
      return {
        ...baseItem,
        type: TreeItemType.STORE,
        data: {
          storeName: apiItem.name,
          description: apiItem.description,
          ...(apiItem.data || {}),
        },
      } as StoreItem;

    case TreeItemType.ADDRESS:
      return {
        ...baseItem,
        type: TreeItemType.ADDRESS,
        data: {
          addressName: apiItem.name,
          fullAddress: apiItem.description || '',
          storeCount: 0,
        },
      } as AddressItem;

    case TreeItemType.PERSON:
      const nameParts = apiItem.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        ...baseItem,
        type: TreeItemType.PERSON,
        subLabel: apiItem.description || '',
        data: {
          firstName,
          lastName,
          position: apiItem.description || 'Сотрудник',
          email: '',
          ...(apiItem.data || {}),
        },
      } as PersonItem;

    default:
      return {
        ...baseItem,
        type: TreeItemType.PERSON,
        data: {
          firstName: apiItem.name,
          lastName: '',
          position: apiItem.description || 'Сотрудник',
          email: '',
        },
      } as PersonItem;
  }
};

export const filterDepartmentsAndDescendants = (apiItems: ApiTreeItem[]): ApiTreeItem[] => {
  const departmentIds = new Set(
    apiItems
      .filter(item => item.type === 'Department')
      .map(item => item.id)
  );

  const idsToKeep = new Set<number>([...departmentIds]);

  const addDescendants = (parentId: number) => {
    const children = apiItems.filter(item => (item.parent_id === parentId));
    children.forEach(child => {
      if (!idsToKeep.has(child.id)) {
        idsToKeep.add(child.id);
        addDescendants(child.id);
      }
    });
  };

  departmentIds.forEach(id => addDescendants(id));

  return apiItems.filter(item => idsToKeep.has(item.id));
};

export const buildTreeFromApiData = (apiItems: ApiTreeItem[]): TreeItem[] => {
  const filteredItems = filterDepartmentsAndDescendants(apiItems);

  const itemsMap = new Map<string, TreeItem>();
  const rootItems: TreeItem[] = [];

  filteredItems.forEach(apiItem => {
    const treeItem = transformApiItemToTreeItem(apiItem);
    itemsMap.set(treeItem.id, treeItem);
  });

  const sortChildren = (children: TreeItem[]): TreeItem[] => {
    const typeOrder: Record<TreeItemType, number> = {
      [TreeItemType.COMPANY]: 1,
      [TreeItemType.DEPARTMENT]: 2,
      [TreeItemType.ADDRESS]: 3,
      [TreeItemType.STORE]: 4,
      [TreeItemType.PERSON]: 5,
    };

    return children.sort((a, b) => {
      const orderA = typeOrder[a.type] || 999;
      const orderB = typeOrder[b.type] || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.label.localeCompare(b.label);
    });
  };

  const buildTreeRecursive = (itemId: string, level: number): TreeItem => {
    const item = itemsMap.get(itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    item.level = level;

    const children = Array.from(itemsMap.values()).filter(
      child => child.parentId === itemId,
    );

    item.hasChildren = children.length > 0;

    if (children.length > 0) {
      const sortedChildren = sortChildren(children);

      item.children = sortedChildren.map(child =>
        buildTreeRecursive(child.id, level + 1),
      );
    }

    return item;
  };

  Array.from(itemsMap.values()).forEach(item => {
    const parentExists = Array.from(itemsMap.values()).some(p => p.id === item.parentId);

    if (!parentExists && item.type === TreeItemType.DEPARTMENT) {
      rootItems.push(buildTreeRecursive(item.id, 0));
    }
  });

  rootItems.sort((a, b) => a.label.localeCompare(b.label));

  return rootItems;
};

export const enhanceTreeDataWithMockInfo = (items: TreeItem[]): TreeItem[] => {
  return items.map(item => {
    let enhancedItem = { ...item };

    switch (item.type) {
      case TreeItemType.COMPANY:
        enhancedItem = {
          ...item,
          data: {
            ...item.data,
            foundedYear: 2010,
            employeeCount: Math.floor(Math.random() * 500) + 100,
            totalRevenue: Math.floor(Math.random() * 100000000) + 10000000,
          },
        } as CompanyItem;
        break;

      case TreeItemType.DEPARTMENT:
        enhancedItem = {
          ...item,
          data: {
            ...item.data,
            budget: Math.floor(Math.random() * 10000000) + 1000000,
            storeCount: Math.floor(Math.random() * 20) + 1,
            employeeCount: Math.floor(Math.random() * 100) + 10,
          },
        } as DepartmentItem;
        break;

      case TreeItemType.STORE:
        enhancedItem = {
          ...item,
          data: {
            ...item.data,
            address: `г. Москва, ул. Примерная, д. ${Math.floor(Math.random() * 100) + 1}`,
            phone: `+7 (495) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`,
            email: `${item.data.storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.ru`,
            revenue: Math.floor(Math.random() * 5000000) + 1000000,
            employeeCount: Math.floor(Math.random() * 50) + 5,
            openingDate: `202${Math.floor(Math.random() * 3)}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
          },
        } as StoreItem;
        break;

      case TreeItemType.PERSON:
        const middleNames = ['Иванович', 'Петрович', 'Сергеевич', 'Александровна', 'Дмитриевна', 'Владимировна', 'Алексеевич', 'Николаевна'];

        const existingFirstName = item.data?.firstName || '';
        const existingLastName = item.data?.lastName || '';
        const existingMiddleName = item.data?.middleName || '';

        const generateEmail = () => {
          if (item.data?.email) return item.data.email;
          const firstName = existingFirstName.toLowerCase() || 'user';
          const lastName = existingLastName.toLowerCase() || 'unknown';
          return `${firstName}.${lastName}@company.ru`;
        };

        enhancedItem = {
          ...item,
          data: {
            ...item.data,
            firstName: existingFirstName || 'Иван',
            lastName: existingLastName || 'Иванов',
            middleName: existingMiddleName || middleNames[Math.floor(Math.random() * middleNames.length)],
            birthDate: item.data?.birthDate || `198${Math.floor(Math.random() * 9)}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
            citizenship: item.data?.citizenship || 'РФ',
            registration: item.data?.registration || `г. Москва, ул. ${['Ленина', 'Пушкина', 'Гагарина'][Math.floor(Math.random() * 3)]}, д. ${Math.floor(Math.random() * 100) + 1}`,
            contractType: item.data?.contractType || ['employment', 'gph', 'patent', 'none'][Math.floor(Math.random() * 4)],
            department: item.data?.department || '',
            email: item.data?.email || generateEmail(),
            phone: item.data?.phone || `+7 (999) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`,
            hireDate: item.data?.hireDate || `202${Math.floor(Math.random() * 3)}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
            salary: item.data?.salary || Math.floor(Math.random() * 200000) + 50000,
            isManager: item.data?.isManager !== undefined ? item.data.isManager : Math.random() > 0.5,
          },
        } as PersonItem;
        break;
    }

    if (item.children && item.children.length > 0) {
      enhancedItem.children = enhanceTreeDataWithMockInfo(item.children);
    }

    return enhancedItem;
  });
};