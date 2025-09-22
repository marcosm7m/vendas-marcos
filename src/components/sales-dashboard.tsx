'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AddSaleDialog } from '@/components/add-sale-dialog';
import { SalesTable } from '@/components/sales-table';
import type { Sale } from '@/lib/types';

const initialSales: Sale[] = [];

export default function SalesDashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const storedSales = localStorage.getItem('tinttrack-sales');
      if (storedSales) {
        setSales(JSON.parse(storedSales));
      } else {
        setSales(initialSales);
      }
    } catch (error) {
      console.error("Failed to load sales from localStorage", error);
      setSales(initialSales);
    } finally {
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('tinttrack-sales', JSON.stringify(sales));
      } catch (error) {
        console.error("Failed to save sales to localStorage", error);
      }
    }
  }, [sales, isMounted]);

  const handleSaleAdd = (newSale: Sale) => {
    setSales((prevSales) => [newSale, ...prevSales]);
  };

  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales;
    const lowercasedTerm = searchTerm.toLowerCase();
    return sales.filter(
      (sale) =>
        sale.customerName.toLowerCase().includes(lowercasedTerm) ||
        sale.customerCpf.includes(searchTerm)
    );
  }, [sales, searchTerm]);

  if (!isMounted) {
    return null; // Or a loading skeleton
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">TintTrack</h1>
        <p className="text-muted-foreground">Seu assistente para controle de vendas de tintas.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Histórico de Vendas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as suas vendas registradas.
          </CardDescription>
          <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <AddSaleDialog onSaleAdd={handleSaleAdd} />
          </div>
        </CardHeader>
        <CardContent>
          <SalesTable sales={filteredSales} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Mostrando {filteredSales.length} de {sales.length} vendas.
        </CardFooter>
      </Card>
    </>
  );
}
