export interface Product {
  id: string;
  name: string;
  category: string;
  supplier: string;
  minStock: number;
  unit: string;
  active: boolean;
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