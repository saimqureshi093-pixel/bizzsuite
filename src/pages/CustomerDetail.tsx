import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  Pencil,
  ShoppingCart,
  Receipt,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { useSaleStore, type Sale } from '@/store/saleStore';
import { usePaymentStore, type Payment } from '@/store/paymentStore';
import { useUIStore } from '@/store/uiStore';
import { RecordPaymentModal } from '@/components/RecordPaymentModal';
import { Skeleton } from '@/components/Skeleton';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, loading: customerLoading, fetchCustomers } = useCustomerStore();
  const { sales, loading: salesLoading, fetchSales } = useSaleStore();
  const { payments, loading: paymentsLoading, fetchPayments } = usePaymentStore();
  const { addToast } = useUIStore();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchSales();
    if (id) fetchPayments(id);
  }, [fetchCustomers, fetchSales, fetchPayments, id]);

  const customer = useMemo(() => customers.find((c) => c.id === id), [customers, id]);
  const customerSales = useMemo(() => sales.filter((s) => s.customer_id === id), [sales, id]);
  const totalPurchases = useMemo(() => customerSales.reduce((sum, s) => sum + s.total, 0), [customerSales]);

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handlePaymentModalClose = () => {
    setPaymentModalOpen(false);
    if (id) fetchPayments(id);
  };

  if (customerLoading || salesLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Skeleton className="w-24 h-9" />
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 space-y-4">
          <Skeleton className="w-32 h-8" />
          <Skeleton className="w-48 h-4" />
          <Skeleton className="w-48 h-4" />
        </div>
        <Skeleton className="w-full h-48" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Customer not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </button>

      {/* Customer info card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-neutral-400 flex items-center justify-center text-white dark:text-neutral-900 text-xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{customer.name}</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Customer since {formatDate(customer.created_at)}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <InfoRow icon={Phone} label="Phone" value={customer.phone} />
          {customer.email && <InfoRow icon={Mail} label="Email" value={customer.email} />}
          {customer.address && <InfoRow icon={MapPin} label="Address" value={customer.address} />}
          {customer.notes && <InfoRow icon={StickyNote} label="Notes" value={customer.notes} />}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Total Purchases</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatPrice(totalPurchases)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Outstanding Balance</p>
            <p className={`text-lg font-bold ${customer.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatPrice(customer.balance)}
            </p>
          </div>
        </div>

        {/* Record Payment button */}
        {customer.balance > 0 && (
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Record Payment
          </button>
        )}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Payment History</h2>
          <div className="space-y-2">
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </div>
        </div>
      )}

      {/* Purchase history */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Purchase History</h2>
        {customerSales.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-sm text-neutral-400 dark:text-neutral-500">No purchases yet</p>
            <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">Sales for this customer will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customerSales.map((sale) => (
              <SaleRow key={sale.id} sale={sale} onClick={() => navigate(`/sales/invoice/${sale.id}`)} />
            ))}
          </div>
        )}
      </div>

      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={handlePaymentModalClose}
        customer={customer}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
      <Icon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{label}</p>
        <p className="text-sm text-neutral-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">{formatPrice(payment.amount)}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatDate(payment.payment_date)}
            {payment.note ? ` · ${payment.note}` : ''}
          </p>
        </div>
      </div>
      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2">
        Payment
      </span>
    </div>
  );
}

function SaleRow({ sale, onClick }: { sale: Sale; onClick: () => void }) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
          <Receipt className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">{sale.invoice_number}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(sale.created_at)} · {sale.items.length} items</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatPrice(sale.total)}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">{sale.payment_method}</p>
      </div>
    </button>
  );
}
