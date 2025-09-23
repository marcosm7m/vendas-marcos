'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Sale } from '@/lib/types';
import { maskCpf } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EditSaleDialog } from './edit-sale-dialog';
import { useAuth } from './auth-provider';


type SalesTableProps = {
  sales: Sale[];
  onSaleDelete: (saleId: string) => void;
  onSaleUpdate: (sale: Sale) => void;
  loading: boolean;
};

const containerSizeMap = {
  lata: 'Lata',
  galao: 'Galão',
  balde: 'Balde',
};

export function SalesTable({ sales, onSaleDelete, onSaleUpdate, loading }: SalesTableProps) {
  const { user } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">CPF</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="hidden sm:table-cell">Data</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>
                <div className="font-medium">{sale.customerName}</div>
                <div className="text-sm text-muted-foreground md:hidden">
                  {maskCpf(sale.customerCpf)}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{maskCpf(sale.customerCpf)}</TableCell>
              <TableCell>
                <div>{sale.product}</div>
                {sale.observations && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {sale.observations}
                  </p>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {format(new Date(sale.date), "d MMM, yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{containerSizeMap[sale.containerSize]}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {user && user.uid === sale.userId ? (
                  <div className="flex items-center justify-end gap-2">
                    <EditSaleDialog sale={sale} onSaleUpdate={onSaleUpdate} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso irá deletar permanentemente a venda
                            dos seus registros.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onSaleDelete(sale.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : null }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
