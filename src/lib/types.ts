export type Sale = {
  id: string;
  userId: string;
  product: string;
  containerSize: 'lata' | 'galao' | 'balde';
  observations: string;
  date: string;
};

export type Customer = {
  id: string;
  cpf: string;
  name: string;
  phone: string;
  sales: Sale[];
  lastPurchase: string;
};
