import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Arroz Integral 1kg', category: 'Mercearia', supplier: 'Camil Alimentos', minStock: 20, unit: 'un' },
  { id: '2', name: 'Feijão Carioca 1kg', category: 'Mercearia', supplier: 'Camil Alimentos', minStock: 15, unit: 'un' },
  { id: '3', name: 'Azeite de Oliva Extra Virgem 500ml', category: 'Mercearia', supplier: 'Andorinha', minStock: 10, unit: 'un' },
  { id: '4', name: 'Leite Integral UHT 1L', category: 'Laticínios', supplier: 'Itambé', minStock: 40, unit: 'un' },
  { id: '5', name: 'Queijo Muçarela Fatiado', category: 'Laticínios', supplier: 'Sadia', minStock: 12, unit: 'kg' },
  { id: '6', name: 'Detergente Líquido Neutro 500ml', category: 'Limpeza', supplier: 'Limpol', minStock: 30, unit: 'un' },
  { id: '7', name: 'Desinfetante Lavanda 1L', category: 'Limpeza', supplier: 'Ypê', minStock: 15, unit: 'un' },
  { id: '8', name: 'Papel Higiênico Folha Dupla p/ 12', category: 'Higiene', supplier: 'Neve', minStock: 10, unit: 'pct' },
  { id: '9', name: 'Sabonete em Barra 90g', category: 'Higiene', supplier: 'Nivea', minStock: 25, unit: 'un' },
  { id: '10', name: 'Café Torrado e Moído 500g', category: 'Mercearia', supplier: 'Melitta', minStock: 18, unit: 'un' },
  { id: '11', name: 'Água Mineral Sem Gás 500ml', category: 'Bebidas', supplier: 'Minalba', minStock: 100, unit: 'un' },
  { id: '12', name: 'Refrigerante Cola 2L', category: 'Bebidas', supplier: 'Coca-Cola', minStock: 50, unit: 'un' }
];

export const CATEGORIES = [
  'Mercearia',
  'Laticínios',
  'Limpeza',
  'Higiene',
  'Bebidas',
  'Outros'
];

export const SUPPLIERS = [
  'Camil Alimentos',
  'Andorinha',
  'Itambé',
  'Sadia',
  'Limpol',
  'Ypê',
  'Neve',
  'Nivea',
  'Melitta',
  'Minalba',
  'Coca-Cola',
  'Outros'
];
