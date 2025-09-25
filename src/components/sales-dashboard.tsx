'use client';

import { useState, useEffect, useMemo } from 'react';
import { LogOut, User, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddSaleDialog } from '@/components/add-sale-dialog';
import type { Sale } from '@/lib/types';
import { useAuth } from './auth-provider';
import { collection, query, getDocs, deleteDoc, doc, orderBy, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { SalesTable } from './sales-table';

export default function SalesDashboard({ customerCpf }: { customerCpf: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSales = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(
          collection(db, 'sales'),
          where('customerCpf', '==', customerCpf),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const salesData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Sale)
        );
        setSales(salesData);
        if (salesData.length > 0) {
            setCustomerName(salesData[0].customerName);
        }
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar vendas',
          description: 'Não foi possível carregar os dados.',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (customerCpf) {
        fetchSales();
    }
  }, [user, customerCpf, toast]);

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

  return (
    <>
      <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
          <Users className='h-10 w-10 text-primary hidden sm:block' />
          <div>
            <Button variant="link" onClick={() => router.push('/')} className="p-0 h-auto text-muted-foreground">Clientes</Button>
            <h1 className="font-headline text-3xl font-bold text-primary">{customerName}</h1>
            <p className="text-muted-foreground">Histórico de compras do cliente.</p>
          </div>
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
          <div className='flex justify-between items-center'>
            <CardTitle className="font-headline text-2xl">Histórico de Vendas</CardTitle>
            {user && <AddSaleDialog onSaleAdd={handleSaleAdd} />}
          </div>
          <CardDescription>
            Visualize e gerencie todas as vendas para este cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesTable sales={sales} onSaleDelete={handleSaleDelete} onSaleUpdate={handleSaleUpdate} loading={loading} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Mostrando {sales.length} vendas.
        </CardFooter>
      </Card>
    </>
  );
}
