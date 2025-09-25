export type Sale = {
  id: string;
  userId: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  product: string;
  containerSize: 'lata' | 'galao' | 'balde';
  observations: string;
  date: string;
};

export type Customer = {
  cpf: string;
  name: string;
  phone: string;
  lastPurchase: string;
};
