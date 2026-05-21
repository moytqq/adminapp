import { api } from './api';

export interface AddressOption {
  id: number;
  address_code: string;
  name: string;
  hid: number | null;
}

export interface SupplierOption {
  role: string;
  name: string;
}

export interface SkuItemSetting {
  id: number;
  address_code: string;
  sku_id: number;
  supplier_role: string | null;
  nz: number | null;
  max_stock: number | null;
  consumption_factor: number;
  // Обогащённые поля из sku_parameters
  sku_name: string | null;
  sku_name_short: string | null;
  packaging: string | null;
  order_multiple_sku: number | null;
  packaging_multiple_sku: number | null;
  // Суточный расход из sku_rashod
  daily_consumption_base: number | null;
  daily_consumption_effective: number | null;
}

export interface SupplierSetting {
  id: number;
  address_code: string;
  supplier_role: string;
  supplier_name: string;
  delivery_days: string | null;
  lead_time_days: number | null;
  min_order_sum: number | null;
  via_rc: number;
}

export const autoSettingsApi = {
  getAddresses: async (): Promise<AddressOption[]> => {
    try {
      const res = await api.get('/auto-orders/addresses');
      return res.data.status === 'success' ? res.data.data : [];
    } catch (e) {
      console.error('autoSettingsApi.getAddresses', e);
      return [];
    }
  },

  getItemSettings: async (address: string): Promise<{ items: SkuItemSetting[]; supplierOptions: SupplierOption[] }> => {
    try {
      const res = await api.get(`/auto-orders/items?address=${address}`);
      if (res.data.status === 'success') {
        return {
          items: res.data.data,
          supplierOptions: res.data.supplier_options ?? [],
        };
      }
      return { items: [], supplierOptions: [] };
    } catch (e) {
      console.error('autoSettingsApi.getItemSettings', e);
      return { items: [], supplierOptions: [] };
    }
  },

  updateItemSetting: async (
    address: string,
    sku_id: number,
    updates: Partial<Pick<SkuItemSetting, 'supplier_role' | 'nz' | 'max_stock' | 'consumption_factor'>>,
  ): Promise<boolean> => {
    try {
      const res = await api.put(`/auto-orders/items?address=${address}&sku_id=${sku_id}`, updates);
      return res.data.status === 'success';
    } catch (e) {
      console.error('autoSettingsApi.updateItemSetting', e);
      return false;
    }
  },

  getSupplierSettings: async (address: string): Promise<SupplierSetting[]> => {
    try {
      const res = await api.get(`/auto-orders/suppliers?address=${address}`);
      return res.data.status === 'success' ? res.data.data : [];
    } catch (e) {
      console.error('autoSettingsApi.getSupplierSettings', e);
      return [];
    }
  },

  updateSupplierSetting: async (
    address: string,
    supplier_role: string,
    updates: Partial<Pick<SupplierSetting, 'delivery_days' | 'lead_time_days' | 'min_order_sum' | 'via_rc'>>,
  ): Promise<boolean> => {
    try {
      const res = await api.put(
        `/auto-orders/suppliers?address=${address}&supplier_role=${encodeURIComponent(supplier_role)}`,
        updates,
      );
      return res.data.status === 'success';
    } catch (e) {
      console.error('autoSettingsApi.updateSupplierSetting', e);
      return false;
    }
  },

  recalculateConsumption: async (): Promise<{ updated: number } | null> => {
    try {
      const res = await api.post('/auto-orders/consumption/recalculate');
      return res.data.status === 'ok' ? { updated: res.data.updated } : null;
    } catch (e) {
      console.error('autoSettingsApi.recalculateConsumption', e);
      return null;
    }
  },
};
