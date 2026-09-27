import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Building2, StickyNote, Pencil, Truck, Receipt } from 'lucide-react';
import { useSupplierStore } from '@/store/supplierStore';
import { usePurchaseStore, type Purchase } from '@/store/purchaseStore';
import { Skeleton } from '@/components/Skeleton';

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { suppliers, loading: supplierLoading, fetchSuppliers } = useSupplierStore();
  const { purchases, loading: purchasesLoading, fetchPurchases } = usePurchaseStore();

  useEffect(() => { fetchSuppliers(); fetchPurchases(); }, [fetchSuppliers, fetchPurchases]);

  const supplier = useMemo(() => suppliers.find((s) => s.id === id), [suppliers, id]);
  const supplierPurchases = useMemo(() => purchases.filter((p) => p.supplier_id === id), [purchases, id]);
  const totalPurchases = useMemo(() => supplierPurchases.reduce((sum, p) => sum + p.total, 0), [supplierPurchases]);

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (supplierLoading || purchasesLoading) {
    return <div className="max-w-4xl mx-auto space-y-5"><Skeleton className="w-24 h-9" /><div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4"><Skeleton className="w-32 h-8" /><Skeleton className="w-48 h-4" /></div><Skeleton className="w-full h-48" /></div>;
  }
  if (!supplier) {
    return <div className="max-w-4xl mx-auto space-y-5"><button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" />Back to Suppliers</button><div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center"><p className="text-sm text-neutral-500 dark:text-neutral-400">Supplier not found.</p></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" />Back to Suppliers</button>
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-neutral-400 flex items-center justify-center text-white dark:text-neutral-900 text-xl font-bold">{supplier.name.charAt(0).toUpperCase()}</div>
            <div><h1 className="text-xl font-bold text-neutral-900 dark:text-white">{supplier.name}</h1><p className="text-sm text-neutral-500 dark:text-neutral-400">Supplier since {formatDate(supplier.created_at)}</p></div>
          </div>
          <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"><Pencil className="w-4 h-4" /><span className="hidden sm:inline">Edit</span></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <InfoRow icon={Phone} label="Phone" value={supplier.phone} />
          {supplier.email && <InfoRow icon={Mail} label="Email" value={supplier.email} />}
          {supplier.company && <InfoRow icon={Building2} label="Company" value={supplier.company} />}
          {supplier.address && <InfoRow icon={MapPin} label="Address" value={supplier.address} />}
          {supplier.notes && <InfoRow icon={StickyNote} label="Notes" value={supplier.notes} />}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"><p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Total Purchases</p><p className="text-lg font-bold text-neutral-900 dark:text-white">{formatPrice(totalPurchases)}</p></div>
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"><p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Payable Balance</p><p className={`text-lg font-bold ${supplier.payable_balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatPrice(supplier.payable_balance)}</p></div>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Purchase History</h2>
        {supplierPurchases.length === 0 ? (
          <div className="py-8 text-center"><div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><Truck className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div><p className="text-sm text-neutral-400 dark:text-neutral-500">No purchases yet</p></div>
        ) : (
          <div className="space-y-2">
            {supplierPurchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"><Receipt className="w-4 h-4 text-neutral-400" /></div>
                  <div className="min-w-0"><p className="text-sm font-medium text-neutral-900 dark:text-white">{p.bill_number}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(p.purchase_date)} · {p.items.length} items</p></div>
                </div>
                <div className="text-right flex-shrink-0 ml-2"><p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatPrice(p.total)}</p><p className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">{p.payment_method}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (<div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"><Icon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" /><div className="min-w-0"><p className="text-xs text-neutral-400 dark:text-neutral-500">{label}</p><p className="text-sm text-neutral-900 dark:text-white break-words">{value}</p></div></div>);
}
