import {
  TreeItem,
  TreeItemType,
  StoreItem,
  DepartmentItem,
  ApiTreeItem
} from '@/types/tree.types';

export const transformToStoreDepartmentView = (
  apiItems: ApiTreeItem[]
): TreeItem[] => {
  const storeApiItems = apiItems.filter(item => item.type === 'Store');

  const allDepartments = getAllDepartments(apiItems);
  console.log('All departments found:', allDepartments.map(d => d.name));

  const departmentNameToId = new Map<string, number>();
  allDepartments.forEach(dept => {
    departmentNameToId.set(dept.name.toLowerCase(), dept.id);
  });

  const storeGroups = new Map<string, {
    name: string;
    originalItems: ApiTreeItem[];
    departmentNames: Set<string>;
  }>();

  storeApiItems.forEach(storeApiItem => {
    const storeName = extractStoreName(storeApiItem.name);

    if (!storeGroups.has(storeName)) {
      storeGroups.set(storeName, {
        name: storeName,
        originalItems: [],
        departmentNames: new Set<string>()
      });
    }

    const group = storeGroups.get(storeName)!;
    group.originalItems.push(storeApiItem);

    if (storeApiItem.description) {
      const description = storeApiItem.description.toLowerCase();

      allDepartments.forEach(dept => {
        const deptKeyName = dept.name.toLowerCase().replace('отдел ', '');
        if (description.includes(deptKeyName)) {
          group.departmentNames.add(dept.name);
        }
      });
    }
  });

  storeGroups.forEach(group => {
    if (group.departmentNames.size === 0) {
      allDepartments.forEach(dept => {
        group.departmentNames.add(dept.name);
      });
      console.log(`ℹStore "${group.name}" has no specific departments, showing all`);
    }
  });

  const storeItems: StoreItem[] = Array.from(storeGroups.values()).map((group, index) => {
    const departmentItems: DepartmentItem[] = Array.from(group.departmentNames)
      .map(deptName => {
        const deptId = departmentNameToId.get(deptName.toLowerCase());
        if (!deptId) return null;

        const deptApiItem = allDepartments.find(d => d.id === deptId);
        if (!deptApiItem) return null;

        return createDepartmentItem(deptApiItem, group.name, index);
      })
      .filter((item): item is DepartmentItem => item !== null)
      .sort((a, b) => a.label.localeCompare(b.label));

    const firstStore = group.originalItems[0];

    const storeItem: StoreItem = {
      id: `store-group-${index + 1}`,
      label: group.name,
      type: TreeItemType.STORE,
      level: 0,
      parentId: '0',
      isExpanded: false,
      hasChildren: departmentItems.length > 0,
      children: departmentItems,
      data: {
        storeName: group.name,
        originalName: firstStore.name,
        description: firstStore.description || '',
        address: generateAddress(group.name),
        phone: generatePhone(),
        email: `${group.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.ru`,
        revenue: Math.floor(Math.random() * 5000000) + 1000000,
        employeeCount: Math.floor(Math.random() * 50) + 5,
        openingDate: generateOpeningDate(),
        originalIds: group.originalItems.map(item => item.id),
        departmentNames: Array.from(group.departmentNames)
      }
    };

    return storeItem;
  });

  storeItems.sort((a, b) => a.label.localeCompare(b.label));

  console.log('Store groups created:');
  storeItems.forEach((store, i) => {
    console.log(`${i + 1}. "${store.label}" - отделы: ${store.data.departmentNames.join(', ')}`);
  });

  return storeItems;
};


const extractStoreName = (fullName: string): string => {
  const parts = fullName.split(',');
  return parts[0].trim();
};

const getAllDepartments = (apiItems: ApiTreeItem[]): ApiTreeItem[] => {
  const departments = apiItems.filter(item => item.type === 'Department');

  return departments.sort((a, b) => a.name.localeCompare(b.name));
};

const findDepartmentsForStore = (
  storeId: number,
  itemsMap: Map<number, ApiTreeItem>
): number[] => {
  const departments: number[] = [];
  const visited = new Set<number>();

  const traverseUp = (currentId: number) => {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const currentItem = itemsMap.get(currentId);
    if (!currentItem) return;

    if (currentItem.type === 'Department') {
      departments.push(currentItem.id);
    }

    if (currentItem.parent_id !== 0) {
      traverseUp(currentItem.parent_id);
    }
  };

  traverseUp(storeId);

  return departments;
};

const findDepartmentsByStoreDescription = (
  storeApiItem: ApiTreeItem,
  apiItems: ApiTreeItem[]
): number[] => {
  const departments: number[] = [];

  if (storeApiItem.description) {
    const description = storeApiItem.description.toLowerCase();

    apiItems.forEach(item => {
      if (item.type === 'Department') {
        const deptName = item.name.toLowerCase();
        if (description.includes(deptName.replace('отдел ', '').trim())) {
          departments.push(item.id);
        }
      }
    });
  }

  const chainDepartments = findDepartmentsForStore(storeApiItem.id, new Map(apiItems.map(item => [item.id, item])));

  const allDepartments = [...departments, ...chainDepartments];

  return [...new Set(allDepartments)];
};

const createDepartmentItem = (
  deptApiItem: ApiTreeItem,
  storeName: string,
  storeIndex: number
): DepartmentItem => {
  return {
    id: `store-${storeIndex + 1}-dept-${deptApiItem.id}`,
    label: deptApiItem.name,
    type: TreeItemType.DEPARTMENT,
    level: 1,
    parentId: `store-group-${storeIndex + 1}`,
    isExpanded: false,
    hasChildren: false,
    data: {
      departmentName: deptApiItem.name,
      description: deptApiItem.description || '',
      budget: Math.floor(Math.random() * 10000000) + 1000000,
      storeCount: 0,
      employeeCount: Math.floor(Math.random() * 100) + 10,
      originalId: deptApiItem.id
    }
  };
};


const generateAddress = (storeName: string): string => {
  const addresses: Record<string, string> = {
    'Бугры': 'г. Санкт-Петербург, ул. Бугры, д. 1',
    '81 Новаторов': 'г. Санкт-Петербург, ул. Новаторов, д. 81',
    'Бабушкина': 'г. Санкт-Петербург, ул. Бабушкина, д. 111',
  };

  return addresses[storeName] || `г. Москва, ул. ${storeName}, д. ${Math.floor(Math.random() * 100) + 1}`;
};


const generatePhone = (): string => {
  const prefix = Math.floor(Math.random() * 900) + 100;
  const middle = Math.floor(Math.random() * 90) + 10;
  const end = Math.floor(Math.random() * 90) + 10;
  return `+7 (495) ${prefix}-${middle}-${end}`;
};


const generateOpeningDate = (): string => {
  const year = 2020 + Math.floor(Math.random() * 4);
  const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
  const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export const transformTreeDataByViewMode = (
  apiItems: ApiTreeItem[],
  originalTreeItems: TreeItem[],
  viewMode: 'hierarchy' | 'store-departments'
): TreeItem[] => {
  if (viewMode === 'store-departments') {
    console.log('Transforming to store-department view');
    console.log('Total API items:', apiItems.length);
    console.log('Store items:', apiItems.filter(item => item.type === 'Store').length);
    console.log('Department items:', apiItems.filter(item => item.type === 'Department').length);

    const result = transformToStoreDepartmentView(apiItems);
    console.log('Transformation complete');
    console.log('Result stores:', result.length);

    return result;
  }

  console.log('Using hierarchical view');
  return originalTreeItems;
};