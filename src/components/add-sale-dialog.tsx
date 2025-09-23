'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Save } from 'lucide-react';
import { format } from 'date-fns';

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
  FormDescription,
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
import type { Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { maskCpf } from '@/lib/utils';

const formSchema = z.object({
  customerName: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  customerCpf: z
    .string()
    .min(11, 'CPF deve ter 11 dígitos.')
    .max(14, 'CPF inválido.') // 14 to account for mask
    .transform((cpf) => cpf.replace(/\D/g, '')), // Store only numbers
  customerPhone: z.string().min(10, {
    message: 'O telefone deve ter pelo menos 10 caracteres.',
  }),
  product: z.string().min(2, {
    message: 'O nome do produto deve ter pelo menos 2 caracteres.',
  }),
  containerSize: z.enum(['lata', 'galao', 'balde']),
  observations: z.string().optional(),
});

type AddSaleDialogProps = {
  onSaleAdd: (sale: Sale) => void;
};

export function AddSaleDialog({ onSaleAdd }: AddSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
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
    try {
      const newSale: Sale = {
        id: new Date().getTime().toString(),
        ...values,
        customerCpf: values.customerCpf.replace(/\D/g, ''), // Ensure it's just numbers
        date: new Date().toISOString(),
      };
      onSaleAdd(newSale);
      toast({
        title: 'Sucesso!',
        description: 'Venda registrada com sucesso.',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar a venda.',
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
            Preencha os detalhes da venda e do cliente.
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
                          setValue('customerCpf', maskCpf(value));
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
                    <FormLabel>Telefone</FormLabel>
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
