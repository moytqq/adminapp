import { TreeItem } from '@/types/tree.types';

export const fetchTreeData = async (): Promise<TreeItem[]> => {
  // Моковые данные для разработки
  return [
    {
      id: '1',
      label: 'Root Item 1',
      subLabel: '234 files',
      level: 0,
      isExpanded: false,
      children: [
        {
          id: '1-1',
          label: 'Child Item 1-1',
          subLabel: '234 files',
          level: 1,
          isExpanded: false,
          children: [
            {
              id: '1-1-1',
              label: 'Grandchild Item 1-1-1',
              subLabel: '234 files',
              level: 2,
              isExpanded: false,
            },
            {
              id: '1-1-2',
              label: 'Grandchild Item 1-1-2',
              subLabel: '234 files',
              level: 2,
              isExpanded: false,
            },
            {
              id: '1-1-3',
              label: 'Grandchild Item 1-1-3',
              subLabel: '234 files',
              level: 2,
              isExpanded: false,
              children: [
                {
                  id: '1-1-2-1',
                  label: 'Grandchild Item 1-1-3-1',
                  subLabel: '234 files',
                  level: 3,
                  isExpanded: false,
                },
                {
                  id: '1-1-2-2',
                  label: 'Grandchild Item 1-1-3-2',
                  subLabel: '234 files',
                  level: 3,
                  isExpanded: false,
                },
              ]
            },
          ],
        },
        {
          id: '1-2',
          label: 'Child Item 1-2',
          subLabel: '234 files',
          level: 1,
          isExpanded: false,
          children: [
            {
              id: '1-2-1',
              label: 'Grandchild Item 1-2-1',
              subLabel: '234 files',
              level: 2,
              isExpanded: false,
            },
            {
              id: '1-2-2',
              label: 'Grandchild Item 1-2-1',
              subLabel: '234 files',
              level: 2,
              isExpanded: false,
            },
            {
              id: '1-2-3',
              label: 'Grandchild Item 1-2-1',
              subLabel: '234 files',
              level: 2,
              isExpanded: false,
            },
          ]
        },
        {
          id: '1-3',
          label: 'Child Item 1-3',
          subLabel: '234 files',
          level: 1,
          isExpanded: false,
        },
      ],
    },
    {
      id: '2',
      label: 'Root Item 2',
      subLabel: '234 files',
      level: 0,
      isExpanded: false,
      children: [],
    },
  ];
};

export const toggleItemExpanded = (
  items: TreeItem[],
  itemId: string
): TreeItem[] => {
  return items.map(item => {
    if (item.id === itemId) {
      return { ...item, isExpanded: !item.isExpanded };
    }
    if (item.children) {
      return {
        ...item,
        children: toggleItemExpanded(item.children, itemId),
      };
    }
    return item;
  });
};

export const findItemPath = (
  items: TreeItem[],
  targetId: string,
  currentPath: string[] = []
): string[] => {
  for (const item of items) {
    const newPath = [...currentPath, item.id];

    if (item.id === targetId) {
      return newPath;
    }

    if (item.children) {
      const foundPath = findItemPath(item.children, targetId, newPath);
      if (foundPath.length > 0) {
        return foundPath;
      }
    }
  }

  return [];
};

/**
 * Находит элемент по ID
 */
export const findItemById = (
  items: TreeItem[],
  id: string
): TreeItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
};