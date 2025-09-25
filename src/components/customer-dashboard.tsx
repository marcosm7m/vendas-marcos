'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, LogOut, Users, User, ArrowRight } from 'lucide-react';
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
import type { Customer } from '@/lib/types';
import { useAuth } from './auth-provider';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { maskCpf } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export default function CustomerDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, 'customers'), orderBy('lastPurchase', 'desc'));
        const querySnapshot = await getDocs(q);
        const customersData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Customer)
        );
        setCustomers(customersData);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar clientes',
          description: 'Não foi possível carregar os dados. Verifique suas regras de segurança no Firestore.',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [user, toast]);

  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomers((prevCustomers) => {
      const existingCustomerIndex = prevCustomers.findIndex(c => c.id === updatedCustomer.id);
      let newCustomers;
      if (existingCustomerIndex > -1) {
        newCustomers = [...prevCustomers];
        newCustomers[existingCustomerIndex] = updatedCustomer;
      } else {
        newCustomers = [updatedCustomer, ...prevCustomers];
      }
      return newCustomers.sort((a, b) => new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime());
    });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercasedTerm) ||
        customer.cpf.includes(searchTerm.replace(/\D/g, ''))
    );
  }, [customers, searchTerm]);

  return (
    <>
      <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Users className='h-10 w-10 text-primary hidden sm:block' />
            <div>
                <h1 className="font-headline text-4xl font-bold text-primary">TintTrack</h1>
                <p className="text-muted-foreground">Seu assistente para controle de vendas de tintas.</p>
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
          <CardTitle className="font-headline text-2xl">Clientes</CardTitle>
          <CardDescription>
            Visualize todos os seus clientes. Clique em um cliente para ver o histórico de compras.
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
            {user && <AddSaleDialog onCustomerUpdate={handleCustomerUpdate} />}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center rounded-md border border-dashed p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCustomers.map(customer => (
                <Card 
                    key={customer.id} 
                    className="hover:shadow-lg hover:border-primary transition-all cursor-pointer flex flex-col"
                    onClick={() => router.push(`/customer/${customer.cpf}`)}
                >
                  <CardHeader className="flex-grow">
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <User className="text-primary"/> {customer.name}
                        </CardTitle>
                        <ArrowRight className="text-muted-foreground"/>
                    </div>
                    <CardDescription>{maskCpf(customer.cpf)}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">Última compra: {format(new Date(customer.lastPurchase), "d MMM, yyyy", { locale: ptBR })}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-md border border-dashed p-12 text-center">
              <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Mostrando {filteredCustomers.length} de {customers.length} clientes.
        </CardFooter>
      </Card>
    </>
  );
}
