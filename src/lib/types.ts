export type Sale = {
  id: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  product: string;
  containerSize: 'lata' | 'galao' | 'balde';
  observations: string;
  date: string;
};
