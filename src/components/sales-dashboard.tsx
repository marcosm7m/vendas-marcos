'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, LogOut } from 'lucide-react';
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
import { useAuth } from './auth-provider';
import { collection, query, getDocs, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SalesDashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'sales'),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const salesData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Sale)
        );
        setSales(salesData);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar vendas',
          description: 'Não foi possível carregar os dados. Verifique suas regras de segurança no Firebase.',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSales();
  }, [toast]);

  const handleSaleAdd = (newSale: Sale) => {
    setSales((prevSales) => [newSale, ...prevSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const handleSaleUpdate = async (updatedSale: Sale) => {
    try {
      const saleRef = doc(db, 'sales', updatedSale.id);
      await updateDoc(saleRef, {
        ...updatedSale
      });
      setSales((prevSales) =>
        prevSales.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale))
      );
      toast({
        title: 'Sucesso!',
        description: 'Venda atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a venda.',
      });
    }
  };

  const handleSaleDelete = async (saleId: string) => {
    try {
      await deleteDoc(doc(db, 'sales', saleId));
      setSales((prevSales) => prevSales.filter((sale) => sale.id !== saleId));
      toast({
        title: 'Sucesso!',
        description: 'Venda deletada com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível deletar a venda.',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
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

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold text-primary">TintTrack</h1>
          <p className="text-muted-foreground">Seu assistente para controle de vendas de tintas.</p>
        </div>
        {user && (
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2" />
            Sair
          </Button>
        )}
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
            {user && <AddSaleDialog onSaleAdd={handleSaleAdd} />}
          </div>
        </CardHeader>
        <CardContent>
          <SalesTable sales={filteredSales} onSaleDelete={handleSaleDelete} onSaleUpdate={handleSaleUpdate} loading={loading} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Mostrando {filteredSales.length} de {sales.length} vendas.
        </CardFooter>
      </Card>
    </>
  );
}
