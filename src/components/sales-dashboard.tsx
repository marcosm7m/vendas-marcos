'use client';

import { useState, useEffect } from 'react';
import { LogOut, Users, Pencil, Phone, MessageSquare } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Sale, Customer } from '@/lib/types';
import { useAuth } from './auth-provider';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { SalesTable } from './sales-table';
import { EditCustomerDialog } from './edit-customer-dialog';
import { maskCpf } from '@/lib/utils';

export default function SalesDashboard({ customerCpf }: { customerCpf: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user || !customerCpf) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(
          collection(db, 'customers'),
          where('cpf', '==', customerCpf)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const customerDoc = querySnapshot.docs[0];
          setCustomer({ id: customerDoc.id, ...customerDoc.data() } as Customer);
        } else {
          toast({
            variant: 'destructive',
            title: 'Cliente não encontrado',
          });
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar cliente',
          description: 'Não foi possível carregar os dados.',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [user, customerCpf, toast]);
  
  const handleCustomerUpdate = (updatedCustomerData: Partial<Customer>) => {
    if (!customer) return;
    setCustomer(prevCustomer => {
        if (!prevCustomer) return null;
        return { ...prevCustomer, ...updatedCustomerData };
    });
  }

  const handleSaleUpdate = async (updatedSale: Sale) => {
    if (!customer) return;

    const updatedSales = customer.sales.map((sale) => 
      sale.id === updatedSale.id ? updatedSale : sale
    );
    
    const sortedSales = updatedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const updatedCustomer: Customer = {
      ...customer,
      sales: sortedSales,
      lastPurchase: sortedSales[0].date,
    };

    try {
      const customerRef = doc(db, 'customers', customer.id);
      await updateDoc(customerRef, {
        sales: updatedCustomer.sales,
        lastPurchase: updatedCustomer.lastPurchase,
      });
      setCustomer(updatedCustomer);
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
    if (!customer) return;

    const updatedSales = customer.sales.filter((sale) => sale.id !== saleId);

    const updatedCustomer: Customer = {
      ...customer,
      sales: updatedSales,
      lastPurchase: updatedSales.length > 0 ? updatedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : customer.lastPurchase,
    };

    try {
      const customerRef = doc(db, 'customers', customer.id);
      await updateDoc(customerRef, {
        sales: updatedCustomer.sales,
        lastPurchase: updatedCustomer.lastPurchase
      });
      setCustomer(updatedCustomer);
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
  
  const cleanPhoneNumber = (phone: string) => phone.replace(/\D/g, '');

  return (
    <>
      <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
          <Users className='h-10 w-10 text-primary hidden sm:block' />
          <div>
            <Button variant="link" onClick={() => router.push('/')} className="p-0 h-auto text-muted-foreground">Clientes</Button>
             <div className="flex items-center gap-2">
              <h1 className="font-headline text-3xl font-bold text-primary">{customer?.name || 'Carregando...'}</h1>
              {customer && <EditCustomerDialog customer={customer} onCustomerUpdate={handleCustomerUpdate} />}
            </div>
            <p className="text-muted-foreground">{customer ? maskCpf(customer.cpf) : '...'}</p>
             {customer?.phone && (
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <a href={`tel:${customer.phone}`} className="flex-grow">
                  <Button variant="outline" className="w-full">
                    <Phone className="mr-2" />
                    Ligar para o cliente
                  </Button>
                </a>
                <a href={`https://wa.me/55${cleanPhoneNumber(customer.phone)}`} target="_blank" rel="noopener noreferrer" className="flex-grow">
                   <Button variant="outline" className="w-full bg-green-500 text-white hover:bg-green-600 hover:text-white">
                    <MessageSquare className="mr-2" />
                    Chamar no WhatsApp
                  </Button>
                </a>
              </div>
            )}
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
          </div>
          <CardDescription>
            Visualize e gerencie todas as vendas para este cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesTable 
            sales={customer?.sales || []} 
            onSaleDelete={handleSaleDelete} 
            onSaleUpdate={handleSaleUpdate} 
            loading={loading} 
          />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Mostrando {customer?.sales.length || 0} vendas.
        </CardFooter>
      </Card>
    </>
  );
}
