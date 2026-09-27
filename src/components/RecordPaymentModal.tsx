import { useState, useEffect, type FormEvent } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { usePaymentStore } from '@/store/paymentStore';
import type { Customer } from '@/store/customerStore';

type RecordPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
};

type FormErrors = {
  amount?: string;
};

export function RecordPaymentModal({ open, onClose, customer }: RecordPaymentModalProps) {
  const { recordPayment } = usePaymentStore();

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setErrors({});
    }
  }, [open]);

  if (!open || !customer) return null;

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;

  const validate = () => {
    const e: FormErrors = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt)) e.amount = 'Amount is required';
    else if (amt <= 0) e.amount = 'Amount must be greater than 0';
    else if (amt > customer.balance) e.amount = `Amount exceeds outstanding balance of ${formatPrice(customer.balance)}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const { error } = await recordPayment({
      customer_id: customer.id,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      note: note.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      setErrors({ amount: error });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Record Payment</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Balance info */}
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Outstanding balance for <span className="font-semibold text-neutral-900 dark:text-white">{customer.name}</span>
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatPrice(customer.balance)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-7 pr-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.amount ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.amount}
              </p>
            )}
            {customer.balance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(customer.balance))}
                className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Pay full balance ({formatPrice(customer.balance)})
                </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Note <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Cash payment, bank transfer..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Record Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
