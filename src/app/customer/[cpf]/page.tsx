'use client';

import { useEffect } from 'react';
import SalesDashboard from '@/components/sales-dashboard';
import { useAuth } from '@/components/auth-provider';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CustomerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const customerCpf = Array.isArray(params.cpf)
    ? decodeURIComponent(params.cpf[0])
    : decodeURIComponent(params.cpf as string);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <SalesDashboard customerCpf={customerCpf} />
    </main>
  );
}
