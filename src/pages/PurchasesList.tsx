import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Truck, Trash2, ChevronRight, Calendar, Filter } from 'lucide-react';
import { usePurchaseStore, type Purchase } from '@/store/purchaseStore';
import { useSupplierStore } from '@/store/supplierStore';
import { useUIStore } from '@/store/uiStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';

type DateFilter = 'all' | 'today' | 'week' | 'month';

export function PurchasesListPage() {
  const navigate = useNavigate();
  const { purchases, loading, fetchPurchases } = usePurchaseStore();
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { addToast } = useUIStore();
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);

  useEffect(() => { fetchPurchases(); fetchSuppliers(); }, [fetchPurchases, fetchSuppliers]);

  const filtered = useMemo(() => {
    let result = purchases;
    if (supplierFilter !== 'all') result = result.filter((p) => p.supplier_id === supplierFilter);
    if (dateFilter !== 'all') {
      const now = new Date(); const start = new Date(now);
      if (dateFilter === 'today') start.setHours(0, 0, 0, 0);
      else if (dateFilter === 'week') start.setDate(now.getDate() - 7);
      else if (dateFilter === 'month') start.setMonth(now.getMonth() - 1);
      result = result.filter((p) => new Date(p.purchase_date) >= start);
    }
    return result;
  }, [purchases, supplierFilter, dateFilter]);

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Purchases</h1><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{purchases.length} {purchases.length === 1 ? 'purchase' : 'purchases'} total</p></div>
        <button onClick={() => navigate('/purchases/new')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"><Plus className="w-4 h-4" />New Purchase</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" /><select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"><option value="all">All Suppliers</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" /><select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"><option value="all">All Time</option><option value="today">Today</option><option value="week">Last 7 Days</option><option value="month">Last 30 Days</option></select></div>
      </div>
      {loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="w-full h-14" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12"><div className="text-center"><div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4"><Truck className="w-8 h-8 text-neutral-300 dark:text-neutral-600" /></div><h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">{purchases.length === 0 ? 'No purchases yet' : 'No purchases found'}</h3><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{purchases.length === 0 ? 'Record your first stock-in purchase.' : 'Try adjusting your filters.'}</p>{purchases.length === 0 && <button onClick={() => navigate('/purchases/new')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"><Plus className="w-4 h-4" />Make a Purchase</button>}</div></div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Bill #</th><th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Supplier</th><th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total</th><th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Payment</th><th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Status</th><th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Actions</th>
            </tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">{p.bill_number}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">{formatDate(p.purchase_date)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{p.supplier_name}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900 dark:text-white">{formatPrice(p.total)}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 capitalize">{p.payment_method}</span></td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${p.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'}`}>{p.status === 'paid' ? 'Paid' : 'Unpaid'}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1"><ChevronRight className="w-4 h-4 text-neutral-400" /></div></td>
                </tr>
              ))}
            </tbody></table></div>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2"><div><p className="text-sm font-semibold text-neutral-900 dark:text-white">{p.bill_number}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(p.purchase_date)}</p></div><span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${p.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'}`}>{p.status === 'paid' ? 'Paid' : 'Unpaid'}</span></div>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800"><div><p className="text-xs text-neutral-400 dark:text-neutral-500">{p.supplier_name}</p><p className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">{p.payment_method}</p></div><span className="text-sm font-bold text-neutral-900 dark:text-white">{formatPrice(p.total)}</span></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
