import {
  ApiTreeItem,
  TreeItem,
  TreeItemType,
  AddressItem,
  StoreItem
} from '@/types/tree.types';

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

const hasStreetType = (name: string): boolean => {
  const streetTypes = ['ул.', 'пр.', 'проспект', 'шоссе', 'пер.', 'переулок', 'наб.', 'бульвар', 'аллея',];
  return streetTypes.some(type => name.includes(type));
};

const extractStreetType = (name: string): string => {
  const streetTypes = ['ул.', 'пр.', 'проспект', 'шоссе', 'пер.', 'переулок', 'наб.', 'бульвар', 'аллея',];
  for (const type of streetTypes) {
    if (name.includes(type)) {
      return type;
    }
  }
  return '';
};

const extractStreetName = (name: string): string => {
  const streetType = extractStreetType(name);
  if (streetType) {
    let streetName = name.replace(streetType, '').trim();
    streetName = streetName.replace(/\s*\([^)]*\)/, '');
    return streetName;
  }
  return name;
};

const extractStoreType = (description: string): string => {
  const match = description?.match(/,\s*(\S+)$/);
  return match ? match[1] : '';
};

const formatStoreLabel = (storeName: string, description: string): string => {
  const streetType = extractStreetType(storeName);

  if (!streetType) {
    return description;
  }

  const streetName = extractStreetName(storeName);

  const streetNamePattern = new RegExp(`^${streetName}\\s+(\\d+[\\/\\d]*\\s*[а-яА-Яa-zA-Z]?)`);
  const match = description.match(streetNamePattern);

  if (match) {
    const houseNumber = match[1];
    const restOfDescription = description.substring(match[0].length);
    return `${streetName} ${streetType} ${houseNumber}${restOfDescription}`;
  }

  const houseNumberMatch = description.match(/(\d+[\/\d]*\s*[а-яА-Яa-zA-Z]?)/);
  if (houseNumberMatch) {
    const houseNumber = houseNumberMatch[0];
    return description.replace(houseNumber, `${streetType} ${houseNumber}`);
  }

  return description;
};

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

export const createStoreItem = (
  storeApiItem: ApiTreeItem,
  addressId: number
): StoreItem => {
  return {
    id: `store-${storeApiItem.id}`,
    label: storeApiItem.name,
    type: TreeItemType.STORE,
    level: 1,
    parentId: `address-${addressId}`,
    isExpanded: false,
    hasChildren: false,
    data: {
      storeName: storeApiItem.name,
      description: storeApiItem.description || '',
      address: storeApiItem.description || '',
      phone: '',
      email: '',
      revenue: 0,
      employeeCount: 0,
      openingDate: '',
      originalId: storeApiItem.id
    }
  };
};

export const transformToAddressView = (
  apiItems: ApiTreeItem[],
  storeFilter: string | null = null
): TreeItem[] => {
  const addressApiItems = apiItems.filter(item => item.type === 'Address');
  const storeApiItems = apiItems.filter(item => item.type === 'Store');

  const addressMap = new Map<number, ApiTreeItem>();
  addressApiItems.forEach(address => {
    addressMap.set(address.id, address);
  });

  let filteredStoreItems = storeApiItems;
  if (storeFilter) {
    filteredStoreItems = storeApiItems.filter(store => {
      const storeType = extractStoreType(store.description || '');
      const nameMatch = store.name?.match(/\(([^)]+)\)/);
      const nameType = nameMatch ? nameMatch[1] : '';
      return storeType === storeFilter || nameType === storeFilter;
    });
  }

  const storesByAddress = new Map<number, ApiTreeItem[]>();
  filteredStoreItems.forEach(store => {
    const addressId = store.parent_id;
    if (!storesByAddress.has(addressId)) {
      storesByAddress.set(addressId, []);
    }
    storesByAddress.get(addressId)!.push(store);
  });

  const addressItems: AddressItem[] = addressApiItems.map(addressApiItem => {
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
      children: storeItems.length > 0 ? storeItems : undefined,
      data: {
        addressName: addressApiItem.name,
        fullAddress: addressApiItem.description || '',
        storeCount: storeItems.length,
      }
    };

    return addressItem;
  });

  const visibleAddresses = addressItems;

  visibleAddresses.sort((a, b) => a.label.localeCompare(b.label));

  return visibleAddresses;
};