import { TreeItem } from '@/types/tree.types';

export const customSortSalesDepartment = (items: TreeItem[]): TreeItem[] => {
  const itemsCopy = [...items];

  const desiredOrder = ['Удачный', 'Кулинария', 'Свежий хлеб'];

  const orderedItems: TreeItem[] = [];
  const otherItems: TreeItem[] = [];

  itemsCopy.forEach(item => {
    if (desiredOrder.includes(item.label)) {
      orderedItems.push(item);
    } else {
      otherItems.push(item);
    }
  });

  orderedItems.sort((a, b) => {
    const indexA = desiredOrder.indexOf(a.label);
    const indexB = desiredOrder.indexOf(b.label);
    return indexA - indexB;
  });

  otherItems.sort((a, b) => a.label.localeCompare(b.label));

  const result = [...orderedItems, ...otherItems];

  console.log('Custom sort result:', result.map(item => item.label));

  return result;
};

export const isSalesDepartment = (item: TreeItem): boolean => {
  return item.type === 'Department' &&
    (item.label.includes('ПРОДАЖ') ||
      item.label.includes('Продаж') ||
      item.label.includes('продаж') ||
      item.label === 'Департамент продаж');
};

export const applyCustomSortToTree = (items: TreeItem[]): TreeItem[] => {
  return items.map(item => {
    let processedItem = { ...item };

    if (item.children && item.children.length > 0) {
      processedItem.children = applyCustomSortToTree(item.children);
    }

    if (isSalesDepartment(processedItem) && processedItem.children && processedItem.children.length > 0) {
      console.log('Applying custom sort to Sales Department:', processedItem.label);
      console.log('Original order:', processedItem.children.map(c => c.label));

      const sortedChildren = customSortSalesDepartment(processedItem.children);

      console.log('New order:', sortedChildren.map(c => c.label));

      return {
        ...processedItem,
        children: sortedChildren
      };
    }

    return processedItem;
  });
};