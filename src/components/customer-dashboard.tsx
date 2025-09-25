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
import type { Sale, Customer } from '@/lib/types';
import { useAuth } from './auth-provider';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
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
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
          description: 'Não foi possível carregar os dados.',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSales();
  }, [user, toast]);

  const handleSaleAdd = (newSale: Sale) => {
    setSales((prevSales) => [newSale, ...prevSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map<string, Customer>();
    sales.forEach(sale => {
      if (!customerMap.has(sale.customerCpf)) {
        customerMap.set(sale.customerCpf, {
          cpf: sale.customerCpf,
          name: sale.customerName,
          phone: sale.customerPhone,
          lastPurchase: sale.date,
        });
      }
    });
    return Array.from(customerMap.values());
  }, [sales]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return uniqueCustomers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return uniqueCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercasedTerm) ||
        customer.cpf.includes(searchTerm.replace(/\D/g, ''))
    );
  }, [uniqueCustomers, searchTerm]);

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
            {user && <AddSaleDialog onSaleAdd={handleSaleAdd} />}
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
                    key={customer.cpf} 
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
          Mostrando {filteredCustomers.length} de {uniqueCustomers.length} clientes.
        </CardFooter>
      </Card>
    </>
  );
}
