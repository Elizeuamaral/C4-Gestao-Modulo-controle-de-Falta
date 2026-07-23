export interface Product {
  id: string;
  name: string;
  category: string;
  supplier: string;
  minStock: number; // Quantidade necessária em estoque
  unit: string;     // Unidade de medida (ex: un, kg, l)
  active?: boolean; // Status de ativo/inativo
}

export interface StockCount {
  productId: string;
  countedQty: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  countedQty: number;
  neededQty: number; // minStock
  purchaseQty: number; // neededQty - countedQty
  unit: string;
  supplier: string;
  category: string;
}

export interface Order {
  id: string;
  createdAt: string;
  recipientEmail: string;
  reporterName: string; // Quem fez a contagem / falta
  store: string;        // Loja selecionada
  items: OrderItem[];
  status: 'pending' | 'replenished';
}
