'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

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
import type { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-provider';

const formSchema = z.object({
  customerName: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  customerPhone: z.string().optional(),
});

type EditCustomerDialogProps = {
  customer: Customer;
  onCustomerUpdate: (customerData: Partial<Customer>) => void;
};

export function EditCustomerDialog({ customer, onCustomerUpdate }: EditCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: customer.name,
      customerPhone: customer.phone,
    },
  });

  const { formState } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
         toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Você precisa estar logado para editar um cliente.',
        });
        return;
    }

    try {
        const customerRef = doc(db, 'customers', customer.id);
        const updatedData = {
            name: values.customerName,
            phone: values.customerPhone || '',
        }
        await updateDoc(customerRef, updatedData);
        
        onCustomerUpdate({ name: updatedData.name, phone: updatedData.phone });
        
        toast({
            title: 'Sucesso!',
            description: 'Dados do cliente atualizados.',
        });
        setOpen(false);

    } catch (error) {
        console.error("Error updating customer: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível atualizar os dados do cliente.',
        });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Editar Cliente</DialogTitle>
          <DialogDescription>
            Altere os dados do cliente. O CPF não pode ser alterado.
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
            </div>
            <DialogFooter>
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
