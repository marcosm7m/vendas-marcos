'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Sale } from '@/lib/types';

type SalesTableProps = {
  sales: Sale[];
};

const containerSizeMap = {
  lata: 'Lata',
  galao: 'Galão',
  balde: 'Balde',
};

export function SalesTable({ sales }: SalesTableProps) {
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
            <TableHead className="text-right">Tamanho</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>
                <div className="font-medium">{sale.customerName}</div>
                <div className="text-sm text-muted-foreground md:hidden">
                  {sale.customerCpf}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{sale.customerCpf}</TableCell>
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
              <TableCell className="text-right">
                <Badge variant="secondary">{containerSizeMap[sale.containerSize]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
