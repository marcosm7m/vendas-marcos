'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Save } from 'lucide-react';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Customer, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { maskCpf } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { db } from '@/lib/firebase';

const formSchema = z.object({
  customerName: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  customerCpf: z.string().transform((cpf) => cpf.replace(/\D/g, '')),
  customerPhone: z.string().optional(),
  product: z.string().min(2, {
    message: 'O nome do produto deve ter pelo menos 2 caracteres.',
  }),
  containerSize: z.enum(['lata', 'galao', 'balde']),
  observations: z.string().optional(),
});

type AddSaleDialogProps = {
  onCustomerUpdate: (customer: Customer) => void;
};

export function AddSaleDialog({ onCustomerUpdate }: AddSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerCpf: '',
      customerPhone: '',
      product: '',
      observations: '',
    },
  });

  const { formState, setValue, watch } = form;
  const customerCpf = watch('customerCpf');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para registrar uma venda.',
      });
      return;
    }
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('cpf', '==', values.customerCpf));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      const newSale: Sale = {
        id: new Date().getTime().toString(), // Unique ID for the sale within the array
        userId: user.uid,
        product: values.product,
        containerSize: values.containerSize,
        observations: values.observations || '',
        date: new Date().toISOString(),
      };

      let updatedCustomer: Customer;

      if (querySnapshot.empty) {
        // Customer doesn't exist, create new one
        const newCustomerRef = doc(customersRef);
        updatedCustomer = {
          id: newCustomerRef.id,
          cpf: values.customerCpf,
          name: values.customerName,
          phone: values.customerPhone || '',
          sales: [newSale],
          lastPurchase: newSale.date,
          createdBy: user.uid, // Add the creator's UID
        };
        batch.set(newCustomerRef, updatedCustomer);
      } else {
        // Customer exists, update it
        const customerDoc = querySnapshot.docs[0];
        const customerData = customerDoc.data() as Customer;
        const updatedSales = [...customerData.sales, newSale].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const customerUpdatePayload: Partial<Customer> = {
          name: values.customerName,
          sales: updatedSales,
          lastPurchase: updatedSales[0].date,
        };

        // Only update phone if a new one is provided
        if (values.customerPhone) {
          customerUpdatePayload.phone = values.customerPhone;
        }

        updatedCustomer = {
          ...customerData,
          ...customerUpdatePayload,
          phone: values.customerPhone || customerData.phone, // ensure phone is correct for local state update
        };
        
        batch.update(customerDoc.ref, customerUpdatePayload);
      }

      await batch.commit();

      onCustomerUpdate(updatedCustomer);
      toast({
        title: 'Sucesso!',
        description: 'Venda registrada e cliente atualizado.',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding/updating document: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar a venda. Verifique as regras de segurança.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2" />
          Adicionar Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Registrar Nova Venda</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da venda e do cliente. Se o cliente já existir, os dados dele serão atualizados.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123.456.789-00"
                        {...field}
                        onChange={(e) => {
                          const { value } = e.target;
                          setValue('customerCpf', value);
                        }}
                        value={maskCpf(customerCpf)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Tinta Acrílica Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="containerSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tamanho" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lata">Lata</SelectItem>
                        <SelectItem value="galao">Galão</SelectItem>
                        <SelectItem value="balde">Balde</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cor, acabamento, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2" />
                )}
                Salvar Venda
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
