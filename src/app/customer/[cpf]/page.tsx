'use client';

import { useEffect } from 'react';
import SalesDashboard from '@/components/sales-dashboard';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type PageProps = {
  params: {
    cpf: string;
  };
};

export default function CustomerPage({ params }: PageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  const customerCpf = decodeURIComponent(params.cpf);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <SalesDashboard customerCpf={customerCpf} />
    </main>
  );
}
