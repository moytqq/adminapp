// utils/addressTransformer.ts

import {
  ApiTreeItem,
  TreeItem,
  TreeItemType,
  AddressItem,
  StoreItem
} from '@/types/tree.types';

// Функция для извлечения номера дома из описания
const extractHouseNumber = (description: string): string => {
  if (!description) return '';

  const patterns = [
    /(\d+[\/\d]*\s*[а-яА-Яa-zA-Z]?)\s*$/,
    /(\d+[а-яА-Яa-zA-Z]?)\s*$/,
    /,\s*(\d+[\/\d]*\s*[а-яА-Яa-zA-Z]?)\s*$/
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return description;
};

// Функция для проверки наличия типа улицы в названии
const hasStreetType = (name: string): boolean => {
  const streetTypes = ['ул.', 'пр.', 'проспект', 'шоссе', 'пер.', 'переулок', 'наб.', 'бульвар', 'аллея', 'линия'];
  return streetTypes.some(type => name.includes(type));
};

// Функция для форматирования названия адреса
const formatAddressLabel = (name: string, description: string): string => {
  if (!description) return name;

  if (hasStreetType(name)) {
    const houseNumber = extractHouseNumber(description);
    if (houseNumber) {
      return `${name} ${houseNumber}`;
    }
    return name;
  } else {
    return description;
  }
};

// Функция для создания плоского списка магазинов (без адресов)
const createFlatStoreList = (
  stores: ApiTreeItem[],
  addressMap: Map<number, ApiTreeItem>
): TreeItem[] => {
  return stores.map(store => {
    const address = addressMap.get(store.parent_id);
    const addressLabel = address ? formatAddressLabel(address.name, address.description || '') : '';

    // Формируем название магазина с указанием адреса
    let storeLabel = store.name;
    const typeMatch = store.description?.match(/,\s*(\S+)$/);
    const storeType = typeMatch ? typeMatch[1] : '';

    if (storeType && !storeLabel.includes(storeType)) {
      storeLabel = `${storeLabel} (${storeType})`;
    }

    // Если есть адрес, добавляем его в название
    if (addressLabel && !storeLabel.includes(addressLabel)) {
      storeLabel = `${storeLabel} - ${addressLabel}`;
    }

    return {
      id: `store-${store.id}`,
      label: storeLabel,
      type: TreeItemType.STORE,
      level: 0,
      parentId: '0',
      isExpanded: false,
      hasChildren: false,
      data: {
        storeName: store.name,
        description: store.description || '',
        address: address?.description || '',
        phone: generatePhone(),
        email: `${store.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.ru`,
        revenue: Math.floor(Math.random() * 5000000) + 1000000,
        employeeCount: Math.floor(Math.random() * 50) + 5,
        openingDate: generateOpeningDate(),
        originalId: store.id
      }
    } as StoreItem;
  });
};

export const transformToAddressView = (
  apiItems: ApiTreeItem[],
  storeFilter: string | null = null
): TreeItem[] => {
  const addressApiItems = apiItems.filter(item => item.type === 'Address');
  let storeApiItems = apiItems.filter(item => item.type === 'Store');

  // Создаем мапу адресов для быстрого доступа
  const addressMap = new Map<number, ApiTreeItem>();
  addressApiItems.forEach(address => {
    addressMap.set(address.id, address);
  });

  // Применяем фильтр по типу магазина
  if (storeFilter) {
    storeApiItems = storeApiItems.filter(store => {
      const typeMatch = store.description?.match(/,\s*(\S+)$/);
      const type = typeMatch ? typeMatch[1] : '';
      const nameMatch = store.name?.match(/\(([^)]+)\)/);
      const nameType = nameMatch ? nameMatch[1] : '';
      return type === storeFilter || nameType === storeFilter;
    });
  }

  // Если фильтр активен - показываем плоский список магазинов
  if (storeFilter) {
    const flatStoreList = createFlatStoreList(storeApiItems, addressMap);
    flatStoreList.sort((a, b) => a.label.localeCompare(b.label));
    return flatStoreList;
  }

  // Без фильтра - показываем иерархию адресов
  const storesByAddress = new Map<number, ApiTreeItem[]>();

  storeApiItems.forEach(store => {
    const addressId = store.parent_id;
    if (!storesByAddress.has(addressId)) {
      storesByAddress.set(addressId, []);
    }
    storesByAddress.get(addressId)!.push(store);
  });

  const addressItems: AddressItem[] = addressApiItems
    .filter(address => storesByAddress.has(address.id))
    .map(addressApiItem => {
      const addressStores = storesByAddress.get(addressApiItem.id) || [];

      const formattedLabel = formatAddressLabel(
        addressApiItem.name,
        addressApiItem.description || ''
      );

      const storeItems: StoreItem[] = addressStores.map(storeApiItem => {
        return createStoreItem(storeApiItem, addressApiItem.id);
      });

      const addressItem: AddressItem = {
        id: `address-${addressApiItem.id}`,
        label: formattedLabel,
        type: TreeItemType.ADDRESS,
        level: 0,
        parentId: '0',
        isExpanded: false,
        hasChildren: storeItems.length > 0,
        children: storeItems,
        data: {
          addressName: addressApiItem.name,
          fullAddress: addressApiItem.description || '',
          storeCount: storeItems.length,
        }
      };

      return addressItem;
    });

  addressItems.sort((a, b) => a.label.localeCompare(b.label));

  return addressItems;
};

const createStoreItem = (
  storeApiItem: ApiTreeItem,
  addressId: number
): StoreItem => {
  let displayName = storeApiItem.name;
  const typeMatch = storeApiItem.description?.match(/,\s*(\S+)$/);
  const storeType = typeMatch ? typeMatch[1] : '';

  if (storeType && !displayName.includes(storeType)) {
    displayName = `${displayName} (${storeType})`;
  }

  return {
    id: `store-${storeApiItem.id}`,
    label: displayName,
    type: TreeItemType.STORE,
    level: 1,
    parentId: `address-${addressId}`,
    isExpanded: false,
    hasChildren: false,
    data: {
      storeName: storeApiItem.name,
      description: storeApiItem.description || '',
      address: '',
      phone: generatePhone(),
      email: `${storeApiItem.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.ru`,
      revenue: Math.floor(Math.random() * 5000000) + 1000000,
      employeeCount: Math.floor(Math.random() * 50) + 5,
      openingDate: generateOpeningDate(),
      originalId: storeApiItem.id
    }
  };
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