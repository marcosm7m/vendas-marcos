'use client';
import { use, useEffect } from 'react';
import SalesDashboard from '@/components/sales-dashboard';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type PageProps = {
  params: {
    cpf: string;
  };
};

// Next.js now recommends this pattern for accessing params in Client Components.
// We keep the component's function signature clean and use `use` hook.
function CustomerPageComponent({ params }: PageProps) {
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

  // Decode CPF from URL
  const customerCpf = decodeURIComponent(params.cpf);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <SalesDashboard customerCpf={customerCpf} />
    </main>
  );
}

export default function CustomerPage({ params }: PageProps) {
  // `use(Promise)` is the new way to handle params, which are now Promises.
  // We can't use it directly in the main export, so we create a wrapper component.
  // This is a common pattern for this new Next.js feature.
  // However, for client components, directly accessing params is still supported
  // for migration. Let's fix it the simple way.
  return <CustomerPageComponent params={params} />;
}
