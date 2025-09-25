export type Sale = {
  id: string;
  userId: string; // User who created the sale
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
  createdBy: string; // UID of the user who created this customer entry
};
