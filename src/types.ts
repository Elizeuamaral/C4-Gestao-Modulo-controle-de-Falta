export interface Product {
  id: string;
  name: string;
  category: string;
  supplier: string;
  minStock: number;
  unit: string;
  active: boolean;
}

export interface ConferenceEntry {
  id: string;
  productId: string;
  productName: string;
  category: string;
  supplier: string;
  quantity: number;
  unit: string;
  lot: string;
  address: string;
  expirationDate?: string;
  receivedDate: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  countedQty: number;
  neededQty: number;
  purchaseQty: number;
  unit: string; // ← Unidade selecionada pelo usuário
  supplier: string;
  category: string;
}

export interface Order {
  id: string;
  createdAt: string;
  recipientEmail: string;
  reporterName: string;
  store: string;
  items: OrderItem[];
  status: 'pending' | 'replenished';
}