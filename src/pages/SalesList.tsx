import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Receipt,
  Trash2,
  ChevronRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { useSaleStore, type Sale } from '@/store/saleStore';
import { useUIStore } from '@/store/uiStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';

type PaymentFilter = 'all' | 'cash' | 'card' | 'online' | 'credit';
type DateFilter = 'all' | 'today' | 'week' | 'month';

export function SalesListPage() {
  const navigate = useNavigate();
  const { sales, loading, fetchSales, deleteSale } = useSaleStore();
  const { addToast } = useUIStore();

  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filtered = useMemo(() => {
    let result = sales;

    if (paymentFilter !== 'all') {
      result = result.filter((s) => s.payment_method === paymentFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const start = new Date(now);
      if (dateFilter === 'today') start.setHours(0, 0, 0, 0);
      else if (dateFilter === 'week') start.setDate(now.getDate() - 7);
      else if (dateFilter === 'month') start.setMonth(now.getMonth() - 1);
      result = result.filter((s) => new Date(s.created_at) >= start);
    }

    return result;
  }, [sales, paymentFilter, dateFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteSale(deleteTarget);
    setDeleting(false);
    if (error) {
      addToast(error, 'error');
    } else {
      addToast(`Sale ${deleteTarget.invoice_number} deleted and stock restored`, 'success');
    }
    setDeleteTarget(null);
  };

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Sales</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {sales.length} {sales.length === 1 ? 'sale' : 'sales'} total
          </p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
            <option value="credit">Credit (Udhaar)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
              {sales.length === 0 ? 'No sales yet' : 'No sales found'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {sales.length === 0 ? 'Make your first sale to see it here.' : 'Try adjusting your filters.'}
            </p>
            {sales.length === 0 && (
              <button
                onClick={() => navigate('/sales/new')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Make a Sale
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Invoice #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Customer</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/sales/invoice/${sale.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">{sale.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">{formatDate(sale.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{sale.customer_name}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900 dark:text-white">{formatPrice(sale.total)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 capitalize">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                          sale.status === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        }`}>
                          {sale.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/sales/invoice/${sale.id}`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label="View invoice"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(sale)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            aria-label="Delete sale"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((sale) => (
              <div
                key={sale.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{sale.invoice_number}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(sale.created_at)}</p>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                    sale.status === 'paid'
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}>
                    {sale.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{sale.customer_name}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">{sale.payment_method}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{formatPrice(sale.total)}</span>
                    <button
                      onClick={() => navigate(`/sales/invoice/${sale.id}`)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Sale"
        message={`Are you sure you want to delete ${deleteTarget?.invoice_number}? Stock will be restored to products and customer balance will be adjusted if this was a credit sale.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
