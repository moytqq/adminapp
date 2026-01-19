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
import { transformTreeDataByViewMode } from '@/utils/storeDepartmentTransformer';

export const fetchTreeDataFromApi = async (viewMode: 'hierarchy' | 'store-departments' = 'hierarchy'): Promise<TreeItem[]> => {
  try {
    console.log('Fetching tree data from API, viewMode:', viewMode);
    const apiData = await treeApi.getHierarchyTree();

    let treeData = buildTreeFromApiData(apiData);
    treeData = enhanceTreeDataWithMockInfo(treeData);

    if (viewMode === 'store-departments') {
      console.log('Transforming to store-department view');
      treeData = transformTreeDataByViewMode(apiData, treeData, viewMode);
    }

    console.log('Tree data built:', treeData);
    return treeData;
  } catch (error) {
    console.error('Error fetching tree data from API:', error);
    console.log('Using fallback mock data');
    return fetchMockTreeData(viewMode);
  }
};

export const fetchMockTreeData = async (viewMode: 'hierarchy' | 'store-departments' = 'hierarchy'): Promise<TreeItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  // if (viewMode === 'store-departments') {
  //   return [
  //     {
  //       id: 'store-6',
  //       label: 'Бугры, кулинария',
  //       type: TreeItemType.STORE,
  //       level: 0,
  //       isExpanded: true,
  //       parentId: '0',
  //       hasChildren: true,
  //       data: {
  //         storeName: 'Бугры, кулинария',
  //         address: 'г. Москва, ул. Бугринская, д. 15',
  //         phone: '+7 (495) 123-45-67',
  //         email: 'bugry@company.ru',
  //         revenue: 2500000,
  //         employeeCount: 25,
  //         openingDate: '2022-03-15',
  //       },
  //       children: [
  //         {
  //           id: 'dept-3',
  //           label: 'Отдел Кулинария',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-6',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Кулинария',
  //             description: 'КулинарияDesc',
  //             budget: 1500000,
  //             storeCount: 1,
  //             employeeCount: 12,
  //           }
  //         },
  //         {
  //           id: 'dept-9',
  //           label: 'Отдел Колбаса',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-6',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Колбаса',
  //             description: 'DepartmentDesc',
  //             budget: 1200000,
  //             storeCount: 1,
  //             employeeCount: 10,
  //           }
  //         },
  //         {
  //           id: 'dept-10',
  //           label: 'Отдел Молочка',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-6',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Молочка',
  //             description: 'DepartmentDesc',
  //             budget: 1800000,
  //             storeCount: 1,
  //             employeeCount: 15,
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       id: 'store-13',
  //       label: '81 Новаторов, колбаса',
  //       type: TreeItemType.STORE,
  //       level: 0,
  //       isExpanded: true,
  //       parentId: '0',
  //       hasChildren: true,
  //       data: {
  //         storeName: '81 Новаторов, колбаса',
  //         address: 'г. Москва, ул. Новаторов, д. 81',
  //         phone: '+7 (495) 234-56-78',
  //         email: 'novatorov@company.ru',
  //         revenue: 3200000,
  //         employeeCount: 32,
  //         openingDate: '2021-11-20',
  //       },
  //       children: [
  //         {
  //           id: 'dept-3',
  //           label: 'Отдел Кулинария',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-13',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Кулинария',
  //             description: 'КулинарияDesc',
  //             budget: 1500000,
  //             storeCount: 1,
  //             employeeCount: 12,
  //           }
  //         },
  //         {
  //           id: 'dept-9',
  //           label: 'Отдел Колбаса',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-13',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Колбаса',
  //             description: 'DepartmentDesc',
  //             budget: 1200000,
  //             storeCount: 1,
  //             employeeCount: 10,
  //           }
  //         },
  //         {
  //           id: 'dept-10',
  //           label: 'Отдел Молочка',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-13',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Молочка',
  //             description: 'DepartmentDesc',
  //             budget: 1800000,
  //             storeCount: 1,
  //             employeeCount: 15,
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       id: 'store-15',
  //       label: 'Бабушкина, колбаса',
  //       type: TreeItemType.STORE,
  //       level: 0,
  //       isExpanded: true,
  //       parentId: '0',
  //       hasChildren: true,
  //       data: {
  //         storeName: 'Бабушкина, колбаса',
  //         address: 'г. Москва, ул. Бабушкина, д. 25',
  //         phone: '+7 (495) 345-67-89',
  //         email: 'babushkina@company.ru',
  //         revenue: 2800000,
  //         employeeCount: 28,
  //         openingDate: '2023-01-10',
  //       },
  //       children: [
  //         {
  //           id: 'dept-3',
  //           label: 'Отдел Кулинария',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-15',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Кулинария',
  //             description: 'КулинарияDesc',
  //             budget: 1500000,
  //             storeCount: 1,
  //             employeeCount: 12,
  //           }
  //         },
  //         {
  //           id: 'dept-9',
  //           label: 'Отдел Колбаса',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-15',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Колбаса',
  //             description: 'DepartmentDesc',
  //             budget: 1200000,
  //             storeCount: 1,
  //             employeeCount: 10,
  //           }
  //         },
  //         {
  //           id: 'dept-10',
  //           label: 'Отдел Молочка',
  //           type: TreeItemType.DEPARTMENT,
  //           level: 1,
  //           isExpanded: false,
  //           parentId: 'store-15',
  //           hasChildren: false,
  //           data: {
  //             departmentName: 'Отдел Молочка',
  //             description: 'DepartmentDesc',
  //             budget: 1800000,
  //             storeCount: 1,
  //             employeeCount: 15,
  //           }
  //         }
  //       ]
  //     }
  //   ];
  // }

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