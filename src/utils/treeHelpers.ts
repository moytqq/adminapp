import {
  TreeItem,
  TreeItemType,
  CompanyItem,
  DepartmentItem,
  StoreItem,
  PersonItem
} from '@/types/tree.types';
import { treeApi } from '@/services/api';
import { buildTreeFromApiData, enhanceTreeDataWithMockInfo } from './apiTransformers';

export const fetchTreeDataFromApi = async (): Promise<TreeItem[]> => {
  try {
    console.log('Fetching tree data from API...');

    const apiData = await treeApi.getHierarchyTree();
    console.log('API data received:', apiData);

    let treeData = buildTreeFromApiData(apiData);

    treeData = enhanceTreeDataWithMockInfo(treeData);

    console.log('Tree data built:', treeData);
    return treeData;

  } catch (error) {
    console.error('Error fetching tree data from API:', error);

    console.log('Using fallback mock data');
    return fetchMockTreeData();
  }
};

export const fetchMockTreeData = async (): Promise<TreeItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    {
      id: 'company-1',
      label: 'ООО "Вкусные решения"',
      type: TreeItemType.COMPANY,
      level: 0,
      isExpanded: true,
      parentId: '0',
      data: {
        companyName: 'ООО "Вкусные решения"',
        foundedYear: 2010,
        ceoId: 'person-1',
        totalRevenue: 50000000,
        employeeCount: 245
      },
      children: [
        {
          id: 'person-1',
          label: 'Иванов Иван Иванович',
          type: TreeItemType.PERSON,
          level: 1,
          isExpanded: false,
          parentId: 'company-1',
          subLabel: 'Генеральный директор',
          data: {
            firstName: 'Иван',
            lastName: 'Иванов',
            position: 'Генеральный директор',
            email: 'ivanov@vkusno.ru',
            phone: '+7 (999) 123-45-67',
            hireDate: '2010-01-15',
            salary: 300000,
            isManager: true
          }
        } as PersonItem,
        {
          id: 'dept-1',
          label: 'Департамент IT',
          type: TreeItemType.DEPARTMENT,
          level: 1,
          isExpanded: true,
          parentId: 'company-1',
          data: {
            departmentName: 'Департамент IT',
            managerId: 'person-2',
            budget: 10000000,
            storeCount: 0,
            employeeCount: 25,
            description: 'Отвечает за IT-инфраструктуру компании'
          },
          children: [
            {
              id: 'person-2',
              label: 'Петрова Анна Сергеевна',
              type: TreeItemType.PERSON,
              level: 2,
              isExpanded: false,
              parentId: 'dept-1',
              subLabel: 'Руководитель IT-департамента',
              data: {
                firstName: 'Анна',
                lastName: 'Петрова',
                position: 'Руководитель IT-департамента',
                email: 'petrova@vkusno.ru',
                phone: '+7 (999) 234-56-78',
                hireDate: '2015-03-20',
                salary: 200000,
                departmentId: 'dept-1',
                isManager: true
              }
            } as PersonItem,
          ]
        } as DepartmentItem,
      ]
    } as CompanyItem
  ];
};

export const fetchTreeData = fetchTreeDataFromApi;