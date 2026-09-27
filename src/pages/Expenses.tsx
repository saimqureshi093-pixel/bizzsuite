import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { Plus, Search, Pencil, Trash2, Receipt, X, AlertCircle, TrendingDown, Calendar, Filter } from 'lucide-react';
import { useExpenseStore, DEFAULT_EXPENSE_CATEGORIES, type Expense } from '@/store/expenseStore';
import { useUIStore } from '@/store/uiStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';

type FormErrors = { amount?: string; category?: string };

export function ExpensesPage() {
  const { expenses, loading, fetchExpenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const allCategories = useMemo(() => {
    const cats = new Set(DEFAULT_EXPENSE_CATEGORIES);
    expenses.forEach((e) => cats.add(e.category));
    return Array.from(cats);
  }, [expenses]);

  const filtered = useMemo(() => {
    let result = expenses;
    if (categoryFilter !== 'all') result = result.filter((e) => e.category === categoryFilter);
    if (dateFilter !== 'all') {
      const now = new Date(); const start = new Date(now);
      if (dateFilter === 'today') start.setHours(0, 0, 0, 0);
      else if (dateFilter === 'week') start.setDate(now.getDate() - 7);
      else if (dateFilter === 'month') start.setMonth(now.getMonth() - 1);
      result = result.filter((e) => new Date(e.expense_date) >= start);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.category.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q)));
    }
    return result;
  }, [expenses, categoryFilter, dateFilter, search]);

  const totalExpenses = useMemo(() => filtered.reduce((sum, e) => sum + e.amount, 0), [filtered]);

  // Monthly chart data (last 6 months)
  const chartData = useMemo(() => {
    const months: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const total = expenses.filter((e) => {
        const ed = new Date(e.expense_date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
      }).reduce((sum, e) => sum + e.amount, 0);
      months.push({ label, total });
    }
    return months;
  }, [expenses]);

  const maxChartVal = Math.max(...chartData.map((d) => d.total), 1);

  const openAdd = () => {
    setEditingExpense(null); setCategory(DEFAULT_EXPENSE_CATEGORIES[0]); setCustomCategory(''); setIsCustom(false);
    setAmount(''); setExpenseDate(new Date().toISOString().slice(0, 10)); setNote(''); setPaymentMethod('cash'); setErrors({});
    setModalOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditingExpense(e); setCategory(allCategories.includes(e.category) ? e.category : 'Misc');
    if (!DEFAULT_EXPENSE_CATEGORIES.includes(e.category) && !allCategories.slice(0, 5).includes(e.category)) { setIsCustom(true); setCustomCategory(e.category); } else setIsCustom(false);
    setAmount(String(e.amount)); setExpenseDate(e.expense_date); setNote(e.note ?? ''); setPaymentMethod(e.payment_method); setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: FormErrors = {};
    const finalCat = isCustom ? customCategory.trim() : category;
    if (!finalCat) e.category = 'Category is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Amount must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const finalCat = isCustom ? customCategory.trim() : category;
    const input = { category: finalCat, amount: Number(amount), expense_date: expenseDate, note: note.trim() || null, payment_method: paymentMethod };
    const { error } = editingExpense ? await updateExpense(editingExpense.id, input) : await addExpense(input);
    setSubmitting(false);
    if (error) setErrors({ amount: error }); else { setModalOpen(false); addToast(editingExpense ? 'Expense updated' : 'Expense added', 'success'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteExpense(deleteTarget.id);
    setDeleting(false);
    if (error) addToast(error, 'error'); else addToast('Expense deleted', 'success');
    setDeleteTarget(null);
  };

  const formatPrice = (n: number) => `$${Number(n).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Expenses</h1><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} · Total: {formatPrice(totalExpenses)}</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"><Plus className="w-4 h-4" />Add Expense</button>
      </div>

      {/* Monthly chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="text-base font-semibold text-neutral-900 dark:text-white">Monthly Expenses</h2><span className="text-xs text-neutral-400 dark:text-neutral-500">Last 6 months</span></div>
        {expenses.length === 0 ? (
          <div className="h-48 flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3"><TrendingDown className="w-6 h-6 text-neutral-300 dark:text-neutral-600" /></div><p className="text-sm text-neutral-400 dark:text-neutral-500">No expense data yet</p></div></div>
        ) : (
          <div className="h-48 flex items-end gap-3">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="w-full rounded-t bg-amber-500/80 dark:bg-amber-400/80 hover:bg-amber-500 dark:hover:bg-amber-400 transition-colors" style={{ height: `${(d.total / maxChartVal) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }} />
                {d.total > 0 && <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 dark:bg-neutral-700 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">{formatPrice(d.total)}</div>}
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by category or note..." className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" /></div>
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" /><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"><option value="all">All Categories</option>{allCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" /><select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"><option value="all">All Time</option><option value="today">Today</option><option value="week">Last 7 Days</option><option value="month">Last 30 Days</option></select></div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="w-full h-14" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12"><div className="text-center"><div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4"><Receipt className="w-8 h-8 text-neutral-300 dark:text-neutral-600" /></div><h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">{expenses.length === 0 ? 'No expenses yet' : 'No expenses found'}</h3><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{expenses.length === 0 ? 'Track your business expenses here.' : 'Try adjusting your filters.'}</p>{expenses.length === 0 && <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"><Plus className="w-4 h-4" />Add your first expense</button>}</div></div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Category</th><th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Amount</th><th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Payment</th><th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Note</th><th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Actions</th>
            </tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{formatDate(e.expense_date)}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">{e.category}</span></td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900 dark:text-white">{formatPrice(e.amount)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 capitalize">{e.payment_method}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs truncate">{e.note || '—'}</td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(e)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><Pencil className="w-4 h-4" /></button><button onClick={() => setDeleteTarget(e)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody></table></div>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((e) => (
              <div key={e.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2"><div><p className="text-sm font-medium text-neutral-900 dark:text-white">{e.category}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(e.expense_date)} · <span className="capitalize">{e.payment_method}</span></p></div><span className="text-sm font-bold text-neutral-900 dark:text-white">{formatPrice(e.amount)}</span></div>
                {e.note && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">{e.note}</p>}
                <div className="flex gap-1 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800"><button onClick={() => openEdit(e)} className="flex-1 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Edit</button><button onClick={() => setDeleteTarget(e)} className="flex-1 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 rounded-t-2xl">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"><Receipt className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /></div><h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2></div>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {errors.amount && errors.amount !== 'Amount must be greater than 0' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400"><AlertCircle className="w-4 h-4" /><span>{errors.amount}</span></div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Category</label>
                {isCustom ? (
                  <div className="flex gap-2"><input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="New category" className="flex-1 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /><button type="button" onClick={() => { setIsCustom(false); setCustomCategory(''); }} className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm transition-colors">List</button></div>
                ) : (
                  <div className="flex gap-2"><select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">{allCategories.map((c) => <option key={c} value={c}>{c}</option>)}</select><button type="button" onClick={() => setIsCustom(true)} className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm whitespace-nowrap">+ New</button></div>
                )}
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Amount <span className="text-red-500">*</span></label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span><input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`w-full pl-7 pr-3.5 py-2.5 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 ${errors.amount ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700 focus:border-emerald-500'}`} /></div>
                {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Date <span className="text-red-500">*</span></label>
                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['cash', 'card', 'online'] as string[]).map((m) => (
                    <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${paymentMethod === m ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Note <span className="text-neutral-400 font-normal">(optional)</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any notes..." rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">{submitting ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : editingExpense ? 'Save Changes' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Expense" message={`Are you sure you want to delete this ${deleteTarget?.category} expense of ${deleteTarget ? formatPrice(deleteTarget.amount) : ''}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
