import { api } from './api';

export interface OrderAccess {
  id: number;
  name: string;
  flag: string;
  order_id: string;
  start_day: string;
  end_day: string;
}

export interface AddressItem {
  address_id: string;
  address_name: string;
}

export interface SupplierItem {
  supplier_id: string;
  supplier_name: string;
}

export interface OrderItem {
  id: number;
  order_id: string;
  address: string;
  supplier: string;
  product_id: number;
  count: number;
  date: string;
  product_name: string;
  packaging_supplier: string;
  supplier_name: string;
}

export interface OrderAccessResponse {
  status: 'success' | 'error';
  data: OrderAccess[];
}

export interface AddressListResponse {
  status: 'success' | 'error';
  data: AddressItem[];
}

export interface SupplierListResponse {
  status: 'success' | 'error';
  data: SupplierItem[];
}

export interface OrderItemsResponse {
  status: 'success' | 'error';
  data: OrderItem[];
}

export const autoOrdersApi = {
  getOrderAccess: async (): Promise<OrderAccess[]> => {
    try {
      const response = await api.get<OrderAccessResponse>('/orders/get_order_access');
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching order access:', error);
      return [];
    }
  },

  getAddressList: async (orderId: string): Promise<AddressItem[]> => {
    try {
      const response = await api.get<AddressListResponse>(`/orders/get_address_list?order_id=${orderId}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching address list:', error);
      return [];
    }
  },

  getSupplierList: async (orderId: string): Promise<SupplierItem[]> => {
    try {
      const response = await api.get<SupplierListResponse>(`/orders/get_supplier_list?order_id=${orderId}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching supplier list:', error);
      return [];
    }
  },

  getOrdersByAddress: async (orderId: string, address: string, startDate: string, endDate: string): Promise<OrderItem[]> => {
    try {
      const response = await api.get<OrderItemsResponse>(
        `/orders/get_orders_address?order_id=${orderId}&address=${address}&start_date=${startDate}&end_date=${endDate}`
      );
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders by address:', error);
      return [];
    }
  },

  getOrdersBySupplier: async (orderId: string, supplier: string, startDate: string, endDate: string): Promise<OrderItem[]> => {
    try {
      const response = await api.get<OrderItemsResponse>(
        `/orders/get_orders_supplier?order_id=${orderId}&supplier=${supplier}&start_date=${startDate}&end_date=${endDate}`
      );
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders by supplier:', error);
      return [];
    }
  },
};