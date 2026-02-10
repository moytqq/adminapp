import {
  ApiTreeItem,
  TreeItem,
  TreeItemType,
  AddressItem,
  StoreItem
} from '@/types/tree.types';

export const transformToAddressView = (
  apiItems: ApiTreeItem[]
): TreeItem[] => {
  const addressApiItems = apiItems.filter(item => item.type === 'Address');
  const storeApiItems = apiItems.filter(item => item.type === 'Store');

  console.log('Address items:', addressApiItems.length);
  console.log('Store items:', storeApiItems.length);

  const storesByAddress = new Map<number, ApiTreeItem[]>();

  storeApiItems.forEach(store => {
    const addressId = store.parent_id;
    if (!storesByAddress.has(addressId)) {
      storesByAddress.set(addressId, []);
    }
    storesByAddress.get(addressId)!.push(store);
  });

  const addressItems: AddressItem[] = addressApiItems.map(addressApiItem => {
    const addressStores = storesByAddress.get(addressApiItem.id) || [];

    const storeItems: StoreItem[] = addressStores.map(storeApiItem => {
      return createStoreItem(storeApiItem, addressApiItem.id);
    });

    const addressItem: AddressItem = {
      id: `address-${addressApiItem.id}`,
      label: addressApiItem.name,
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

  console.log('Address view created with', addressItems.length, 'addresses');

  return addressItems;
};

const createStoreItem = (
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