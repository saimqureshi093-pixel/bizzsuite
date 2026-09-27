import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  Layers,
} from 'lucide-react';
import { useSaleStore, type Sale } from '@/store/saleStore';
import { useAuth } from '@/lib/auth';
import { useSettingsStore, getCurrencySymbol } from '@/store/settingsStore';
import { Skeleton } from '@/components/Skeleton';

export function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sales, loading, fetchSales } = useSaleStore();
  const { profile } = useAuth();
  const { settings } = useSettingsStore();

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const sale = useMemo(() => sales.find((s) => s.id === id), [sales, id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Skeleton className="w-24 h-9" />
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sales
        </button>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Invoice not found.</p>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(settings?.currency ?? 'USD');
  const formatPrice = (n: number) => `${currencySymbol}${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const businessName = settings?.business_name ?? profile?.business_name ?? 'Your Business';
  const businessEmail = settings?.email ?? profile?.email ?? '';
  const businessPhone = settings?.phone ?? '';
  const businessAddress = settings?.address ?? '';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Use browser print dialog — user can save as PDF
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Action bar — hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sales
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="print-area bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 sm:p-10 print:border-0 print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={businessName} className="w-11 h-11 rounded-xl object-cover" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white dark:text-neutral-900" style={{ width: 22, height: 22 }} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{businessName}</h1>
              {businessAddress && <p className="text-xs text-neutral-500 dark:text-neutral-400">{businessAddress}</p>}
              {businessPhone && <p className="text-xs text-neutral-500 dark:text-neutral-400">{businessPhone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">INVOICE</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{sale.invoice_number}</p>
          </div>
        </div>

        {/* Invoice meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Bill To</p>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{sale.customer_name}</p>
            {sale.customer_id && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Registered customer</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Date</p>
            <p className="text-sm text-neutral-900 dark:text-white">{formatDate(sale.created_at)}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{formatTime(sale.created_at)}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Item</th>
                <th className="text-center py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Qty</th>
                <th className="text-right py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Unit Price</th>
                <th className="text-right py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm text-neutral-900 dark:text-white">
                    {item.name}
                    {item.sku && <span className="block text-xs text-neutral-400 dark:text-neutral-500">SKU: {item.sku}</span>}
                  </td>
                  <td className="py-3 text-center text-sm text-neutral-600 dark:text-neutral-400">{item.qty}</td>
                  <td className="py-3 text-right text-sm text-neutral-600 dark:text-neutral-400">{formatPrice(item.unit_price)}</td>
                  <td className="py-3 text-right text-sm font-medium text-neutral-900 dark:text-white">{formatPrice(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
              <span className="text-neutral-900 dark:text-white font-medium">{formatPrice(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Discount</span>
                <span className="text-red-500 font-medium">-{formatPrice(sale.discount)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Tax</span>
                <span className="text-neutral-900 dark:text-white font-medium">+{formatPrice(sale.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-base font-bold text-neutral-900 dark:text-white">Total</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(sale.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-1">Payment Method</p>
            <p className="text-sm text-neutral-900 dark:text-white capitalize">{sale.payment_method}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-1">Status</p>
            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
              sale.status === 'paid'
                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
            }`}>
              {sale.status === 'paid' ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Thank you for your business!
          </p>
          <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">
            {businessName}{businessEmail ? ` · ${businessEmail}` : ''}{businessPhone ? ` · ${businessPhone}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
