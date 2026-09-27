import { useState, useEffect, type FormEvent } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import { useSupplierStore, type Supplier } from '@/store/supplierStore';

type Props = { open: boolean; onClose: () => void; supplier?: Supplier | null };

type FormErrors = { name?: string; phone?: string; email?: string };

export function SupplierFormModal({ open, onClose, supplier }: Props) {
  const { addSupplier, updateSupplier } = useSupplierStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name); setPhone(supplier.phone); setEmail(supplier.email ?? '');
      setAddress(supplier.address ?? ''); setCompany(supplier.company ?? ''); setNotes(supplier.notes ?? '');
    } else {
      setName(''); setPhone(''); setEmail(''); setAddress(''); setCompany(''); setNotes('');
    }
    setErrors({});
  }, [supplier, open]);

  if (!open) return null;

  const validate = () => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone.trim()) e.phone = 'Phone is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const input = { name: name.trim(), phone: phone.trim(), email: email.trim() || null, address: address.trim() || null, company: company.trim() || null, notes: notes.trim() || null };
    const { error } = supplier ? await updateSupplier(supplier.id, input) : await addSupplier(input);
    setSubmitting(false);
    if (error) {
      if (error.includes('duplicate') || error.includes('unique')) setErrors({ phone: 'A supplier with this phone already exists' });
      else setErrors({ name: error });
    } else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Truck className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.name && errors.name !== 'Name is required' && !errors.name.includes('phone') && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400"><AlertCircle className="w-4 h-4" /><span>{errors.name}</span></div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Supplier"
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 ${errors.name ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'}`} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Phone <span className="text-red-500">*</span></label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 555 0100"
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 ${errors.phone ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'}`} />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Company <span className="text-neutral-400 font-normal">(optional)</span></label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. ABC Distributors"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email <span className="text-neutral-400 font-normal">(optional)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="supplier@example.com"
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 ${errors.email ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'}`} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Address <span className="text-neutral-400 font-normal">(optional)</span></label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City" rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Notes <span className="text-neutral-400 font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitting ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : supplier ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
